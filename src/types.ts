export type HexCoordinate = {
  q: number
  r: number
  s: number
}

export type Position = {
  x: number
  y: number
}

export type HexGrid = {
  q: number
  r: number
  s: number
  state: number
  stateChangeTime: number
  fallTime: number
}

export type Penguin = {
  x: number
  y: number
  vx: number
  vy: number
  dead: boolean
  falling: boolean
  fallStartTime: number
}

export type GameState = 'countdown' | 'playing' | 'p1won' | 'p2won'
