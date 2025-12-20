import { HEX_LAYERS, PENGUIN_RADIUS } from './constants'
import type { HexTile, Penguin } from './types'

/**
 * Impulse-based collision resolution
 * 1. Apply impulse to separate velocities
 * 2. Separate overlapping positions
 */
export const handleCollision = (p1: Penguin, p2: Penguin) => {
  const COLLISION_IMPULSE = 0.5

  const distX = p2.x - p1.x
  const distY = p2.y - p1.y
  const dist = Math.sqrt(distX * distX + distY * distY)

  if (dist < PENGUIN_RADIUS * 2 && dist > 0) {
    const nx = distX / dist
    const ny = distY / dist
    const ddx = p1.dx - p2.dx
    const ddy = p1.dy - p2.dy
    const dvn = ddx * nx + ddy * ny

    if (dvn > 0) {
      const impulse = dvn * COLLISION_IMPULSE
      p1.dx -= impulse * nx
      p1.dy -= impulse * ny
      p2.dx += impulse * nx
      p2.dy += impulse * ny
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

/**
 * Creates hexagonal grid with optimized bounds
 * Avoids unnecessary iterations by calculating exact r range per q
 */
export const createInitialTiles = () => {
  const tiles: HexTile[] = []

  for (let q = -HEX_LAYERS; q <= HEX_LAYERS; q++) {
    const rMin = Math.max(-HEX_LAYERS, -HEX_LAYERS - q)
    const rMax = Math.min(HEX_LAYERS, HEX_LAYERS - q)

    for (let r = rMin; r <= rMax; r++)
      tiles.push({
        q,
        r,
        s: -q - r,
        state: 'normal',
        stateChangeTime: 0,
        fallTime: 0,
      })
  }

  return tiles
}
