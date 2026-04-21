import type { AvatarConfig } from '@/components/avatar/avatar-parts'
import { PlayerAvatar } from '@/components/avatar/PlayerAvatar'

interface PlayerCardProps {
  name: string
  emoji: string
  isHost?: boolean
  avatarConfig?: AvatarConfig | null
}

export function PlayerCard({ name, emoji, isHost = false, avatarConfig }: PlayerCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm p-3">
      {avatarConfig != null ? (
        <PlayerAvatar config={avatarConfig} size={32} />
      ) : (
        <span className="text-2xl" aria-hidden="true">{emoji}</span>
      )}
      <span className="flex-1 text-sm font-medium text-white truncate">{name}</span>
      {isHost && (
        <span className="rounded-full bg-brand-600/30 border border-brand-500/40 px-2 py-0.5 text-xs font-medium text-brand-300">
          مضيف
        </span>
      )}
    </div>
  )
}
