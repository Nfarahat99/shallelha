'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { PlayerCard } from '@/components/ui/PlayerCard'

interface Player {
  id: string
  name: string
  emoji: string
  socketId: string
}

type JoinPhase = 'form' | 'lobby' | 'playing' | 'ended'

const RECONNECT_KEY = (code: string) => `shllahaReconnectToken_${code}`

interface PlayerJoinProps {
  roomCode: string
}

export function PlayerJoin({ roomCode }: PlayerJoinProps) {
  const [phase, setPhase] = useState<JoinPhase>('form')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🦁')
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState<string | null>(null)
  const [myToken, setMyToken] = useState<string | null>(null)

  // Attempt reconnect on mount if token exists in sessionStorage
  useEffect(() => {
    const storedToken = sessionStorage.getItem(RECONNECT_KEY(roomCode))
    if (!storedToken) return

    const socket = getSocket()
    socket.connect()
    socket.emit('reconnect:player', { roomCode, reconnectToken: storedToken })

    socket.once('room:joined', ({ reconnectToken, players: joined }: { reconnectToken: string; players: Player[] }) => {
      sessionStorage.setItem(RECONNECT_KEY(roomCode), reconnectToken)
      setMyToken(reconnectToken)
      setPlayers(joined)
      setPhase('lobby')
    })

    socket.once('room:error', () => {
      // Token expired — show the join form instead
      sessionStorage.removeItem(RECONNECT_KEY(roomCode))
      socket.off('room:joined')
    })

    return () => {
      socket.off('room:joined')
      socket.off('room:error')
    }
  }, [roomCode])

  // Listen for lobby/game updates after joining
  useEffect(() => {
    if (phase === 'form') return

    const socket = getSocket()

    socket.on('lobby:update', ({ players: updated }: { players: Player[] }) => {
      setPlayers(updated)
    })
    socket.on('game:started', () => setPhase('playing'))
    socket.on('game:ended', () => setPhase('ended'))

    return () => {
      socket.off('lobby:update')
      socket.off('game:started')
      socket.off('game:ended')
    }
  }, [phase])

  const handleJoin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim() || !emoji) return

      const socket = getSocket()
      socket.connect()

      socket.once('room:joined', ({ reconnectToken, players: joined }: { reconnectToken: string; players: Player[] }) => {
        sessionStorage.setItem(RECONNECT_KEY(roomCode), reconnectToken)
        setMyToken(reconnectToken)
        setPlayers(joined)
        setPhase('lobby')
      })

      socket.once('room:error', ({ message }: { message: string }) => {
        setError(message)
        socket.off('room:joined')
      })

      socket.emit('room:join', { roomCode, name: name.trim(), emoji })
    },
    [roomCode, name, emoji],
  )

  if (phase === 'form') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">شعللها</h1>
          <p className="text-gray-500 text-sm">غرفة <span dir="ltr" className="font-mono font-bold">{roomCode}</span></p>
        </div>

        <form onSubmit={handleJoin} className="w-full max-w-sm space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Name input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">اسمك</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 15))}
              placeholder="أدخل اسمك"
              maxLength={15}
              required
              autoFocus
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 text-end">{name.length}/15</p>
          </div>

          {/* Emoji picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">اختر رمزك</label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            انضم إلى الغرفة
          </button>
        </form>
      </main>
    )
  }

  if (phase === 'lobby') {
    const myPlayer = players.find(p => p.id === myToken)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center space-y-1">
          {myPlayer && (
            <div className="text-5xl mb-2">{myPlayer.emoji}</div>
          )}
          <h2 className="text-xl font-bold">في انتظار بدء اللعبة</h2>
          <p className="text-gray-500 text-sm">
            غرفة <span dir="ltr" className="font-mono font-bold">{roomCode}</span> · {players.length} لاعب
          </p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          {players.map((p) => (
            <PlayerCard key={p.id} name={p.name} emoji={p.emoji} />
          ))}
        </div>

        <p className="text-sm text-gray-400 animate-pulse">في انتظار المضيف…</p>
      </main>
    )
  }

  if (phase === 'playing') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-4xl">🎮</p>
          <h2 className="text-2xl font-bold">اللعبة بدأت!</h2>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-4xl">🏁</p>
        <h2 className="text-2xl font-bold">انتهت اللعبة</h2>
        <a href="/join" className="text-indigo-600 text-sm underline">العب مرة أخرى</a>
      </div>
    </main>
  )
}
