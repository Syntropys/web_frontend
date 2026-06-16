import type { SignInPasswordCredentials, SignUpPasswordCredentials } from '@supabase/supabase-js'
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
      options: { captchaToken: input.captchaToken },
    })
    if (error) throw error
    return data
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
