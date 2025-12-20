import { useRef } from 'react'
import CountdownOverlay from './components/CountdownOverlay'
import Footer from './components/Footer'
import GameCanvas from './components/GameCanvas'
import GameHeader from './components/GameHeader'
import VictoryOverlay from './components/VictoryOverlay'
import { useCanvasSize } from './hooks/useCanvasSize'
import { useGameLoop } from './hooks/useGameLoop'

const PenguinGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasSize = useCanvasSize()
  const { gameState, countdown, resetGame } = useGameLoop(canvasRef)

  return (
    <div className="fixed inset-0 bg-linear-to-b from-blue-100 to-blue-200 overflow-hidden">
      <div className="flex flex-col items-center justify-evenly h-full">
        <GameHeader canvasSize={canvasSize} />

        <div className="relative">
          <GameCanvas canvasRef={canvasRef} canvasSize={canvasSize} />

          {gameState === 'countdown' && (
            <CountdownOverlay countdown={countdown} />
          )}

          {gameState !== 'playing' && gameState !== 'countdown' && (
            <VictoryOverlay gameState={gameState} onRestart={resetGame} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default PenguinGame
