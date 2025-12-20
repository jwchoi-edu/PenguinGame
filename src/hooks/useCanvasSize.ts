import { useEffect, useState } from 'react'

export const useCanvasSize = () => {
  const [canvasSize, setCanvasSize] = useState(800)

  useEffect(() => {
    const updateCanvasSize = () => {
      const headerHeight = 200
      const availableHeight = window.innerHeight - headerHeight
      const availableWidth = window.innerWidth - 100

      const size = Math.min(availableHeight, availableWidth, 800)
      setCanvasSize(Math.max(400, size))
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  return canvasSize
}
