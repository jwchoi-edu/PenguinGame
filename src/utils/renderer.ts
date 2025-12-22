import {
  PENGUIN_FALL_DURATION,
  PENGUIN_RADIUS,
  TILE_FALL_DURATION,
  TILE_REGENERATE_DURATION,
  TILE_SHAKE_DURATION,
} from '../constants'
import type { HexTile } from '../types'

// ========================================
// Tile Rendering Constants
// ========================================

const TILE_COLORS = {
  STATE_1: '#a8daff',
  STATE_2: '#6eb5ff',
  FALL: '#ff9999',
  FALL_STROKE: '#ff6666',
  STROKE: '#5599dd',
  REGENERATE: '#90EE90',
  REGENERATE_STROKE: '#32CD32',
} as const

const TILE_STROKE_WIDTH = 2
const TILE_SHAKE_INTENSITY = 3
const TILE_SHAKE_FREQUENCY = 0.02
const TILE_FALL_SCALE = 0.8
const TILE_FALL_ROTATION = Math.PI * 4

// ========================================
// Penguin Rendering Constants
// ========================================

const PENGUIN_COLORS = {
  BELLY: 'white',
  EYE_WHITE: 'white',
  EYE_BLACK: 'black',
  ORANGE: '#FFA500',
  SHADOW: 'rgba(0, 0, 0, 0.2)',
} as const

const PENGUIN_SHAPE = {
  BODY_RATIO_Y: 1.2,
  BELLY_RATIO_X: 0.6,
  BELLY_RATIO_Y: 0.8,
  BELLY_OFFSET_Y: 3,
  SHADOW_RATIO_X: 1.2,
  SHADOW_RATIO_Y: 0.4,
  EYE_RADIUS: 4,
  PUPIL_RADIUS: 2,
  EYE_OFFSET_X: 5,
  EYE_OFFSET_Y: 5,
  BEAK_OFFSET_Y: 3,
  BEAK_WIDTH: 3,
  SHADOW_OFFSET: 22,
  WING_OFFSET_X: 12,
  WING_OFFSET_Y: 2,
  WING_SIZE_X: 5,
  WING_SIZE_Y: 10,
  WING_ROTATION: 0.3,
  FOOT_OFFSET_X: 5,
  FOOT_OFFSET_Y: 18,
  FOOT_SIZE_X: 4,
  FOOT_SIZE_Y: 3,
} as const

const PENGUIN_FALL_SCALE = 0.7
const PENGUIN_FALL_ROTATION = Math.PI * 2

/** Renders hexagonal tile with state-based animations */
export const drawHex = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  hex: HexTile,
  currentTime: number,
) => {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    const hx = x + size * Math.cos(angle)
    const hy = y + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(hx, hy)
    else ctx.lineTo(hx, hy)
  }
  ctx.closePath()

  if (hex.state === 'normal') {
    ctx.fillStyle = TILE_COLORS.STATE_1
  } else if (hex.state === 'weak') {
    ctx.fillStyle = TILE_COLORS.STATE_2
  } else if (hex.state === 'falling') {
    const elapsed = currentTime - hex.fallTime

    // Phase 1: Shake
    if (elapsed < TILE_SHAKE_DURATION) {
      const shake =
        Math.sin(elapsed * TILE_SHAKE_FREQUENCY) * TILE_SHAKE_INTENSITY
      ctx.save()
      ctx.translate(shake, shake)
      ctx.fillStyle = TILE_COLORS.FALL
      ctx.fill()
      ctx.strokeStyle = TILE_COLORS.FALL_STROKE
      ctx.lineWidth = TILE_STROKE_WIDTH
      ctx.stroke()
      ctx.restore()
      return
    }

    // Phase 2: Spin and fade
    if (elapsed < TILE_SHAKE_DURATION + TILE_FALL_DURATION) {
      const fallElapsed = elapsed - TILE_SHAKE_DURATION
      const fallProgress = Math.min(fallElapsed / TILE_FALL_DURATION, 1)
      const tileScale = 1 - fallProgress * TILE_FALL_SCALE
      const alpha = 1 - fallProgress
      const rotation = fallProgress * TILE_FALL_ROTATION

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.scale(tileScale, tileScale)

      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        const hx = size * Math.cos(angle)
        const hy = size * Math.sin(angle)
        if (i === 0) ctx.moveTo(hx, hy)
        else ctx.lineTo(hx, hy)
      }
      ctx.closePath()
      ctx.fillStyle = TILE_COLORS.FALL
      ctx.fill()
      ctx.strokeStyle = TILE_COLORS.FALL_STROKE
      ctx.lineWidth = TILE_STROKE_WIDTH
      ctx.stroke()

      ctx.restore()
      return
    }

    return
  } else if (hex.state === 'regenerating') {
    const elapsed = currentTime - hex.regenerateTime
    const regenProgress = Math.min(elapsed / TILE_REGENERATE_DURATION, 1)
    const tileScale = TILE_FALL_SCALE + regenProgress * (1 - TILE_FALL_SCALE)
    const alpha = regenProgress
    const rotation = -regenProgress * TILE_FALL_ROTATION // Reverse rotation

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.scale(tileScale, tileScale)

    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const hx = size * Math.cos(angle)
      const hy = size * Math.sin(angle)
      if (i === 0) ctx.moveTo(hx, hy)
      else ctx.lineTo(hx, hy)
    }
    ctx.closePath()
    ctx.fillStyle = TILE_COLORS.REGENERATE
    ctx.fill()
    ctx.strokeStyle = TILE_COLORS.REGENERATE_STROKE
    ctx.lineWidth = TILE_STROKE_WIDTH
    ctx.stroke()

    ctx.restore()
    return
  }

  ctx.fill()
  ctx.strokeStyle = TILE_COLORS.STROKE
  ctx.lineWidth = TILE_STROKE_WIDTH
  ctx.stroke()
}

