import { RouterProvider } from 'react-router'
import { useEffect } from 'react'
import { router } from '../routes'
import { SeoHead } from './components/seo-head'
import { ErrorBoundary } from './components/error-boundary'
import { useThemeStore } from '../stores/useThemeStore'

function ThemeSync() {
  const { theme } = useThemeStore()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <SeoHead />
      <ThemeSync />
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
