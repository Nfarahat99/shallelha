'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import { getSocket } from '@/lib/socket'
import { PlayerCard } from '@/components/ui/PlayerCard'
import { HostControls } from '@/components/ui/HostControls'
import SkeletonCard from '@/components/ui/SkeletonCard'
import { HostPreGame, type HostSettings } from './game/HostPreGame'
import { HostGameScreen } from './game/HostGameScreen'
import { QuestionDisplay } from './game/QuestionDisplay'
import { TimerDisplay } from './game/TimerDisplay'
import { PlayerIndicators } from './game/PlayerIndicators'
import { HostInGameControls } from './game/HostInGameControls'
import { LeaderboardOverlay } from './game/LeaderboardOverlay'
import { PodiumScreen } from './game/PodiumScreen'
import { VotingDisplay } from './game/VotingDisplay'

interface Player {
  id: string
  name: string
  emoji: string
  socketId: string
}

interface LeaderboardEntry {
  id: string
  name: string
  emoji: string
  score: number
  rank: number
  streak: number
}

interface CurrentQuestion {
  text: string
  options: string[]
  timerDuration: number
  type?: 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'
  mediaUrl?: string
}

type GamePhase = 'question' | 'reveal' | 'leaderboard' | 'podium' | 'voting'

interface HostDashboardProps {
  roomCode: string
  userId: string
}

