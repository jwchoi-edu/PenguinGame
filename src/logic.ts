import type { Penguin, HexGrid } from './types'
import { PENGUIN_RADIUS, HEX_LAYERS } from './constants'

export const handleCollision = (p1: Penguin, p2: Penguin) => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < PENGUIN_RADIUS * 2 && dist > 0) {
    const nx = dx / dist
    const ny = dy / dist

    const dvx = p1.vx - p2.vx
    const dvy = p1.vy - p2.vy
    const dvn = dvx * nx + dvy * ny

    if (dvn > 0) {
      const impulse = dvn * 0.5
      p1.vx -= impulse * nx
      p1.vy -= impulse * ny
      p2.vx += impulse * nx
      p2.vy += impulse * ny
    }

    const overlap = PENGUIN_RADIUS * 2 - dist
    const separateX = nx * overlap * 0.5
    const separateY = ny * overlap * 0.5
    p1.x -= separateX
    p1.y -= separateY
    p2.x += separateX
    p2.y += separateY
  }
}

export const createInitialGrid = (): HexGrid[] => {
  const grid: HexGrid[] = []
  for (let q = -HEX_LAYERS; q <= HEX_LAYERS; q++) {
    for (let r = -HEX_LAYERS; r <= HEX_LAYERS; r++) {
      const s = -q - r
      if (Math.abs(s) <= HEX_LAYERS) {
        grid.push({
          q,
          r,
          s,
          state: 1,
          stateChangeTime: 0,
          fallTime: 0,
        })
      }
    }
  }
  return grid
}
