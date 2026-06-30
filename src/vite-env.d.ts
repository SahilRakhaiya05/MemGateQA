/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEMGATEQA_MOCK?: string;
  readonly VITE_COGNEE_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}