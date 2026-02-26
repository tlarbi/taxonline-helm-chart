import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Global styles
const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: #080b12; color: #cbd5e1; font-family: "JetBrains Mono", "Fira Code", monospace; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #080b12; }
  ::-webkit-scrollbar-thumb { background: #1a2235; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #1e2d3d; }
  select { outline: none; }
  input:focus, textarea:focus { border-color: #0ea5e9 !important; }
  @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }
  .pulse { animation: pulse 1.5s ease infinite; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
