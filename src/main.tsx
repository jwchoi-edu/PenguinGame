import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import IceGame from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IceGame />
  </StrictMode>,
)
