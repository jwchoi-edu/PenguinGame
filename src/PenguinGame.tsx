import { useRef, useState } from 'react'
import CountdownOverlay from './components/CountdownOverlay'
import Footer from './components/Footer'
import GameCanvas from './components/GameCanvas'
import RegenerationToggle from './components/RegenerationToggle'
import StartOverlay from './components/StartOverlay'
import VictoryOverlay from './components/VictoryOverlay'
import { useCanvasSize } from './hooks/useCanvasSize'
import { useGameLoop } from './hooks/useGameLoop'

const PenguinGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasSize = useCanvasSize()
  const [regenerationEnabled, setRegenerationEnabled] = useState(true)
  const { gameState, countdown, resetGame, startGame } = useGameLoop(
    canvasRef,
    regenerationEnabled,
  )

  return (
    <div className="fixed inset-0 bg-linear-to-b from-blue-100 to-blue-200 overflow-hidden">
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="relative">
          <GameCanvas canvasRef={canvasRef} canvasSize={canvasSize} />

          {gameState === 'waiting' && <StartOverlay onStart={startGame} />}

          {gameState === 'countdown' && (
            <CountdownOverlay countdown={countdown} />
          )}

          {gameState !== 'playing' &&
            gameState !== 'countdown' &&
            gameState !== 'waiting' && (
              <VictoryOverlay gameState={gameState} onRestart={resetGame} />
            )}
        </div>
      </div>

      <RegenerationToggle
        enabled={regenerationEnabled}
        onToggle={setRegenerationEnabled}
      />

      <Footer />
    </div>
  )
}

export default PenguinGame
