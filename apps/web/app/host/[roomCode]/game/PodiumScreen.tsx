'use client'

import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'
import type { AvatarConfig } from '@/components/avatar/avatar-parts'
import { PlayerAvatar } from '@/components/avatar/PlayerAvatar'

interface PodiumEntry {
  id: string
  name: string
  emoji: string
  score: number
  rank: number
  avatarConfig?: AvatarConfig | null
}

interface PodiumScreenProps {
  top3: PodiumEntry[]
}

// staggerDirection: -1 means the LAST child animates first.
// Render order: [1st, 2nd, 3rd] → with staggerDirection -1, 3rd animates first (drama: 3rd → 2nd → 1st)
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.4,
      staggerDirection: -1 as const,
    },
  },
}

// Classic podium visual order: [2nd] [1st] [3rd]
const VISUAL_ORDER = [1, 0, 2] // indices into sorted top3 array (0=1st, 1=2nd, 2=3rd)

const MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

const BAR_HEIGHTS: Record<number, string> = {
  1: 'h-40',
  2: 'h-32',
  3: 'h-24',
}

export function PodiumScreen({ top3 }: PodiumScreenProps) {
  const reducedMotion = useReducedMotion() ?? false

  const itemVariants = {
    hidden: reducedMotion ? { opacity: 0 } : { y: 40, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  }

  // Sort top3 by rank ascending (rank 1 = first)
  const sorted = [...top3].sort((a, b) => a.rank - b.rank)

  // Build display slots in visual podium order: [2nd place, 1st place, 3rd place]
  // If fewer than 3 players, only show available
  const slots = VISUAL_ORDER.map((i) => sorted[i] ?? null).filter(Boolean) as PodiumEntry[]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 px-8">
      {/* Heading */}
      <h1 className="text-4xl font-black text-white mb-12">المتصدرون</h1>

      {/* Podium container — staggered entrance */}
      {/* Render in order [1st, 2nd, 3rd] so staggerDirection:-1 shows 3rd first */}
      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex items-end justify-center gap-6 mt-8 w-full max-w-2xl"
      >
        {sorted.map((entry) => {
          const barHeight = BAR_HEIGHTS[entry.rank] ?? 'h-24'
          const medal = MEDALS[entry.rank] ?? ''

          return (
            <m.div
              key={entry.id}
              variants={itemVariants}
              className="flex flex-col items-center gap-2 flex-1"
            >
              {/* Player info (sits above podium bar) */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <PlayerAvatar config={entry.avatarConfig} size={entry.rank === 1 ? 72 : 56} />
                <span className="text-2xl font-bold text-white text-start">{entry.name}</span>
                <span className="text-xl font-semibold text-brand-300">{entry.score} نقطة</span>
                {medal && (
                  <span
                    className={
                      entry.rank === 1
                        ? 'text-4xl'
                        : entry.rank === 2
                          ? 'text-3xl'
                          : 'text-2xl'
                    }
                  >
                    {medal}
                  </span>
                )}
              </div>

              {/* Podium bar */}
              <div
                className={`w-full ${barHeight} bg-gray-800 rounded-t-2xl flex items-start justify-center pt-3`}
              >
                <span className="text-lg font-bold text-gray-400">{entry.rank}</span>
              </div>
            </m.div>
          )
        })}
      </m.div>
    </div>
  )
}
