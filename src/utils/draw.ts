import type { HexGrid } from '../types'
import { PENGUIN_RADIUS } from '../constants'

export const drawHex = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  hex: HexGrid,
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

  if (hex.state === 1) {
    ctx.fillStyle = '#a8daff'
  } else if (hex.state === 2) {
    ctx.fillStyle = '#6eb5ff'
  } else if (hex.state === 3) {
    const elapsed = Date.now() - hex.fallTime
    const shake = Math.sin(elapsed * 0.02) * 3
    ctx.save()
    ctx.translate(shake, shake)
    ctx.fillStyle = '#ff9999'
    ctx.fill()
    ctx.strokeStyle = '#ff6666'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    return
  }

  ctx.fill()
  ctx.strokeStyle = '#5599dd'
  ctx.lineWidth = 2
  ctx.stroke()
}

export const drawPenguin = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  falling: boolean,
  fallStartTime: number,
) => {
  if (falling) {
    const elapsed = Date.now() - fallStartTime
    const fallProgress = Math.min(elapsed / 800, 1)
    const scale = 1 - fallProgress * 0.7
    const alpha = 1 - fallProgress
    const rotation = fallProgress * Math.PI * 2

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)
    ctx.translate(-x, -y)
  }

  // 그림자 (펭귄 밑에)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.beginPath()
  ctx.ellipse(
    x,
    y + 22,
    PENGUIN_RADIUS * 1.2,
    PENGUIN_RADIUS * 0.4,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // 날개 (뒤쪽)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x - 12, y + 2, 5, 10, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + 12, y + 2, 5, 10, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // 다리
  ctx.fillStyle = '#FFA500'
  ctx.beginPath()
  ctx.ellipse(x - 5, y + 18, 4, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + 5, y + 18, 4, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // 몸
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y, PENGUIN_RADIUS, PENGUIN_RADIUS * 1.2, 0, 0, Math.PI * 2)
  ctx.fill()

  // 배
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.ellipse(
    x,
    y + 3,
    PENGUIN_RADIUS * 0.6,
    PENGUIN_RADIUS * 0.8,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // 눈
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(x - 5, y - 5, 4, 0, Math.PI * 2)
  ctx.arc(x + 5, y - 5, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'black'
  ctx.beginPath()
  ctx.arc(x - 5, y - 5, 2, 0, Math.PI * 2)
  ctx.arc(x + 5, y - 5, 2, 0, Math.PI * 2)
  ctx.fill()

  // 부리
  ctx.fillStyle = '#FFA500'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - 3, y + 3)
  ctx.lineTo(x + 3, y + 3)
  ctx.closePath()
  ctx.fill()

  if (falling) {
    ctx.restore()
  }
}
