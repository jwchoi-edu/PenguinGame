import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import {
  BASE_CANVAS_SIZE,
  EVENT_MAX_INTERVAL,
  EVENT_MIN_INTERVAL,
  HEX_SIZE,
  PENGUIN_FALL_DURATION,
  POLAR_BEAR_DURATION,
  TILE_FALL_DURATION,
  TILE_REGENERATE_DURATION,
  TILE_REGENERATE_MAX_TIME,
  TILE_REGENERATE_MIN_TIME,
  TILE_REGENERATE_PROBABILITY,
  TILE_SHAKE_DURATION,
} from '../constants'
import { createInitialTiles, handleCollision, selectPolarBearAttackTiles } from '../logic'
import type { GameState, HexTile, Penguin, PolarBearEvent } from '../types'
import { hexToPixel, pixelToHex } from '../utils/hex'
import { drawHex, drawPenguin, drawPolarBear } from '../utils/renderer'

const COLOR_BACKGROUND = '#e6f7ff'
const COLOR_PENGUIN_1 = '#ff6b6b'
const COLOR_PENGUIN_2 = '#4dabf7'
const MOVE_SPEED = 0.3
const FRICTION = 0.75
const COLLISION_OFFSET = 12

const hexKey = (q: number, r: number) => `${q},${r}`

/** Returns true if game should end */
const checkPenguinFall = (
  penguin: Penguin,
  currentTime: number,
  setGameState: (state: GameState) => void,
  playerIndex: number,
) => {
  if (!penguin.falling) {
    penguin.falling = true
    penguin.fallStartTime = currentTime
  }

  const fallElapsed = currentTime - penguin.fallStartTime
  if (fallElapsed > PENGUIN_FALL_DURATION) {
    penguin.dead = true
    setGameState(playerIndex === 0 ? 'p2won' : 'p1won')
    return true
  }
  return false
}

/**
 * Main game loop hook
 * Returns: {gameState, countdown, resetGame}
 */
