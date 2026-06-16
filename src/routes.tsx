import { createBrowserRouter, redirect } from 'react-router'
import { RootLayout } from './app/components/scroll-to-top'
import { RouterErrorBoundary } from './app/components/error-boundary'
import { HydrateFallback } from './app/components/hydrate-fallback'
import { RequireAuth } from './guards/RequireAuth'
import { RequireAdmin } from './guards/RequireAdmin'
import Landing from './app/pages/landing'

// Layout wrapper for protected routes
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouterErrorBoundary,
    HydrateFallback,
    children: [
      { path: '/', Component: Landing },
      {
        path: '/masuk',
        lazy: async () => {
          const { default: Component } = await import('./app/pages/masuk')
          return { Component }
        },
      },
      {
        path: '/daftar',
        lazy: async () => {
          const { default: Component } = await import('./app/pages/daftar')
          return { Component }
        },
      },
      {
        path: '/lupa-password',
        lazy: async () => {
          const { default: Component } = await import('./app/pages/lupa-password')
          return { Component }
        },
      },
      {
        path: '/reset-password',
        lazy: async () => {
          const { default: Component } = await import('./app/pages/reset-password')
          return { Component }
        },
      },
      {
        path: '/auth/callback',
        lazy: async () => {
          const { default: Component } = await import('./app/pages/auth-callback')
          return { Component }
        },
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        loader: () => redirect('/dashboard/ringkasan'),
      },
      {
        path: '/dashboard/ringkasan',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/ringkasan')
          return { Component }
        },
      },
      {
        path: '/dashboard/iklim',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/iklim')
          return { Component }
        },
      },
      {
        path: '/dashboard/prediksi',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/prediksi')
          return { Component }
        },
      },
      {
        path: '/dashboard/risiko',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/risiko')
          return { Component }
        },
      },
      {
        path: '/dashboard/peta',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/peta')
          return { Component }
        },
      },
      {
        path: '/dashboard/tren',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/tren')
          return { Component }
        },
      },
      {
        path: '/dashboard/prioritas',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/prioritas')
          return { Component }
        },
      },
      {
        path: '/dashboard/penyakit',
        element: (
          <ProtectedLayout>
            <div />
          </ProtectedLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/penyakit')
          return { Component }
        },
      },
      {
        path: '/dashboard/admin/pengguna',
        element: (
          <AdminLayout>
            <div />
          </AdminLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/admin/pengguna')
          return { Component }
        },
      },
      {
        path: '/dashboard/admin/ingesti',
        element: (
          <AdminLayout>
            <div />
          </AdminLayout>
        ),
        lazy: async () => {
          const { default: Component } = await import('./app/pages/dashboard/admin/ingesti')
          return { Component }
        },
      },
      {
        path: '*',
        lazy: async () => {
          const { default: Component } = await import('./app/pages/not-found')
          return { Component }
        },
      },
    ],
  },
])
