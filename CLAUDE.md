# CLAUDE.md — Agrolytics v2

> Project: Agrolytics v2 — production-ready rebuild of Agrolytics platform
> Team: Pijak (PJK-GM030) × IBM Skillsbuild
> Stack: React 18 + Vite + TypeScript + Supabase + Vercel
> Last updated: 2026-06-16

## Project Overview

Full-stack rebuild of Agrolytics Smart Agricultural BI Platform for Kalimantan.
v1 was UI-only demo (localStorage auth). v2 wires real Supabase backend + all production features.

**Production URL**: https://agrolytic-testing.vercel.app/
**Supabase**: `mawewomqcdnsqnxmkjlq.supabase.co` (shared with v1)
**GitHub repo**: https://github.com/rohidrivaldi/agrolytics_v2

## Tech Stack

### Frontend
- Vite 6 + React 18 + TypeScript
- React Router v7 (lazy-loaded routes)
- Tailwind CSS v4 (CSS-based, `@tailwindcss/vite`)
- Lenis (smooth scroll)
- Framer Motion (animations)
- Chart.js + react-chartjs-2 (data viz)
- Leaflet + react-leaflet@4 (geospatial)
- jsPDF + html2canvas (PDF export)
- TanStack Query v5 (async state + caching)
- Zustand v5 (global state: auth + theme)
- Zod + React Hook Form (validation)
- @marsidev/react-turnstile (CAPTCHA)
- @supabase/supabase-js (auth + database)

### Backend
- Supabase Auth (email+password + Google OAuth)
- Supabase Postgres (RLS-enforced)
- Supabase Edge Functions (rate-limiting)
- Vercel Edge Functions (planned)
- FastAPI + Railway (Phase 2 — ML inference + chatbot)

## Folder Structure

```
capstone_pijak_v2/
├── src/
│   ├── main.tsx                    # entry + QueryClientProvider
│   ├── App.tsx                    # root + ThemeSync
│   ├── routes.tsx                  # lazy router + RequireAuth/RequireAdmin guards
│   ├── schemas.ts                  # Zod schemas (login/register/add-user)
│   ├── guards/
│   │   ├── RequireAuth.tsx        # redirect to /masuk if not authenticated
│   │   └── RequireAdmin.tsx       # redirect to /dashboard if not admin
│   ├── pages/
│   │   ├── masuk.tsx              # login + Google OAuth + edge rate-limit
│   │   ├── daftar.tsx             # register + Google OAuth
│   │   ├── lupa-password.tsx      # reset password email
│   │   ├── reset-password.tsx     # new password form
│   │   ├── auth-callback.tsx      # OAuth/reset password callback
│   │   └── dashboard/*            # protected pages (lazy-loaded)
│   ├── services/                  # business logic abstraction
│   │   ├── auth.ts               # Supabase auth wrapper
│   │   ├── regions.ts            # regions list/get
│   │   ├── production.ts         # production history queries
│   │   ├── predictions.ts        # yield predictions
│   │   ├── clusters.ts           # K-means cluster assignments
│   │   └── profiles.ts           # user profile CRUD
│   ├── hooks/                     # TanStack Query wrappers
│   │   ├── useAuthSession.ts      # auth bootstrap + onAuthStateChange
│   │   ├── useRegions.ts         # regions query
│   │   ├── useProduction.ts       # production history
│   │   ├── usePredictions.ts      # predictions
│   │   └── useClusters.ts         # cluster assignments
│   ├── stores/
│   │   ├── useAuthStore.ts        # Zustand: session/user/profile/isLoading
│   │   └── useThemeStore.ts       # Zustand: dark/light + anti-flash
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client singleton
│   │   └── queryClient.ts         # TanStack Query config (staleTime: 10min)
│   ├── types/
│   │   └── database.ts            # Supabase generated types (partial)
│   └── app/components/            # UI components (hand-built, NO shadcn)
├── supabase/
│   └── functions/
│       └── login-rate-limit/      # Supabase Edge: brute-force protection
└── vercel.json                    # CSP headers, rewrites, security headers
```

## Security (OWASP Top 10)

| OWASP | Implementation |
|-------|---------------|
| A01 Broken Access Control | Supabase RLS policies, RequireAuth/RequireAdmin route guards |
| A02 Cryptographic Failures | Supabase handles all password hashing (bcrypt), JWT in httpOnly cookies |
| A03 Injection | Zod validation on all inputs, RLS prevents SQL injection |
| A04 Insecure Design | Service layer abstraction, no inline SQL |
| A05 Security Misconfiguration | CSP headers, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Permissions-Policy |
| A06 Vulnerable Components | `skipLibCheck`, minimal deps, CSP restricts script sources |
| A07 Auth Failures | Supabase Edge rate-limit function + client-side lockout |
| A08 Data Integrity Failures | Supabase service role key server-side only, RLS enforces data ownership |
| A09 Logging Failures | Audit log table in Supabase (admin actions tracked) |
| A10 SSRF | No server-side fetch, Edge Functions run in isolated Deno env |

## Auth Flow

1. User submits email/password
2. Client calls Supabase Edge `login-rate-limit` → checks rate limit
3. If allowed → `supabase.auth.signInWithPassword()`
4. `useAuthSession` bootstrap reads session + fetches profile
5. `RequireAuth` guard redirects if not authenticated
6. `RequireAdmin` guard checks `profile.role === 'admin'`
7. Google OAuth: `signInWithOAuth` → redirect → `/auth/callback` → profile fetch

## TanStack Query Config

```typescript
staleTime: 10 * 60 * 1000  // 10 min for master data
gcTime: 30 * 60 * 1000        // 30 min cache
retry: 2                       // retry on failure
```

## Theme

Dark/Emerald (#0B1215 / #10B981 / #C9A24B) + Light mode.
Anti-hydration flash via `useThemeStore` persist + `<html data-theme>` sync in `ThemeSync`.

## Environment Variables

```
VITE_SUPABASE_URL=https://mawewomqcdnsqnxmkjlq.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-key>
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=<site-key>
```

Never commit `.env.local`. All env vars are `VITE_` prefixed (exposed to browser).

## Deployment

- **Vercel**: auto-deploy on push to `main`
- **Supabase**: managed separately (migrations in v1 repo)
- **FastAPI Railway**: Phase 2 (ML inference endpoint)

## Demo Admin Account

```
Email: agrolytics.core@gmail.com
Password: Admin@123
Role: admin
```

## Development

```bash
pnpm dev          # Vite dev server
pnpm build        # production build
pnpm preview      # preview build
```
