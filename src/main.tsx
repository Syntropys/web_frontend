import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './app/App'
import { queryClient } from './lib/queryClient'
import { Chart } from 'chart.js'
import './styles/tailwind.css'
import './styles/fonts.css'

// Expose Chart.js to window for Wappalyzer detection
if (typeof window !== 'undefined') {
  (window as any).Chart = Chart
}


// OWASP A05: Security Misconfiguration — disableDevtools in production
// This prevents browser DevTools inspection of React component tree in production
if (import.meta.env.PROD) {
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
    get() { return {} },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