/** Renders penguin with fall animation */
export const drawPenguin = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  falling: boolean,
  fallStartTime: number,
  currentTime: number,
) => {
  if (falling) {
    const elapsed = currentTime - fallStartTime
    const fallProgress = Math.min(elapsed / PENGUIN_FALL_DURATION, 1)
    const scale = 1 - fallProgress * PENGUIN_FALL_SCALE
    const alpha = 1 - fallProgress
    const rotation = fallProgress * PENGUIN_FALL_ROTATION

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)
    ctx.translate(-x, -y)
  }

  // 그림자 (펭귄 밑에)
  ctx.fillStyle = PENGUIN_COLORS.SHADOW
  ctx.beginPath()
  ctx.ellipse(
    x,
    y + PENGUIN_SHAPE.SHADOW_OFFSET,
    PENGUIN_RADIUS * PENGUIN_SHAPE.SHADOW_RATIO_X,
    PENGUIN_RADIUS * PENGUIN_SHAPE.SHADOW_RATIO_Y,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // 날개 (뒤쪽)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(
    x - PENGUIN_SHAPE.WING_OFFSET_X,
    y + PENGUIN_SHAPE.WING_OFFSET_Y,
    PENGUIN_SHAPE.WING_SIZE_X,
    PENGUIN_SHAPE.WING_SIZE_Y,
    -PENGUIN_SHAPE.WING_ROTATION,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(
    x + PENGUIN_SHAPE.WING_OFFSET_X,
    y + PENGUIN_SHAPE.WING_OFFSET_Y,
    PENGUIN_SHAPE.WING_SIZE_X,
    PENGUIN_SHAPE.WING_SIZE_Y,
    PENGUIN_SHAPE.WING_ROTATION,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // 다리
  ctx.fillStyle = PENGUIN_COLORS.ORANGE
  ctx.beginPath()
  ctx.ellipse(
    x - PENGUIN_SHAPE.FOOT_OFFSET_X,
    y + PENGUIN_SHAPE.FOOT_OFFSET_Y,
    PENGUIN_SHAPE.FOOT_SIZE_X,
    PENGUIN_SHAPE.FOOT_SIZE_Y,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(
    x + PENGUIN_SHAPE.FOOT_OFFSET_X,
    y + PENGUIN_SHAPE.FOOT_OFFSET_Y,
    PENGUIN_SHAPE.FOOT_SIZE_X,
    PENGUIN_SHAPE.FOOT_SIZE_Y,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // 몸
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(
    x,
    y,
    PENGUIN_RADIUS,
    PENGUIN_RADIUS * PENGUIN_SHAPE.BODY_RATIO_Y,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // 배
  ctx.fillStyle = PENGUIN_COLORS.BELLY
  ctx.beginPath()
  ctx.ellipse(
    x,
    y + PENGUIN_SHAPE.BELLY_OFFSET_Y,
    PENGUIN_RADIUS * PENGUIN_SHAPE.BELLY_RATIO_X,
    PENGUIN_RADIUS * PENGUIN_SHAPE.BELLY_RATIO_Y,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // 눈
  ctx.fillStyle = PENGUIN_COLORS.EYE_WHITE
  ctx.beginPath()
  ctx.arc(
    x - PENGUIN_SHAPE.EYE_OFFSET_X,
    y - PENGUIN_SHAPE.EYE_OFFSET_Y,
    PENGUIN_SHAPE.EYE_RADIUS,
    0,
    Math.PI * 2,
  )
  ctx.arc(
    x + PENGUIN_SHAPE.EYE_OFFSET_X,
    y - PENGUIN_SHAPE.EYE_OFFSET_Y,
    PENGUIN_SHAPE.EYE_RADIUS,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  ctx.fillStyle = PENGUIN_COLORS.EYE_BLACK
  ctx.beginPath()
  ctx.arc(
    x - PENGUIN_SHAPE.EYE_OFFSET_X,
    y - PENGUIN_SHAPE.EYE_OFFSET_Y,
    PENGUIN_SHAPE.PUPIL_RADIUS,
    0,
    Math.PI * 2,
  )
  ctx.arc(
    x + PENGUIN_SHAPE.EYE_OFFSET_X,
    y - PENGUIN_SHAPE.EYE_OFFSET_Y,
    PENGUIN_SHAPE.PUPIL_RADIUS,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // 부리
  ctx.fillStyle = PENGUIN_COLORS.ORANGE
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - PENGUIN_SHAPE.BEAK_WIDTH, y + PENGUIN_SHAPE.BEAK_OFFSET_Y)
  ctx.lineTo(x + PENGUIN_SHAPE.BEAK_WIDTH, y + PENGUIN_SHAPE.BEAK_OFFSET_Y)
  ctx.closePath()
  ctx.fill()

  if (falling) ctx.restore()
}

/**
 * Renders polar bear with falling animation
 * @param x, y - Polar bear center coordinates
 * @param progress - Animation progress from 0 to 1
 */
export const drawPolarBear = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
) => {
  const size = 60 // 2x size increase
  const scale = Math.min(1, progress * 2) // Scale up during first 0.5s
  const alpha = progress > 0.8 ? (1 - progress) / 0.2 : 1 // Fade out in last 20%
  
  // Fall animation: drops from above
  const fallDistance = 200 // Falling distance
  const fallProgress = Math.min(1, progress * 6) // Falls quickly in first 1/6 of duration
  const easeOut = 1 - Math.pow(1 - fallProgress, 3) // Smooth deceleration
  const offsetY = -fallDistance * (1 - easeOut)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y + offsetY)
  ctx.scale(scale, scale)

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.beginPath()
  ctx.ellipse(0, size * 0.8, size * 0.8, size * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Hind legs (left) - to the sides
  ctx.fillStyle = '#d0d0d0'
  ctx.beginPath()
  ctx.ellipse(-size * 0.6, size * 0.5, size * 0.25, size * 0.35, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Hind legs (right) - to the sides
  ctx.beginPath()
  ctx.ellipse(size * 0.6, size * 0.5, size * 0.25, size * 0.35, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Front legs (left) - to the sides
  ctx.beginPath()
  ctx.ellipse(-size * 0.5, size * 0.7, size * 0.22, size * 0.4, -0.2, 0, Math.PI * 2)
  ctx.fill()

  // Front legs (right) - to the sides
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.7, size * 0.22, size * 0.4, 0.2, 0, Math.PI * 2)
  ctx.fill()

  // Body (white)
  ctx.fillStyle = '#f0f0f0'
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.8, size, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.beginPath()
  ctx.arc(0, -size * 0.5, size * 0.6, 0, Math.PI * 2)
  ctx.fill()

  // Ear (left)
  ctx.beginPath()
  ctx.arc(-size * 0.4, -size * 0.8, size * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Ear (right)
  ctx.beginPath()
  ctx.arc(size * 0.4, -size * 0.8, size * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Eye (left)
  ctx.fillStyle = 'black'
  ctx.beginPath()
  ctx.arc(-size * 0.2, -size * 0.5, size * 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Eye (right)
  ctx.beginPath()
  ctx.arc(size * 0.2, -size * 0.5, size * 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Nose
  ctx.beginPath()
  ctx.arc(0, -size * 0.3, size * 0.12, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
