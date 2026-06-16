import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().optional(),
})

const rawTurnstile = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY
export const env = envSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_CLOUDFLARE_TURNSTILE_SITE_KEY: rawTurnstile && rawTurnstile.length > 0 ? rawTurnstile : undefined,
})

export type Env = z.infer<typeof envSchema>
