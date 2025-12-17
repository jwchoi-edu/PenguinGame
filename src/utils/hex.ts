import { HEX_SIZE } from '../constants'
import type { HexCoordinate, Position } from '../types'

export const hexToPixel = (q: number, r: number): Position => {
  const x = HEX_SIZE * ((3 / 2) * q)
  const y = HEX_SIZE * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r)
  return { x, y }
}

export const axialRound = (q: number, r: number): HexCoordinate => {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  const rs = Math.round(s)

  const q_diff = Math.abs(rq - q)
  const r_diff = Math.abs(rr - r)
  const s_diff = Math.abs(rs - s)

  if (q_diff > r_diff && q_diff > s_diff) {
    rq = -rr - rs
  } else if (r_diff > s_diff) {
    rr = -rq - rs
  }

  return { q: rq, r: rr, s: -rq - rr }
}

export const pixelToHex = (x: number, y: number): HexCoordinate => {
  const q = ((2 / 3) * x) / HEX_SIZE
  const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / HEX_SIZE
  return axialRound(q, r)
}
