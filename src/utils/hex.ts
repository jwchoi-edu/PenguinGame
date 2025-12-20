/** Hexagonal coordinate utilities (flat-top orientation) */

import { HEX_SIZE } from '../constants'
import type { HexCoordinate, Position } from '../types'

/**
 * Hex to pixel: x = size*(3/2*q), y = size*(√3/2*q + √3*r)
 */
export const hexToPixel = (q: number, r: number): Position => {
  const x = HEX_SIZE * ((3 / 2) * q)
  const y = HEX_SIZE * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r)

  return { x, y }
}

/**
 * Rounds floating-point coordinates to nearest valid hexagon
 * Algorithm from Red Blob Games: recalculate coordinate with largest error
 */
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

/**
 * Pixel to hex: q = (2/3*x)/size, r = (-1/3*x + √3/3*y)/size
 */
export const pixelToHex = (x: number, y: number) => {
  const q = ((2 / 3) * x) / HEX_SIZE
  const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / HEX_SIZE

  return axialRound(q, r)
}
