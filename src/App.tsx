import { useEffect, useRef, useState } from 'react'
import { BASE_CANVAS_SIZE, FRICTION, HEX_SIZE, MOVE_SPEED } from './constants'
import { createInitialGrid, handleCollision } from './logic'
import type { GameState, HexGrid, Penguin } from './types'
import { drawHex, drawPenguin } from './utils/draw'
import { hexToPixel, pixelToHex } from './utils/hex'

const IceGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [hexGrid, setHexGrid] = useState<HexGrid[]>([])
  const [canvasSize, setCanvasSize] = useState(800)

  // 펭귄 상태
  const penguinRef = useRef<{
    p1: Penguin
    p2: Penguin
  }>({
    p1: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    },
    p2: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    },
  })

  const lastTimeRef = useRef(Date.now())
  const hexGridRef = useRef<HexGrid[]>([])

  const keysRef = useRef<Record<KeyboardEvent['key'], boolean>>({
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
  })

  // 카운트다운 함수
  const startCountdown = () => {
    setGameState('countdown')
    setCountdown(3)

    let count = 3
    const countdownInterval = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(countdownInterval)
        setGameState('playing')
      } else {
        setCountdown(count)
      }
    }, 1000)
  }

  // 초기화
  useEffect(() => {
    const grid = createInitialGrid()
    setHexGrid(grid)
    hexGridRef.current = grid

    const pos1 = hexToPixel(-2, 2)
    const pos2 = hexToPixel(2, -2)
    penguinRef.current.p1 = {
      x: pos1.x,
      y: pos1.y,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    }
    penguinRef.current.p2 = {
      x: pos2.x,
      y: pos2.y,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    }

    startCountdown()
  }, [])

  // 캔버스 크기 조정
  useEffect(() => {
    const updateCanvasSize = () => {
      // 헤더와 여백을 고려하여 사용 가능한 높이 계산
      const headerHeight = 200 // 헤더 + 여백
      const availableHeight = window.innerHeight - headerHeight
      const availableWidth = window.innerWidth - 100 // 좌우 여백

      // 정사각형 유지하면서 더 작은 쪽에 맞춤
      const size = Math.min(availableHeight, availableWidth, 800)
      setCanvasSize(Math.max(400, size)) // 최소 400px
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // 게임 루프
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || hexGrid.length === 0) return

    const ctx = canvas.getContext('2d')!

    let animationId: number
    const gameLoop = () => {
      if (gameState !== 'playing') {
        lastTimeRef.current = Date.now()
        animationId = requestAnimationFrame(gameLoop)
        return
      }

      const currentTime = Date.now()
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 16.67, 3) // 60fps 기준, 최대 3배 제한
      lastTimeRef.current = currentTime

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const scale = (canvas.width / BASE_CANVAS_SIZE) * 1.15 // 스케일 계산

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#e6f7ff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.scale(scale, scale)

      // 육각형 그리드 업데이트 및 그리기
      const newGrid = hexGridRef.current.map((hex) => {
        const pos = hexToPixel(hex.q, hex.r)

        if (hex.state === 3) {
          const elapsed = currentTime - hex.fallTime

          if (elapsed < 1500) {
            drawHex(ctx, pos.x, pos.y, HEX_SIZE, hex)
            return hex
          } else if (elapsed < 3000) {
            const fallElapsed = elapsed - 1500
            const fallProgress = Math.min(fallElapsed / 1500, 1)
            const scale = 1 - fallProgress * 0.8
            const alpha = 1 - fallProgress
            const rotation = fallProgress * Math.PI * 4

            ctx.save()
            ctx.globalAlpha = alpha
            ctx.translate(pos.x, pos.y)
            ctx.rotate(rotation)
            ctx.scale(scale, scale)

            // 원점 기준으로 그리기
            ctx.beginPath()
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i
              const hx = HEX_SIZE * Math.cos(angle)
              const hy = HEX_SIZE * Math.sin(angle)
              if (i === 0) ctx.moveTo(hx, hy)
              else ctx.lineTo(hx, hy)
            }
            ctx.closePath()
            ctx.fillStyle = '#ff9999'
            ctx.fill()
            ctx.strokeStyle = '#ff6666'
            ctx.lineWidth = 2
            ctx.stroke()

            ctx.restore()
            return hex
          } else {
            return { ...hex, state: 4 }
          }
        }

        if (hex.state !== 4) {
          drawHex(ctx, pos.x, pos.y, HEX_SIZE, hex)
        }

        return hex
      })

      // 펭귄 이동
      const p1 = penguinRef.current.p1
      const p2 = penguinRef.current.p2

      if (!p1.dead && !p1.falling) {
        if (keysRef.current.w) p1.vy -= MOVE_SPEED * deltaTime
        if (keysRef.current.s) p1.vy += MOVE_SPEED * deltaTime
        if (keysRef.current.a) p1.vx -= MOVE_SPEED * deltaTime
        if (keysRef.current.d) p1.vx += MOVE_SPEED * deltaTime

        p1.x += p1.vx * deltaTime
        p1.y += p1.vy * deltaTime
        p1.vx *= Math.pow(FRICTION, deltaTime)
        p1.vy *= Math.pow(FRICTION, deltaTime)
      }

      if (!p2.dead && !p2.falling) {
        if (keysRef.current.ArrowUp) p2.vy -= MOVE_SPEED * deltaTime
        if (keysRef.current.ArrowDown) p2.vy += MOVE_SPEED * deltaTime
        if (keysRef.current.ArrowLeft) p2.vx -= MOVE_SPEED * deltaTime
        if (keysRef.current.ArrowRight) p2.vx += MOVE_SPEED * deltaTime

        p2.x += p2.vx * deltaTime
        p2.y += p2.vy * deltaTime
        p2.vx *= Math.pow(FRICTION, deltaTime)
        p2.vy *= Math.pow(FRICTION, deltaTime)
      }

      if (!p1.dead && !p2.dead && !p1.falling && !p2.falling) {
        handleCollision(p1, p2)
      }
      // 타일 체크
      ;[p1, p2].forEach((penguin, idx) => {
        if (penguin.dead) return

        // 그림자 중앙 (발 위치) 기준으로 타일 판정
        const hexCoord = pixelToHex(penguin.x, penguin.y + 22)
        const hexIndex = newGrid.findIndex(
          (h) => h.q === hexCoord.q && h.r === hexCoord.r,
        )

        if (hexIndex === -1) {
          if (!penguin.falling) {
            penguin.falling = true
            penguin.fallStartTime = currentTime
          }

          const fallElapsed = currentTime - penguin.fallStartTime
          if (fallElapsed > 800) {
            penguin.dead = true
            setGameState(idx === 0 ? 'p2won' : 'p1won')
            return
          }
          return
        }

        const hex = newGrid[hexIndex]

        if (hex.state === 3) {
          const elapsed = currentTime - hex.fallTime
          if (elapsed >= 1500) {
            if (!penguin.falling) {
              penguin.falling = true
              penguin.fallStartTime = currentTime
            }

            const fallElapsed = currentTime - penguin.fallStartTime
            if (fallElapsed > 800) {
              penguin.dead = true
              setGameState(idx === 0 ? 'p2won' : 'p1won')
              return
            }
          }
          return
        }

        if (hex.state === 4) {
          if (!penguin.falling) {
            penguin.falling = true
            penguin.fallStartTime = currentTime
          }

          const fallElapsed = currentTime - penguin.fallStartTime
          if (fallElapsed > 800) {
            penguin.dead = true
            setGameState(idx === 0 ? 'p2won' : 'p1won')
            return
          }
          return
        }

        const timeSinceStateChange = currentTime - hex.stateChangeTime

        if (hex.state === 1) {
          newGrid[hexIndex] = {
            ...hex,
            state: 2,
            stateChangeTime: currentTime,
          }
        } else if (hex.state === 2 && timeSinceStateChange > 1500) {
          newGrid[hexIndex] = {
            ...hex,
            state: 3,
            fallTime: currentTime,
          }
        }
      })

      hexGridRef.current = newGrid
      setHexGrid(newGrid)

      if (!p1.dead)
        drawPenguin(ctx, p1.x, p1.y, '#ff6b6b', p1.falling, p1.fallStartTime)
      if (!p2.dead)
        drawPenguin(ctx, p2.x, p2.y, '#4dabf7', p2.falling, p2.fallStartTime)

      ctx.restore()

      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => cancelAnimationFrame(animationId)
  }, [gameState])

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keysRef.current) {
        e.preventDefault()
        keysRef.current[e.key] = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keysRef.current) {
        e.preventDefault()
        keysRef.current[e.key] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const resetGame = () => {
    const grid = createInitialGrid()
    setHexGrid(grid)
    hexGridRef.current = grid

    const pos1 = hexToPixel(-2, 2)
    const pos2 = hexToPixel(2, -2)
    penguinRef.current.p1 = {
      x: pos1.x,
      y: pos1.y,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    }
    penguinRef.current.p2 = {
      x: pos2.x,
      y: pos2.y,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    }

    startCountdown()
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
      <div className="flex flex-col items-center justify-evenly h-full">
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
                <span className="font-bold text-red-500">
                  플레이어 1 (빨강)
                </span>
                : WASD
              </div>
              <span className="mx-4">|</span>
              <div className="flex-1 text-left">
                <span className="font-bold text-blue-500">
                  플레이어 2 (파랑)
                </span>
                : 화살표 키
              </div>
            </div>

            <p className="text-sm text-center text-gray-600">
              얼음 위를 지나다니며 상대방을 떨어뜨리세요! 얼음은 두 번 밟으면
              사라집니다.
            </p>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="border-4 border-blue-400 rounded-lg shadow-xl bg-white"
          />

          {gameState === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <div
                key={countdown}
                className="text-white text-9xl font-bold animate-fade-in"
              >
                {countdown === 0 ? 'GO!' : countdown}
              </div>
            </div>
          )}

          {gameState !== 'playing' && gameState !== 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
                <h2 className="text-4xl font-bold mb-6 text-blue-900">
                  {gameState === 'p1won'
                    ? '🎉 플레이어 1 승리! 🎉'
                    : '🎉 플레이어 2 승리! 🎉'}
                </h2>
                <button
                  onClick={resetGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-lg transition-colors text-xl"
                >
                  🔄 다시 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 right-4 text-right text-sm text-gray-600 space-y-1">
        <a
          href="https://github.com/jwchoi-edu/PenguinGame"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-blue-500 transition-colors flex items-center justify-end gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub (jwchoi-edu/PenguinGame)
        </a>
        <div>© 2025 중동고등학교 프로그래밍부</div>
        <div className="text-xs text-gray-500">Assisted by Claude</div>
      </div>
    </div>
  )
}

export default IceGame
