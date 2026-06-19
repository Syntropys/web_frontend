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
        loader: () => redirect('/dashboard/ringkasan'),
      },
      {
        path: '/dashboard/ringkasan',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/ringkasan')
          const Component = () => <ProtectedLayout><Page /></ProtectedLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/iklim',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/iklim')
          const Component = () => <ProtectedLayout><Page /></ProtectedLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/prediksi',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/prediksi')
          const Component = () => <ProtectedLayout><Page /></ProtectedLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/risiko',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/risiko')
          const Component = () => <ProtectedLayout><Page /></ProtectedLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/peta',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/peta')
          const Component = () => <ProtectedLayout><Page /></ProtectedLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/tren',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/tren')
          const Component = () => <ProtectedLayout><Page /></ProtectedLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/prioritas',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/prioritas')
          const Component = () => <ProtectedLayout><Page /></ProtectedLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/penyakit',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/penyakit')
          const Component = () => <ProtectedLayout><Page /></ProtectedLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/admin/pengguna',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/admin/pengguna')
          const Component = () => <AdminLayout><Page /></AdminLayout>
          return { Component }
        },
      },
      {
        path: '/dashboard/admin/ingesti',
        lazy: async () => {
          const { default: Page } = await import('./app/pages/dashboard/admin/ingesti')
          const Component = () => <AdminLayout><Page /></AdminLayout>
          return { Component }
        },
      },
      {
        path: '/404',
        lazy: async () => {
          const { default: Component } = await import('./app/pages/not-found')
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
