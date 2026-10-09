import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { CrashBox } from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CrashBox>
      <App />
    </CrashBox>
  </React.StrictMode>
)
