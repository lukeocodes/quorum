/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_CORE_URL: string;
  readonly PUBLIC_API_SERVER_URL: string;
  readonly PUBLIC_CONSOLE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

