export interface Player {
  /** Reconnect token — UUID assigned on join, stored in client sessionStorage */
  id: string
  /** Arabic display name, max 15 chars */
  name: string
  /** Selected emoji avatar */
  emoji: string
  /** Current socket ID — updated on reconnect */
  socketId: string
}

export interface Room {
  code: string
  hostId: string
  hostSocketId: string
  players: Player[]
  status: 'lobby' | 'playing' | 'ended'
  createdAt: number
}
