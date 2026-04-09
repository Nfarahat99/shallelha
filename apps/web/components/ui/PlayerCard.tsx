interface PlayerCardProps {
  name: string
  emoji: string
  isHost?: boolean
}

export function PlayerCard({ name, emoji, isHost = false }: PlayerCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{name}</span>
      {isHost && (
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
          مضيف
        </span>
      )}
    </div>
  )
}
