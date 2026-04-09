'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { PlayerCard } from '@/components/ui/PlayerCard'
import { HostControls } from '@/components/ui/HostControls'

interface Player {
  id: string
  name: string
  emoji: string
  socketId: string
}

interface HostDashboardProps {
  roomCode: string
  userId: string
}

export function HostDashboard({ roomCode, userId }: HostDashboardProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [status, setStatus] = useState<'lobby' | 'playing' | 'ended'>('lobby')
  const [connected, setConnected] = useState(false)

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${roomCode}`
      : `/join/${roomCode}`

  useEffect(() => {
    const socket = getSocket()
    socket.auth = { userId }

    if (!socket.connected) {
      socket.connect()
    }

    // Rejoin existing room — does NOT create a new room on refresh
    socket.emit('room:rejoin', { roomCode })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('lobby:update', ({ players: updated }: { players: Player[] }) => {
      setPlayers(updated)
    })

    socket.on('room:error', ({ message }: { message: string }) => {
      console.error('[Host] Socket error:', message)
    })

    socket.on('game:started', () => setStatus('playing'))
    socket.on('game:ended', () => setStatus('ended'))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('lobby:update')
      socket.off('room:error')
      socket.off('game:started')
      socket.off('game:ended')
    }
  }, [roomCode, userId])

  const handleStart = useCallback(() => {
    getSocket().emit('room:start')
  }, [])

  const handleEnd = useCallback(() => {
    getSocket().emit('room:end')
  }, [])

  return (
    <div className="min-h-screen flex flex-col p-6 gap-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">غرفة اللعب</h1>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500">{connected ? 'متصل' : 'غير متصل'}</span>
        </div>
      </div>

      {/* Room code display */}
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6 text-center space-y-2">
        <p className="text-sm text-indigo-600 font-medium">كود الغرفة</p>
        <p className="text-5xl font-bold tracking-widest text-indigo-700 font-mono">{roomCode}</p>
        <p className="text-xs text-indigo-400 break-all">{joinUrl}</p>
      </div>

      {/* Players list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500">
          اللاعبون ({players.length}/8)
        </h2>
        {players.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            في انتظار اللاعبين…
          </p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <PlayerCard key={player.id} name={player.name} emoji={player.emoji} />
            ))}
          </div>
        )}
      </div>

      {/* Host controls — only host sees start/end */}
      <div className="mt-auto">
        <HostControls
          onStart={handleStart}
          onEnd={handleEnd}
          playerCount={players.length}
          status={status}
        />
      </div>
    </div>
  )
}
