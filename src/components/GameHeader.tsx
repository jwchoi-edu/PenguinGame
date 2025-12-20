interface GameHeaderProps {
  canvasSize: number
}

const GameHeader = ({ canvasSize }: GameHeaderProps) => {
  return (
    <div
      className="bg-white border-4 border-blue-400 rounded-lg shadow-xl p-6 flex flex-col justify-center"
      style={{ width: canvasSize + 8 }}
    >
      <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">
        🐧 펭귄 아이스 배틀 🐧
      </h1>
      <div className="space-y-1">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <div className="flex-1 text-right">
            <span className="font-bold text-red-500">플레이어 1 (빨강)</span>:
            WASD
          </div>
          <span className="mx-4">|</span>
          <div className="flex-1 text-left">
            <span className="font-bold text-blue-500">플레이어 2 (파랑)</span>:
            화살표 키
          </div>
        </div>

        <p className="text-sm text-center text-gray-600">
          얼음 위를 지나다니며 상대방을 떨어뜨리세요! 얼음은 두 번 밟으면
          사라집니다.
        </p>
      </div>
    </div>
  )
}

export default GameHeader
