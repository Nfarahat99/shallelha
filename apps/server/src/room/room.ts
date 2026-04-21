import type { AvatarConfig } from './avatar.types'

export interface Player {
  /** Reconnect token — UUID assigned on join, stored in client sessionStorage */
  id: string
  /** Arabic display name, max 15 chars */
  name: string
  /** Selected emoji avatar */
  emoji: string
  /** Current socket ID — updated on reconnect */
  socketId: string
  /** SVG avatar config — AC-008-3: added in Phase 12; optional for backward compat */
  avatarConfig?: AvatarConfig | null
}

export interface Room {
  code: string
  hostId: string
  hostSocketId: string
  players: Player[]
  status: 'lobby' | 'playing' | 'ended'
  createdAt: number
  /** Optional: ID of the pre-selected question pack. Only set for APPROVED packs. */
  packId?: string
}
