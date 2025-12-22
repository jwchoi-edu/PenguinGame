import { HEX_LAYERS, PENGUIN_RADIUS, POLAR_BEAR_ATTACK_RADIUS } from './constants'
import type { HexCoordinate, HexTile, Penguin } from './types'
import { hexToPixel } from './utils/hex'

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

/**
 * Selects a random position away from penguins and returns surrounding tiles
 * Targets area where neither penguin is present for polar bear attack
 */
export const selectPolarBearAttackTiles = (
  tiles: HexTile[],
  p1Position: { x: number; y: number },
  p2Position: { x: number; y: number },
): { tiles: HexCoordinate[]; targetX: number; targetY: number } => {
  // Filter tiles in 'normal' or 'weak' state only
  const availableTiles = tiles.filter(
    (t) => t.state === 'normal' || t.state === 'weak',
  )

  if (availableTiles.length === 0) {
    return { tiles: [], targetX: 0, targetY: 0 }
  }

  // Calculate distance from each tile to both penguins
  const tilesWithDistance = availableTiles.map((tile) => {
    const pos = hexToPixel(tile.q, tile.r)
    const distToP1 = Math.hypot(pos.x - p1Position.x, pos.y - p1Position.y)
    const distToP2 = Math.hypot(pos.x - p2Position.x, pos.y - p2Position.y)
    const minDist = Math.min(distToP1, distToP2)
    return { tile, minDist, pos }
  })

  // Select randomly from tiles farthest from penguins (top 30%)
  tilesWithDistance.sort((a, b) => b.minDist - a.minDist)
  const topThird = Math.max(1, Math.floor(tilesWithDistance.length * 0.3))
  const targetTileData =
    tilesWithDistance[Math.floor(Math.random() * topThird)]

  const centerTile = targetTileData.tile
  const targetPos = targetTileData.pos

  // Select tiles surrounding center tile (hexagonal distance calculation)
  const attackTiles: HexCoordinate[] = []
  for (const tile of availableTiles) {
    const distance = Math.max(
      Math.abs(tile.q - centerTile.q),
      Math.abs(tile.r - centerTile.r),
      Math.abs(tile.s - centerTile.s),
    )
    if (distance <= POLAR_BEAR_ATTACK_RADIUS) {
      attackTiles.push({ q: tile.q, r: tile.r, s: tile.s })
    }
  }

  return {
    tiles: attackTiles,
    targetX: targetPos.x,
    targetY: targetPos.y,
  }
}
