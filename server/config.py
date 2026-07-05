"""Centralized application configuration via pydantic-settings."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT = Path(__file__).resolve().parent.parent


def _parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() not in ("false", "0", "no", "off", "")
    return bool(value)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    cognee_base_url: str = Field(default="", validation_alias="COGNEE_BASE_URL")
    cognee_api_key: str = Field(default="", validation_alias="COGNEE_API_KEY")
    cognee_session_id: str = Field(default="memgateqa", validation_alias="COGNEE_SESSION_ID")
    cognee_dataset: str = Field(default="default_dataset", validation_alias="COGNEE_DATASET")

    llm_provider: str = Field(default="", validation_alias="LLM_PROVIDER")
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    google_api_key: str = Field(default="", validation_alias="GOOGLE_API_KEY")
    llm_model: str = Field(default="", validation_alias="LLM_MODEL")
    openai_model: str = Field(default="gpt-4o-mini", validation_alias="OPENAI_MODEL")
    gemini_model: str = Field(default="gemini-2.5-flash", validation_alias="GEMINI_MODEL")

    memgateqa_mock: bool = Field(default=False, validation_alias="MEMGATEQA_MOCK")
    memgateqa_auto_audit: bool = Field(default=True, validation_alias="MEMGATEQA_AUTO_AUDIT")
    memgateqa_autonomous: bool = Field(default=True, validation_alias="MEMGATEQA_AUTONOMOUS")
    memgateqa_gate_max_repair_cycles: int = Field(default=3, validation_alias="MEMGATEQA_GATE_MAX_REPAIR_CYCLES")
    memgateqa_gate_auto_certify: bool = Field(default=True, validation_alias="MEMGATEQA_GATE_AUTO_CERTIFY")
    memgateqa_loop_interval_sec: int = Field(default=120, validation_alias="MEMGATEQA_LOOP_INTERVAL_SEC")
    memgateqa_bridge_url: str = Field(default="http://localhost:8788", validation_alias="MEMGATEQA_BRIDGE_URL")
    memgateqa_webhook_url: str = Field(default="", validation_alias="MEMGATEQA_WEBHOOK_URL")
    memgateqa_webhook_secret: str = Field(default="", validation_alias="MEMGATEQA_WEBHOOK_SECRET")

    @field_validator(
        "memgateqa_mock",
        "memgateqa_auto_audit",
        "memgateqa_autonomous",
        "memgateqa_gate_auto_certify",
        mode="before",
    )
    @classmethod
    def _coerce_bool(cls, value: Any) -> bool:
        return _parse_bool(value)

    @property
    def resolved_gemini_api_key(self) -> str:
        return self.gemini_api_key or self.google_api_key

    def validate_required(self) -> None:
        if not self.memgateqa_mock and not self.cognee_api_key:
            raise RuntimeError(
                "COGNEE_API_KEY is required when MEMGATEQA_MOCK=false. "
                "Set COGNEE_API_KEY in .env or workspace settings, "
                "or enable mock mode with MEMGATEQA_MOCK=true."
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_required()
    return settings


def reload_settings() -> Settings:
    get_settings.cache_clear()
    return get_settings()