export const useGameLoop = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  regenerationEnabled: boolean = true,
) => {
  const [gameState, setGameState] = useState<GameState>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [tiles, setTiles] = useState<HexTile[]>([])

  const keysRef = useRef<Record<string, boolean>>({})
  const lastTimeRef = useRef(Date.now())
  const tilesRef = useRef<HexTile[]>([])
  const tileMapRef = useRef<Map<string, number>>(new Map())
  const countdownIntervalRef = useRef<number | null>(null)
  const nextEventTimeRef = useRef<number>(0)
  const polarBearEventRef = useRef<PolarBearEvent>({
    active: false,
    startTime: 0,
    targetX: 0,
    targetY: 0,
    tiles: [],
  })

  // Penguin state (mutable for performance - updated every frame)
  const penguinRef = useRef<{ p1: Penguin; p2: Penguin }>({
    p1: {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    },
    p2: {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    },
  })

  // ========================================
  // Game Control Functions
  // ========================================

  /**
   * Resets penguins to starting positions (opposite corners)
   * Player 1: (-2, 2), Player 2: (2, -2)
   */
  const initializePenguins = useCallback(() => {
    const pos1 = hexToPixel(-2, 2)
    const pos2 = hexToPixel(2, -2)
    penguinRef.current.p1 = {
      x: pos1.x,
      y: pos1.y,
      dx: 0,
      dy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    }
    penguinRef.current.p2 = {
      x: pos2.x,
      y: pos2.y,
      dx: 0,
      dy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    }
  }, [])

  const startCountdown = useCallback(() => {
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current)

    setGameState('countdown')
    setCountdown(3)

    let count = 3
    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1
      if (count <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        setGameState('playing')
      } else {
        setCountdown(count)
      }
    }, 1000)
  }, [])

  const resetGame = useCallback(() => {
    const newTiles = createInitialTiles()
    tilesRef.current = []
    setTiles(newTiles)
    initializePenguins()
    nextEventTimeRef.current = 0
    polarBearEventRef.current = {
      active: false,
      startTime: 0,
      targetX: 0,
      targetY: 0,
      tiles: [],
    }
    startCountdown()
  }, [initializePenguins, startCountdown])

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Initialize game
  useEffect(() => {
    const newTiles = createInitialTiles()
    setTiles(newTiles)
    initializePenguins()
    startCountdown()

    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current)
    }
  }, [initializePenguins, startCountdown])

  // Build tile lookup map
  useEffect(() => {
    if (tiles.length > 0 && tilesRef.current.length === 0) {
      tilesRef.current = tiles

      const map = new Map<string, number>()
      for (const [index, tile] of tiles.entries())
        map.set(hexKey(tile.q, tile.r), index)

      tileMapRef.current = map
    }
  }, [tiles])

  /**
   * Main game loop - runs every frame (~60 FPS)
   *
   * Flow:
   * 1. Calculate delta time for frame-rate independent physics
   * 2. Update and render tiles (handle state transitions and animations)
   * 3. Process player input and update penguin physics
   * 4. Check collisions (penguin-penguin, penguin-tile)
   * 5. Update tile states based on penguin positions
   * 6. Render everything to canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || tilesRef.current.length === 0) return

    const ctx = canvas.getContext('2d')!

    let animationId: number
    const gameLoop = () => {
      if (gameState !== 'playing') {
        lastTimeRef.current = Date.now()
        animationId = requestAnimationFrame(gameLoop)
        return
      }

      const currentTime = Date.now()
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 16.67, 3)
      lastTimeRef.current = currentTime

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const canvasScale = (canvas.width / BASE_CANVAS_SIZE) * 1.15

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = COLOR_BACKGROUND
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.scale(canvasScale, canvasScale)

      // Tile update and rendering

      // Polar bear event handling
      if (nextEventTimeRef.current === 0) {
        // Set initial event time
        nextEventTimeRef.current =
          currentTime +
          EVENT_MIN_INTERVAL +
          Math.random() * (EVENT_MAX_INTERVAL - EVENT_MIN_INTERVAL)
      }

      // Check for event trigger
      if (
        !polarBearEventRef.current.active &&
        currentTime >= nextEventTimeRef.current
      ) {
        const { p1, p2 } = penguinRef.current
        const attackData = selectPolarBearAttackTiles(
          tilesRef.current,
          { x: p1.x, y: p1.y },
          { x: p2.x, y: p2.y },
        )

        if (attackData.tiles.length > 0) {
          polarBearEventRef.current = {
            active: true,
            startTime: currentTime,
            targetX: attackData.targetX,
            targetY: attackData.targetY,
            tiles: attackData.tiles,
          }
        }

        // Set next event time
        nextEventTimeRef.current =
          currentTime +
          EVENT_MIN_INTERVAL +
          Math.random() * (EVENT_MAX_INTERVAL - EVENT_MIN_INTERVAL)
      }

      // Active polar bear event - tile destruction handling
      if (polarBearEventRef.current.active) {
        const elapsed = currentTime - polarBearEventRef.current.startTime
        const progress = Math.min(1, elapsed / POLAR_BEAR_DURATION)

        // Mark tiles as weak when event starts
        if (elapsed >= 0 && elapsed < 100) {
          // 100ms window check to execute only once
          for (const attackTile of polarBearEventRef.current.tiles) {
            const tileIndex = tileMapRef.current.get(
              hexKey(attackTile.q, attackTile.r),
            )
            if (tileIndex !== undefined) {
              const tile = tilesRef.current[tileIndex]
              if (tile.state === 'normal') {
                tilesRef.current[tileIndex] = {
                  ...tile,
                  state: 'weak',
                  stateChangeTime: currentTime,
                }
              }
            }
          }
        }

        // Destroy tiles 1 second after event starts (after polar bear appears)
        if (elapsed >= 1000 && elapsed < 1100) {
          // 100ms window check to execute only once
          for (const attackTile of polarBearEventRef.current.tiles) {
            const tileIndex = tileMapRef.current.get(
              hexKey(attackTile.q, attackTile.r),
            )
            if (tileIndex !== undefined) {
              const tile = tilesRef.current[tileIndex]
              if (tile.state !== 'gone' && tile.state !== 'falling') {
                tilesRef.current[tileIndex] = {
                  ...tile,
                  state: 'falling',
                  fallTime: currentTime,
                }
              }
            }
          }
        }

        // End event handling
        if (progress >= 1) {
          polarBearEventRef.current.active = false
        }
      }

      const newTiles = tilesRef.current.map((tile): HexTile => {
        const pos = hexToPixel(tile.q, tile.r)

        // Regenerating tiles: check if animation is complete
        if (tile.state === 'regenerating') {
          const elapsed = currentTime - tile.regenerateTime

          if (elapsed >= TILE_REGENERATE_DURATION) {
            return { ...tile, state: 'normal' }
          }

          // Renderer handles regeneration animation
          drawHex(ctx, pos.x, pos.y, HEX_SIZE, tile, currentTime)
          return tile
        }

        // Gone tiles: check for regeneration
        if (tile.state === 'gone' && regenerationEnabled) {
          const timeSinceGone = currentTime - tile.goneTime

          // Check if tile should start regenerating
          if (timeSinceGone >= TILE_REGENERATE_MIN_TIME) {
            const maxWaitTime = TILE_REGENERATE_MAX_TIME - TILE_REGENERATE_MIN_TIME
            const waitProgress = Math.min(
              (timeSinceGone - TILE_REGENERATE_MIN_TIME) / maxWaitTime,
              1,
            )

            // Random check each frame with increasing probability
            if (Math.random() < TILE_REGENERATE_PROBABILITY * waitProgress * 0.01) {
              return {
                ...tile,
                state: 'regenerating',
                regenerateTime: currentTime,
              }
            }
          }
          return tile
        }

        // Falling tiles: check if animation is complete
        if (tile.state === 'falling') {
          const elapsed = currentTime - tile.fallTime

          if (elapsed >= TILE_SHAKE_DURATION + TILE_FALL_DURATION)
            return { ...tile, state: 'gone', goneTime: currentTime }

          // Renderer handles shake and fall animation
          drawHex(ctx, pos.x, pos.y, HEX_SIZE, tile, currentTime)
          return tile
        }

        // Render all non-gone tiles
        if (tile.state !== 'gone')
          drawHex(ctx, pos.x, pos.y, HEX_SIZE, tile, currentTime)

        return tile
      })

      // Penguin physics
      const { p1, p2 } = penguinRef.current
      const delta = MOVE_SPEED * deltaTime
      const frictionFactor = Math.pow(FRICTION, deltaTime)

      const isP1Active = !p1.dead && !p1.falling
      const isP2Active = !p2.dead && !p2.falling

      if (isP1Active) {
        if (keysRef.current.w) p1.dy -= delta
        if (keysRef.current.s) p1.dy += delta
        if (keysRef.current.a) p1.dx -= delta
        if (keysRef.current.d) p1.dx += delta

        p1.x += p1.dx * deltaTime
        p1.y += p1.dy * deltaTime
        p1.dx *= frictionFactor
        p1.dy *= frictionFactor
      }

      if (isP2Active) {
        if (keysRef.current.ArrowUp) p2.dy -= delta
        if (keysRef.current.ArrowDown) p2.dy += delta
        if (keysRef.current.ArrowLeft) p2.dx -= delta
        if (keysRef.current.ArrowRight) p2.dx += delta

        p2.x += p2.dx * deltaTime
        p2.y += p2.dy * deltaTime
        p2.dx *= frictionFactor
        p2.dy *= frictionFactor
      }

      // Penguin-penguin collision
      if (isP1Active && isP2Active) handleCollision(p1, p2)

      // Tile collision
      for (const [idx, penguin] of [p1, p2].entries()) {
        if (penguin.dead) continue

        const hexCoord = pixelToHex(penguin.x, penguin.y + COLLISION_OFFSET)
        const tileIndex = tileMapRef.current.get(hexKey(hexCoord.q, hexCoord.r))

        if (tileIndex === undefined) {
          checkPenguinFall(penguin, currentTime, setGameState, idx)
          continue
        }

        const tile = newTiles[tileIndex]

        if (tile.state === 'falling') {
          const elapsed = currentTime - tile.fallTime
          if (elapsed >= TILE_SHAKE_DURATION)
            checkPenguinFall(penguin, currentTime, setGameState, idx)

          continue
        }

        if (tile.state === 'gone') {
          checkPenguinFall(penguin, currentTime, setGameState, idx)
          continue
        }

        // Update tile: normal → weak → falling
        const timeSinceStateChange = currentTime - tile.stateChangeTime

        if (tile.state === 'normal') {
          // First step: mark as weak
          newTiles[tileIndex] = {
            ...tile,
            state: 'weak',
            stateChangeTime: currentTime,
          }
        } else if (
          tile.state === 'weak' &&
          timeSinceStateChange > TILE_SHAKE_DURATION
        ) {
          // Second step after delay: start falling
          newTiles[tileIndex] = {
            ...tile,
            state: 'falling',
            fallTime: currentTime,
          }
        }
      }

      // ========================================
      // Update state and render penguins
      // ========================================

      tilesRef.current = newTiles
      setTiles(newTiles)

      if (!p1.dead)
        drawPenguin(
          ctx,
          p1.x,
          p1.y,
          COLOR_PENGUIN_1,
          p1.falling,
          p1.fallStartTime,
          currentTime,
        )

      if (!p2.dead)
        drawPenguin(
          ctx,
          p2.x,
          p2.y,
          COLOR_PENGUIN_2,
          p2.falling,
          p2.fallStartTime,
          currentTime,
        )

      // Polar bear rendering (displayed on top)
      if (polarBearEventRef.current.active) {
        const elapsed = currentTime - polarBearEventRef.current.startTime
        const progress = Math.min(1, elapsed / POLAR_BEAR_DURATION)

        drawPolarBear(
          ctx,
          polarBearEventRef.current.targetX,
          polarBearEventRef.current.targetY,
          progress,
        )
      }

      ctx.restore()

      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => cancelAnimationFrame(animationId)
  }, [gameState, regenerationEnabled])

  return { gameState, countdown, resetGame }
}
