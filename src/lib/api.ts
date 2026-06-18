/**
 * API Client — HTTP bridge to the FastAPI ML Bridge backend.
 *
 * Uses native `fetch` to communicate with the FastAPI service.
 * In development, Vite proxy forwards /api/* to localhost:8000.
 * In production, Vercel rewrites forward /api/* to Railway.
 *
 * Automatically attaches the Supabase JWT access token (if available)
 * to every request for authenticated endpoints.
 */
import { supabase } from '@/lib/supabase'

/**
 * Resolve the base URL for API calls.
 * - In dev with Vite proxy: '' (empty, relative paths go through proxy)
 * - In production: '' (empty, Vercel rewrites handle /api/*)
 * - Direct access (no proxy): uses VITE_API_BASE_URL env var
 */
function getBaseUrl(): string {
  // When using Vite proxy or Vercel rewrites, we use relative URLs
  // The proxy/rewrite will handle forwarding to the actual backend
  return ''
}

/**
 * Get the current user's Supabase JWT access token (if logged in).
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

/**
 * Build common headers for API requests.
 */
async function buildHeaders(extra?: HeadersInit): Promise<Headers> {
  const headers = new Headers(extra)
  const token = await getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const apiClient = {
  /**
   * Upload a file via multipart/form-data.
   * Used for disease detection image upload.
   */
  async upload<T>(endpoint: string, file: File): Promise<T> {
    const baseUrl = getBaseUrl()
    const headers = await buildHeaders()
    // Do NOT set Content-Type — fetch will set it automatically with boundary
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `API Error ${response.status}: ${errorBody || response.statusText}`,
      )
    }

    return response.json() as Promise<T>
  },

  /**
   * POST JSON body to an endpoint.
   * Used for yield prediction, forecast creation, etc.
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const baseUrl = getBaseUrl()
    const headers = await buildHeaders({
      'Content-Type': 'application/json',
    })

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `API Error ${response.status}: ${errorBody || response.statusText}`,
      )
    }

    return response.json() as Promise<T>
  },

  /**
   * GET request to an endpoint.
   * Used for health checks, job status polling, etc.
   */
  async get<T>(endpoint: string): Promise<T> {
    const baseUrl = getBaseUrl()
    const headers = await buildHeaders()

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `API Error ${response.status}: ${errorBody || response.statusText}`,
      )
    }

    return response.json() as Promise<T>
  },
}
