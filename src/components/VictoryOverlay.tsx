import type { GameState } from '../types'

interface VictoryOverlayProps {
  gameState: GameState
  onRestart: () => void
}

const VictoryOverlay = ({ gameState, onRestart }: VictoryOverlayProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
        <h2 className="text-4xl font-bold mb-6 text-blue-900">
          {gameState === 'p1won'
            ? '🎉 플레이어 1 승리! 🎉'
            : '🎉 플레이어 2 승리! 🎉'}
        </h2>
        <button
          onClick={onRestart}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-lg text-xl"
        >
          🔄 다시 시작
        </button>
      </div>
    </div>
  )
}

export default VictoryOverlay
