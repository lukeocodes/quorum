/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_CORE_URL: string;
  readonly PUBLIC_API_SERVER_URL: string;
  readonly PUBLIC_CONSOLE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
