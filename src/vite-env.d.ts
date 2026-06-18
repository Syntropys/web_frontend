/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_CLOUDFLARE_TURNSTILE_SITE_KEY?: string
  readonly VITE_DISEASE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
