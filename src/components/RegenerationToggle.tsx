type RegenerationToggleProps = {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

const RegenerationToggle = ({ enabled, onToggle }: RegenerationToggleProps) => {
  return (
    <div className="fixed right-4 top-4 bg-white border-4 border-blue-400 rounded-lg p-3 shadow-lg z-10">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 accent-green-500 cursor-pointer"
        />
        <span className="text-sm font-semibold text-gray-700">
          Tile Regeneration
        </span>
      </label>
    </div>
  )
}

export default RegenerationToggle
