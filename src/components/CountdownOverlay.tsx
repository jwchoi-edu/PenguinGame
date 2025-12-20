interface CountdownOverlayProps {
  countdown: number
}

const CountdownOverlay = ({ countdown }: CountdownOverlayProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
      <div
        key={countdown}
        className="text-white text-9xl font-bold animate-fade-in"
      >
        {countdown === 0 ? 'GO!' : countdown}
      </div>
    </div>
  )
}

export default CountdownOverlay
