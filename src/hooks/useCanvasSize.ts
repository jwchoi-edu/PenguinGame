import { useEffect, useState } from 'react'

export const useCanvasSize = () => {
  const [canvasSize, setCanvasSize] = useState(800)

  useEffect(() => {
    const updateCanvasSize = () => {
      const margin = 16 * 2 // 16px on each side (same as RegenerationToggle's right-4 and top-4)
      const borderWidth = 4 * 2 // 4px border on each side (border-4)
      const availableHeight = window.innerHeight - margin - borderWidth
      const availableWidth = window.innerWidth - margin - borderWidth

      const size = Math.min(availableHeight, availableWidth)
      setCanvasSize(Math.max(400, size))
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  return canvasSize
}
