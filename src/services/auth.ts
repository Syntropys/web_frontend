import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface SignUpInput {
  email: string
  password: string
  fullName: string
  captchaToken?: string
}

export interface SignInInput {
  email: string
  password: string
  captchaToken?: string
}

export const authService = {
  async signUp(input: SignUpInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        captchaToken: input.captchaToken,
        data: { full_name: input.fullName },
      },
    })
    if (error) throw error
    return data
  },

  async signInPassword(input: SignInInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    // Supabase server may return flat response { access_token, user, ... }
    // instead of nested { data: { session, user } }
    if (error) throw error
    if (!data) throw new Error('Respon server kosong')
    if (!data.session) {
      // Try to reconstruct session from flat response (Supabase v2 server compat)
      if (data.user && data.expires_at && data.expires_in) {
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          expires_at: data.expires_at,
          token_type: data.token_type || 'bearer',
          user: data.user,
        }
        return { user: data.user, session }
      }
      throw new Error('Sesi tidak dibuat server')
    }
    return { user: data.user, session: data.session }
  },

  async signInGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string, captchaToken?: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      captchaToken,
    })
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  onAuthStateChange(cb: (session: import('@supabase/supabase-js').Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session))
    return () => data.subscription.unsubscribe()
  },
}
