type StartOverlayProps = {
  onStart: () => void
}

const StartOverlay = ({ onStart }: StartOverlayProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="text-center bg-white rounded-2xl p-8 max-w-2xl"
        style={{ boxShadow: '0 0 60px rgba(0, 0, 0, 0.4)' }}
      >
        <h1 className="text-5xl font-bold text-blue-900 mb-6">
          🐧 펭귄 아이스 배틀 🐧
        </h1>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center text-base text-gray-700">
            <div className="flex-1 text-right">
              <span className="font-bold text-red-500">플레이어 1 (빨강)</span>:
              WASD
            </div>
            <span className="mx-4">|</span>
            <div className="flex-1 text-left">
              <span className="font-bold text-blue-500">플레이어 2 (파랑)</span>
              : 화살표 키
            </div>
          </div>

          <p className="text-base text-gray-700">
            얼음 위를 지나다니며 상대방을 떨어뜨리세요! 얼음은 두 번 밟으면
            사라집니다.
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="px-8 py-4 text-2xl font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          게임 시작
        </button>
      </div>
    </div>
  )
}

export default StartOverlay
