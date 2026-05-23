import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './colors_and_type.css' // v0.29.0 — brand tokens (CSS variables)
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
