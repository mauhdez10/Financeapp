import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './colors_and_type.css' // v0.29.0 — brand tokens (CSS variables)
import App from './App.jsx'

// Client portal (feature/client-portal). Lazy-loaded ONLY on the /portal path so
// the advisor bundle + boot path are unchanged for everyone else.
const PortalApp = lazy(() => import('./portal/PortalApp.jsx'))

const isPortal = typeof window !== 'undefined' &&
  window.location.pathname.replace(/\/+$/, '').startsWith('/portal')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPortal
      ? <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D1B2A' }} />}><PortalApp /></Suspense>
      : <App />}
  </StrictMode>,
)
