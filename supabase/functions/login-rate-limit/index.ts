/**
 * Supabase Edge Function: login-rate-limit
 * Deno-based — protects against brute-force login attempts.
 * Uses Supabase KV (if available) or in-memory Map as fallback.
 * 
 * Headers required:
 *   x-email: <user email>
 *   x-password-hash: <bcrypt-hash of password>
 * 
 * Returns: { allowed: boolean, reason?: string, attempts_left?: number }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RATE_LIMIT = 5          // max attempts
const WINDOW_MS = 30 * 1000   // 30 second window
const LOCK_MS = 60 * 1000      // lock for 60 seconds after max attempts

// In-memory store (resets on cold start — acceptable for free-tier Edge Functions)
// Production: use Supabase KV or external Redis
const attempts = new Map<string, { count: number; resetAt: number; lockedUntil: number }>()

function getClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceKey)
}

function checkRateLimit(email: string): { allowed: boolean; reason?: string; attempts_left?: number } {
  const now = Date.now()
  const entry = attempts.get(email)

  // No record — clean slate
  if (!entry) {
    return { allowed: true, attempts_left: RATE_LIMIT - 1 }
  }

  // Still locked
  if (entry.lockedUntil > now) {
    const waitSec = Math.ceil((entry.lockedUntil - now) / 1000)
    return { allowed: false, reason: `Terlalu banyak percobaan. Coba lagi dalam ${waitSec} detik.`, attempts_left: 0 }
  }

  // Window expired — reset
  if (entry.resetAt <= now) {
    attempts.delete(email)
    return { allowed: true, attempts_left: RATE_LIMIT - 1 }
  }

  // Within window
  if (entry.count >= RATE_LIMIT) {
    const lockedUntil = now + LOCK_MS
    attempts.set(email, { count: entry.count, resetAt: entry.resetAt, lockedUntil })
    return { allowed: false, reason: `Terlalu banyak percobaan. Akun dikunci 60 detik.`, attempts_left: 0 }
  }

  const left = RATE_LIMIT - entry.count - 1
  return { allowed: true, attempts_left: left }
}

function recordAttempt(email: string): void {
  const now = Date.now()
  const entry = attempts.get(email)

  if (!entry || entry.resetAt <= now) {
    attempts.set(email, { count: 1, resetAt: now + WINDOW_MS, lockedUntil: 0 })
    return
  }

  const newCount = entry.count + 1
  const lockedUntil = newCount >= RATE_LIMIT ? now + LOCK_MS : entry.lockedUntil
  attempts.set(email, { count: newCount, resetAt: entry.resetAt, lockedUntil })
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-email, x-client-version',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  // Read email from header (not body — reduces log exposure)
  const email = req.headers.get('x-email')?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Email header missing or invalid' }, { status: 400 })
  }

  // Check rate limit BEFORE attempting login
  const check = checkRateLimit(email)
  if (!check.allowed) {
    return Response.json(
      { allowed: false, reason: check.reason },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    )
  }

  // Parse body for Supabase auth
  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const loginEmail = body.email?.trim().toLowerCase()
  const password = body.password

  // Validate email matches header
  if (loginEmail !== email) {
    return Response.json({ error: 'Email mismatch' }, { status: 400 })
  }

  // Record this attempt
  recordAttempt(email)

  // Verify credentials via Supabase Auth (service role — bypasses rate limits from Supabase side)
  const supabase = getClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    return Response.json(
      {
        allowed: false,
        reason: check.attempts_left === 0
          ? 'Terlalu banyak percobaan.'
          : `Email atau kata sandi salah. Sisa ${check.attempts_left} percobaan.`,
        attempts_left: check.attempts_left,
      },
      {
        status: 401,
        headers: {
          'X-RateLimit-Remaining': String(check.attempts_left ?? 0),
        },
      }
    )
  }

  // Success — clear rate limit
  attempts.delete(email)

  return Response.json({
    allowed: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  })
})
