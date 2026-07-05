"""Cognee Cloud REST client — lifecycle ops, graph, audit log."""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException

CALL_LOG: List[Dict[str, Any]] = []
_CALL_LOG_MAX = 200
_DATASET_IDS: Dict[str, str] = {}

MEMIFY_PROMPT = (
    "You are consolidating agent memory for a QA audit. Extract temporal ordering, "
    "causal links, contradictions between facts, and which evidence supersedes older decisions. "
    "Prefer relationships connecting evidence from different sources and dates."
)


def get_call_log(limit: int = 50) -> List[Dict[str, Any]]:
    return list(reversed(CALL_LOG[-limit:]))


def _log_call(op: str, dataset: str, ms: float, ok: bool, detail: str = "") -> None:
    CALL_LOG.append(
        {
            "op": op,
            "dataset": dataset,
            "ms": round(ms, 1),
            "ok": ok,
            "detail": detail[:300],
            "t": time.time(),
        }
    )
    del CALL_LOG[:-_CALL_LOG_MAX]


class CogneeHttpClient:
    def __init__(self, base_url: str, api_key: str, session_id: str, default_dataset: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.session_id = session_id
        self.default_dataset = default_dataset
        self._headers = {"X-Api-Key": api_key}
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=self._headers,
                timeout=httpx.Timeout(120.0, connect=30.0),
                follow_redirects=True,
            )
        return self._client

    async def aclose(self) -> None:
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
        self._client = None

    async def _request(
        self,
        op: str,
        method: str,
        path: str,
        dataset: str = "",
        *,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Any:
        start = time.perf_counter()
        try:
            response = await self._get_client().request(
                method, path, json=json, data=data, files=files, params=params
            )
            ms = (time.perf_counter() - start) * 1000
            if response.status_code < 300:
                _log_call(op, dataset, ms, True)
                if not response.content:
                    return {}
                try:
                    return response.json()
                except ValueError:
                    return {"raw": response.text}
            _log_call(op, dataset, ms, False, f"{response.status_code}: {response.text[:200]}")
            raise HTTPException(status_code=response.status_code, detail=response.text[:500])
        except httpx.HTTPError as exc:
            ms = (time.perf_counter() - start) * 1000
            _log_call(op, dataset, ms, False, str(exc))
            raise HTTPException(status_code=503, detail=f"Cannot reach Cognee Cloud: {exc}") from exc

    async def ping(self) -> int:
        response = await self._get_client().get("/api/v1/datasets/")
        return response.status_code

    async def list_datasets(self) -> List[Dict[str, Any]]:
        result = await self._request("datasets.list", "GET", "/api/v1/datasets/", self.default_dataset)
        if isinstance(result, list):
            return result
        return result.get("datasets", [])

    async def dataset_id_for_name(self, dataset: str) -> Optional[str]:
        if dataset in _DATASET_IDS:
            return _DATASET_IDS[dataset]
        for ds in await self.list_datasets():
            if ds.get("name") == dataset:
                ds_id = str(ds.get("id"))
                _DATASET_IDS[dataset] = ds_id
                return ds_id
        return None

    async def list_data_items(self, dataset: str) -> List[Dict[str, Any]]:
        ds_id = await self.dataset_id_for_name(dataset)
        if not ds_id:
            return []
        result = await self._request("datasets.data", "GET", f"/api/v1/datasets/{ds_id}/data", dataset)
        if isinstance(result, list):
            return result
        return result.get("data", [])

    async def remember_fact(
        self,
        fact_id: str,
        text: str,
        dataset: str,
        *,
        sensitivity: Optional[str] = None,
        resolve_data_id: bool = True,
    ) -> Dict[str, Any]:
        node_sets: List[str] = [fact_id]
        if sensitivity in ("private", "secret"):
            node_sets.append("private")
        result = await self._request(
            "remember",
            "POST",
            "/api/v1/remember",
            dataset,
            data={"datasetName": dataset, "node_set": node_sets},
            files={"data": (f"{fact_id}.txt", text.encode("utf-8"), "text/plain")},
        )
        data_id = None
        if resolve_data_id:
            try:
                id_by_name = {str(item.get("name")): str(item.get("id")) for item in await self.list_data_items(dataset)}
                data_id = id_by_name.get(fact_id)
            except HTTPException:
                pass
        return {"fact_id": fact_id, "data_id": data_id, "dataset_id": result.get("dataset_id")}

    async def resolve_data_ids(self, dataset: str, fact_ids: List[str]) -> Dict[str, str]:
        """Batch-resolve Cognee data IDs after parallel remember() calls."""
        if not fact_ids:
            return {}
        try:
            id_by_name = {str(item.get("name")): str(item.get("id")) for item in await self.list_data_items(dataset)}
            return {fid: id_by_name[fid] for fid in fact_ids if fid in id_by_name}
        except HTTPException:
            return {}

    async def remember_entry(self, *, question: str, answer: str, dataset_name: Optional[str] = None) -> Dict[str, Any]:
        dataset = dataset_name or self.default_dataset
        payload = {
            "entry": {"type": "qa", "question": question, "answer": answer},
            "dataset_name": dataset,
            "session_id": self.session_id,
        }
        return await self._request("remember.entry", "POST", "/api/v1/remember/entry", dataset, json=payload)

    async def recall(
        self,
        query: str,
        dataset: Optional[str] = None,
        *,
        search_type: str = "GRAPH_COMPLETION",
        include_references: bool = True,
        exclude_node_sets: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        ds = dataset or self.default_dataset
        payload: Dict[str, Any] = {
            "query": query,
            "datasets": [ds],
            "searchType": search_type,
            "topK": 10,
            "includeReferences": include_references,
            "sessionId": self.session_id,
        }
        if exclude_node_sets:
            payload["excludeNodeSets"] = exclude_node_sets
        op = "recall"
        if search_type == "TEMPORAL":
            op = "recall.temporal"
        elif search_type == "FEEDBACK":
            op = "recall.feedback"
        data = await self._request(op, "POST", "/api/v1/recall", ds, json=payload)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and isinstance(data.get("value"), list):
            return data["value"]
        if isinstance(data, dict):
            return [data]
        return [{"text": str(data), "source": "cognee"}]

    async def improve(
        self,
        dataset: str,
        correction: str,
        *,
        feedback_query: Optional[str] = None,
        references: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Feedback-driven repair — reweights graph edges, does not delete data."""
        try:
            return await self._request(
                "improve",
                "POST",
                "/api/v1/improve",
                dataset,
                json={"datasetName": dataset, "data": correction},
            )
        except HTTPException as exc:
            if exc.status_code not in (404, 405, 501):
                raise

            resolved_refs = list(references or [])
            if feedback_query and not resolved_refs:
                try:
                    feedback_hits = await self.recall(
                        feedback_query,
                        dataset,
                        search_type="GRAPH_COMPLETION",
                        include_references=True,
                    )
                    for hit in feedback_hits[:3]:
                        for ref in hit.get("references", []) or hit.get("citations", []) or []:
                            if isinstance(ref, dict):
                                resolved_refs.append(ref)
                except HTTPException:
                    pass

            payload = {
                "entry": {
                    "type": "feedback",
                    "content": correction,
                    "references": resolved_refs,
                },
                "dataset_name": dataset,
                "session_id": self.session_id,
            }
            try:
                return await self._request(
                    "improve.feedback",
                    "POST",
                    "/api/v1/remember/entry",
                    dataset,
                    json=payload,
                )
            except HTTPException:
                return await self.remember_entry(
                    question=feedback_query or "MemGateQA correction",
                    answer=correction,
                    dataset_name=dataset,
                )

    async def memify(self, dataset: str, *, background: bool = True) -> Dict[str, Any]:
        return await self._request(
            "memify",
            "POST",
            "/api/v1/cognify",
            dataset,
            json={
                "datasets": [dataset],
                "customPrompt": MEMIFY_PROMPT,
                "runInBackground": background,
            },
        )

    async def forget(self, dataset: str, *, data_id: Optional[str] = None, fact_id: Optional[str] = None) -> Dict[str, Any]:
        resolved_id = data_id
        if resolved_id is None and fact_id:
            for item in await self.list_data_items(dataset):
                if str(item.get("name")) == fact_id:
                    resolved_id = str(item.get("id"))
                    break
        if resolved_id:
            try:
                return await self._request(
                    "forget",
                    "POST",
                    "/api/v1/forget",
                    dataset,
                    json={"dataset": dataset, "dataId": resolved_id},
                )
            except HTTPException:
                ds_id = await self.dataset_id_for_name(dataset)
                if ds_id:
                    return await self._request(
                        "forget.delete",
                        "DELETE",
                        f"/api/v1/datasets/{ds_id}/data/{resolved_id}",
                        dataset,
                    )
        raise HTTPException(status_code=404, detail=f"No data item to forget in dataset {dataset}")

    async def get_graph(self, dataset: str) -> Dict[str, Any]:
        ds_id = await self.dataset_id_for_name(dataset)
        if not ds_id:
            return {"nodes": [], "edges": []}
        result = await self._request("graph", "GET", f"/api/v1/datasets/{ds_id}/graph", dataset)
        return {"nodes": result.get("nodes", []), "edges": result.get("edges", [])}

    async def schema_inventory(self, dataset: str, *, samples_per_type: int = 3) -> Dict[str, Any]:
        ds_id = await self.dataset_id_for_name(dataset)
        if not ds_id:
            return {"types": [], "total_entities": 0}
        return await self._request(
            "schema.inventory",
            "GET",
            "/api/v1/schema/inventory",
            dataset,
            params={"dataset_id": ds_id, "samples_per_type": samples_per_type, "sort": "count"},
        )

    async def schema_provenance(self, *, include_memory: bool = False) -> Dict[str, Any]:
        return await self._request(
            "schema.provenance",
            "GET",
            "/api/v1/schema/provenance",
            "",
            params={"include_memory": str(include_memory).lower()},
        )

    async def activity_spans(self, *, limit: int = 50) -> Dict[str, Any]:
        return await self._request(
            "activity.spans",
            "GET",
            "/api/v1/activity/spans",
            "",
            params={"limit": limit},
        )

    async def export_dataset(self, dataset: str) -> bytes:
        ds_id = await self.dataset_id_for_name(dataset)
        if not ds_id:
            return b"{}"
        response = await self._get_client().get(f"/api/v1/activity/export/{ds_id}")
        _log_call("activity.export", dataset, 0, response.status_code < 300)
        if response.status_code >= 300:
            raise HTTPException(status_code=response.status_code, detail=response.text[:500])
        return response.content

    async def rbac_probe(self) -> bool:
        try:
            await self._request("permissions.tenants", "GET", "/api/v1/permissions/tenants", "")
            return True
        except HTTPException:
            return False