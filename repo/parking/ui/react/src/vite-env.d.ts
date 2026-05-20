/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_RINGCENTRAL_CLIENT_ID: string;
  readonly VITE_RINGCENTRAL_CLIENT_SECRET: string;
  readonly VITE_RINGCENTRAL_SERVER_URL: string;
  readonly VITE_RINGCENTRAL_JWT: string;
  readonly VITE_RINGCENTRAL_SMS_FROM_NUMBER: string;
  readonly VITE_C3_PKG: string;
  readonly VITE_C3_BASE_URL: string;
  readonly VITE_C3_ENV: string;
  readonly VITE_C3_APP: string;
  readonly VITE_C3_AUTH_TOKEN: string;
  readonly VITE_DEV_SERVER_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
