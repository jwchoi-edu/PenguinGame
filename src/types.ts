/**
 * Hexagonal coordinate system (axial)
 * Constraint: q + r + s = 0
 */
export type HexCoordinate = {
  q: number
  r: number
  s: number
}

export type Position = {
  x: number
  y: number
}

/** Tile state: normal → weak → falling → gone → regenerating → normal */
export type HexTile = HexCoordinate & {
  state: 'normal' | 'weak' | 'falling' | 'gone' | 'regenerating'
  stateChangeTime: number
  fallTime: number
  goneTime: number
  regenerateTime: number
}

export type Penguin = Position & {
  dx: number
  dy: number
  dead: boolean
  falling: boolean
  fallStartTime: number
}

export type GameState = 'waiting' | 'countdown' | 'playing' | 'p1won' | 'p2won'

export type PolarBearEvent = {
  active: boolean
  startTime: number
  targetX: number
  targetY: number
  tiles: HexCoordinate[]
}
