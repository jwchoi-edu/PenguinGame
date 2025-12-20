import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PenguinGame from './PenguinGame.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PenguinGame />
  </StrictMode>,
)
