'use client'

import * as m from 'motion/react-m'
import type { AvatarConfig } from '@/components/avatar/avatar-parts'
import { PlayerAvatar } from '@/components/avatar/PlayerAvatar'

interface PlayerIndicatorsProps {
  players: Array<{ id: string; name: string; emoji: string; avatarConfig?: AvatarConfig | null }>
  answeredPlayerIds: Set<string>
}

export function PlayerIndicators({ players, answeredPlayerIds }: PlayerIndicatorsProps) {
  return (
    <div className="flex flex-row items-center justify-center gap-3 px-6 py-3 shrink-0">
      {players.map((player) => {
        const hasAnswered = answeredPlayerIds.has(player.id)
        return (
          <m.div
            key={player.id}
            animate={
              hasAnswered
                ? { scale: 1.1, opacity: 1 }
                : { scale: 1, opacity: 0.6 }
            }
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`flex flex-col items-center gap-1 rounded-full p-2 transition-colors ${
              hasAnswered
                ? 'ring-2 ring-brand-400 bg-brand-950'
                : 'bg-gray-800'
            }`}
            aria-label={hasAnswered ? `${player.name} — أجاب` : player.name}
          >
            <PlayerAvatar config={player.avatarConfig} size={40} />
          </m.div>
        )
      })}
    </div>
  )
}
