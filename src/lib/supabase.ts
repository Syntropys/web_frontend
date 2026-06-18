import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] Missing env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.',
  )
}

const customStorage = {
  getItem: (key: string): string | null => {
    const localVal = localStorage.getItem(key)
    if (localVal) return localVal
    return sessionStorage.getItem(key)
  },
  setItem: (key: string, value: string): void => {
    const rememberMe = localStorage.getItem('agrolytics_remember_me') !== 'false'
    if (rememberMe) {
      localStorage.setItem(key, value)
    } else {
      sessionStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: customStorage,
    },
  },
)

export type SupabaseClient = typeof supabase
