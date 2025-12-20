import { type RefObject } from 'react'

interface GameCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  canvasSize: number
}

const GameCanvas = ({ canvasRef, canvasSize }: GameCanvasProps) => {
  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="border-4 border-blue-400 rounded-lg shadow-xl bg-white"
    />
  )
}

export default GameCanvas