export function HostDashboard({ roomCode, userId }: HostDashboardProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [status, setStatus] = useState<'lobby' | 'pre-game' | 'playing' | 'ended'>('lobby')
  const [connected, setConnected] = useState(false)

  // Game state
  const [hostSettings, setHostSettings] = useState<HostSettings>({
    layout: '2x2',
    timerStyle: 'bar',
    revealMode: 'manual',
  })
  const [gamePhase, setGamePhase] = useState<GamePhase>('question')
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionTotal, setQuestionTotal] = useState(1)
  const [questionStartedAt, setQuestionStartedAt] = useState(0)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [answeredPlayerIds, setAnsweredPlayerIds] = useState<Set<string>>(new Set())
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [podium, setPodium] = useState<LeaderboardEntry[]>([])

  // Free text state
  const [freeTextAnswers, setFreeTextAnswers] = useState<Array<{ playerId: string; emoji: string; text: string }>>([])
  const [votingAnswers, setVotingAnswers] = useState<Array<{ id: string; emoji: string; text: string }>>([])
  const [votingDeadline, setVotingDeadline] = useState(0)
  const [freeTextWinner, setFreeTextWinner] = useState<{ winnerId: string; winnerText: string } | null>(null)

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

    socket.emit('room:rejoin', { roomCode })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('lobby:update', ({ players: updated }: { players: Player[] }) => {
      setPlayers(updated)
    })

    socket.on('room:error', ({ message }: { message: string }) => {
      console.error('[Host] Socket error:', message)
    })

    socket.on('game:started', () => {
      setStatus('playing')
      setGamePhase('question')
    })

    socket.on('game:configured', ({ hostSettings: settings }: { hostSettings: HostSettings }) => {
      setHostSettings(settings)
    })

    socket.on(
      'question:start',
      ({
        question,
        questionIndex: qi,
        total,
      }: {
        question: CurrentQuestion
        questionIndex: number
        total: number
        hostSettings: HostSettings
      }) => {
        setCurrentQuestion(question)
        setQuestionIndex(qi)
        setQuestionTotal(total)
        setQuestionStartedAt(Date.now())
        setCorrectIndex(null)
        setAnsweredPlayerIds(new Set())
        setGamePhase('question')
        setShowLeaderboard(false)
        // Reset free text state for new question
        setFreeTextAnswers([])
        setVotingAnswers([])
        setFreeTextWinner(null)
        setVotingDeadline(0)
      }
    )

    socket.on('freetext:answers', ({ answers }: { answers: Array<{ playerId: string; emoji: string; text: string }> }) => {
      setFreeTextAnswers(answers)
    })

    socket.on('freetext:lock', ({ answers, votingDeadline }: { answers: Array<{ id: string; emoji: string; text: string }>; votingDeadline?: number }) => {
      setVotingAnswers(answers)
      setVotingDeadline(votingDeadline ?? Date.now() + 15_000)
      setGamePhase('voting')
    })

    socket.on('freetext:results', ({ winnerId, winnerText }: { winnerId: string; winnerText: string; votes: Record<string, string[]>; authorBonus: string[] }) => {
      setFreeTextWinner({ winnerId, winnerText })
      setGamePhase('reveal')
    })

    socket.on(
      'question:progress',
      ({ answeredIds }: { answeredCount: number; totalPlayers: number; answeredIds: string[] }) => {
        setAnsweredPlayerIds(new Set(answeredIds))
      }
    )

    socket.on(
      'question:revealed',
      ({
        correctAnswerIndex,
      }: {
        correctAnswerIndex: number
        playerResults: Array<{ id: string; score: number; streak: number }>
      }) => {
        setCorrectIndex(correctAnswerIndex)
        setGamePhase('reveal')
      }
    )

    socket.on(
      'leaderboard:update',
      ({ players: lb }: { players: LeaderboardEntry[] }) => {
        setLeaderboard(lb)
      }
    )

    socket.on(
      'game:podium',
      ({ top3 }: { top3: LeaderboardEntry[] }) => {
        setPodium(top3)
        setGamePhase('podium')
      }
    )

    socket.on('game:ended', () => setStatus('ended'))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('lobby:update')
      socket.off('room:error')
      socket.off('game:started')
      socket.off('game:configured')
      socket.off('question:start')
      socket.off('question:progress')
      socket.off('question:revealed')
      socket.off('leaderboard:update')
      socket.off('game:podium')
      socket.off('game:ended')
      socket.off('freetext:answers')
      socket.off('freetext:lock')
      socket.off('freetext:results')
    }
  }, [roomCode, userId])

  // Lobby handlers
  const handleLobbyStart = useCallback(() => {
    setStatus('pre-game')
  }, [])

  const handlePreGameStart = useCallback(
    (settings: HostSettings) => {
      setHostSettings(settings)
      getSocket().emit('game:configure', settings)
      getSocket().emit('game:start', {})
    },
    []
  )

  const handleEnd = useCallback(() => {
    getSocket().emit('room:end')
  }, [])

  const handleGameEnd = useCallback(() => {
    getSocket().emit('game:end')
  }, [])

  // In-game control handlers
  const handleReveal = useCallback(() => {
    getSocket().emit('question:reveal')
  }, [])

  const handleLockFreeText = useCallback(() => {
    // Reuse reveal — server routes FREE_TEXT to startVotingPhase (T-05-15)
    getSocket().emit('question:reveal')
  }, [])

  const handleNext = useCallback(() => {
    getSocket().emit('question:next')
    setShowLeaderboard(false)
  }, [])

  const handleLeaderboard = useCallback(() => {
    getSocket().emit('leaderboard:show')
    setShowLeaderboard(true)
    setGamePhase('leaderboard')
  }, [])

  // --- Render ---

  if (status === 'lobby') {
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
          <h2 className="text-sm font-semibold text-gray-500">اللاعبون ({players.length}/8)</h2>
          {players.length === 0 ? (
            <SkeletonCard count={3} />
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <PlayerCard key={player.id} name={player.name} emoji={player.emoji} />
              ))}
            </div>
          )}
        </div>

        {/* Host controls */}
        <div className="mt-auto">
          <HostControls
            onStart={handleLobbyStart}
            onEnd={handleEnd}
            playerCount={players.length}
            status="lobby"
          />
        </div>
      </div>
    )
  }

  if (status === 'pre-game') {
    return (
      <HostPreGame
        onStart={handlePreGameStart}
        playerCount={players.length}
      />
    )
  }

  if (status === 'playing') {
    // Podium phase
    if (gamePhase === 'podium') {
      return (
        <HostGameScreen roomCode={roomCode}>
          <PodiumScreen top3={podium} />
        </HostGameScreen>
      )
    }

    // Voting phase — free text voting in progress
    if (gamePhase === 'voting') {
      return (
        <HostGameScreen roomCode={roomCode}>
          <div className="flex-1 flex flex-col min-h-0">
            <VotingDisplay
              answers={votingAnswers}
              votingDeadline={votingDeadline}
              winnerResult={freeTextWinner}
            />
            <HostInGameControls
              gamePhase={gamePhase}
              onReveal={handleReveal}
              onNext={handleNext}
              onLeaderboard={handleLeaderboard}
              onEnd={handleGameEnd}
              onLockFreeText={handleLockFreeText}
              currentQuestionType={currentQuestion?.type}
            />
          </div>
        </HostGameScreen>
      )
    }

    // Active game phase (question / reveal / leaderboard)
    return (
      <HostGameScreen roomCode={roomCode}>
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Timer — bar variant sits at top, others are overlaid */}
          {currentQuestion && (
            <TimerDisplay
              timerStyle={hostSettings.timerStyle}
              duration={currentQuestion.timerDuration}
              startedAt={questionStartedAt}
              active={gamePhase === 'question'}
            />
          )}

          {/* Question and options */}
          {currentQuestion ? (
            <QuestionDisplay
              text={currentQuestion.text}
              options={currentQuestion.options}
              layout={hostSettings.layout}
              revealed={gamePhase === 'reveal' || gamePhase === 'leaderboard'}
              correctIndex={correctIndex}
              questionIndex={questionIndex}
              total={questionTotal}
              type={currentQuestion.type}
              mediaUrl={currentQuestion.mediaUrl}
              timerDuration={currentQuestion.timerDuration}
              freeTextAnswers={freeTextAnswers}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-white text-2xl animate-pulse">جارٍ تحميل الأسئلة…</div>
            </div>
          )}

          {/* Player indicators */}
          <PlayerIndicators
            players={players}
            answeredPlayerIds={answeredPlayerIds}
          />

          {/* In-game controls */}
          <HostInGameControls
            gamePhase={gamePhase}
            onReveal={handleReveal}
            onNext={handleNext}
            onLeaderboard={handleLeaderboard}
            onEnd={handleGameEnd}
            onLockFreeText={handleLockFreeText}
            currentQuestionType={currentQuestion?.type}
          />

          {/* Leaderboard overlay */}
          <AnimatePresence>
            {showLeaderboard && (
              <LeaderboardOverlay
                players={leaderboard}
                onClose={() => setShowLeaderboard(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </HostGameScreen>
    )
  }

  // ended
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-2xl font-bold text-gray-700">انتهت اللعبة</p>
      <a href="/host" className="text-indigo-600 hover:underline">
        العودة إلى الرئيسية
      </a>
    </div>
  )
}
