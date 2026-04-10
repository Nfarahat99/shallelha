'use client'

import * as m from 'motion/react-m'

interface LeaderboardEntry {
  id: string
  name: string
  emoji: string
  score: number
  rank: number
  streak: number
}

interface LeaderboardOverlayProps {
  players: LeaderboardEntry[]
  onClose: () => void
}

export function LeaderboardOverlay({ players, onClose }: LeaderboardOverlayProps) {
  return (
    <m.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-y-0 end-0 w-full max-w-sm bg-gray-900 shadow-2xl flex flex-col z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
        <h2 className="text-2xl font-bold text-white">النتائج</h2>
        <button
          onClick={onClose}
          aria-label="إغلاق النتائج"
          className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
        >
          ×
        </button>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3"
          >
            {/* Rank */}
            <span className="text-lg font-bold text-gray-400 w-6 text-center shrink-0">
              {player.rank}
            </span>
            {/* Emoji */}
            <span className="text-2xl shrink-0">{player.emoji}</span>
            {/* Name */}
            <span className="flex-1 text-base font-semibold text-white text-start truncate">
              {player.name}
            </span>
            {/* Score */}
            <div className="text-end shrink-0">
              <span className="text-lg font-bold text-indigo-300">{player.score}</span>
              <span className="text-xs text-gray-500 ms-1">نقطة</span>
            </div>
            {/* Streak badge */}
            {player.streak >= 3 && (
              <span className="text-xs bg-orange-500 text-white rounded-full px-2 py-0.5 shrink-0">
                سلسلة ×1.5
              </span>
            )}
          </div>
        ))}
      </div>
    </m.div>
  )
}
