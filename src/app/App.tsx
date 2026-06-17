import { RouterProvider } from 'react-router'
import { useEffect } from 'react'
import { router } from '../routes'
import { SeoHead } from './components/seo-head'
import { ErrorBoundary } from './components/error-boundary'
import { useThemeStore } from '../stores/useThemeStore'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

function ThemeSync() {
  const { theme } = useThemeStore()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  return null
}

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    })

    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return (
    <ErrorBoundary>
      <SeoHead />
      <ThemeSync />
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
