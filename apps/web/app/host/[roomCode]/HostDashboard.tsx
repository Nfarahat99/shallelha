'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import { getSocket } from '@/lib/socket'
import type { AvatarConfig } from '@/components/avatar/avatar-parts'
import { PlayerCard } from '@/components/ui/PlayerCard'
import { HostControls } from '@/components/ui/HostControls'
import SkeletonCard from '@/components/ui/SkeletonCard'
import WhatsAppShareButton from './WhatsAppShareButton'
import QRCodeDisplay from './QRCodeDisplay'
import { HostPreGame, type HostSettings } from './game/HostPreGame'
import { HostGameScreen } from './game/HostGameScreen'
import { QuestionDisplay } from './game/QuestionDisplay'
import { TimerDisplay } from './game/TimerDisplay'
import { PlayerIndicators } from './game/PlayerIndicators'
import { HostInGameControls } from './game/HostInGameControls'
import { LeaderboardOverlay } from './game/LeaderboardOverlay'
import { PodiumScreen } from './game/PodiumScreen'
import { VotingDisplay } from './game/VotingDisplay'
import { ResultCard } from './game/ResultCard'

interface Player {
  id: string
  name: string
  emoji: string
  socketId: string
  avatarConfig?: AvatarConfig | null
}

interface LeaderboardEntry {
  id: string
  name: string
  emoji: string
  score: number
  rank: number
  streak: number
  avatarConfig?: AvatarConfig | null
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

  // Answer progress counters (Plan 10-07)
  const [answerCount, setAnswerCount] = useState(0)
  const [playerCount, setPlayerCount] = useState(0)

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
        // Reset answer progress counters
        setAnswerCount(0)
        setPlayerCount(0)
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
      ({ answerCount: ac, playerCount: pc, answeredIds }: { answerCount: number; playerCount: number; answeredIds: string[] }) => {
        setAnsweredPlayerIds(new Set(answeredIds))
        setAnswerCount(ac)
        setPlayerCount(pc)
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
      ({ top3, leaderboard: fullLeaderboard }: { top3: LeaderboardEntry[]; leaderboard?: LeaderboardEntry[] }) => {
        setPodium(top3)
        if (fullLeaderboard && fullLeaderboard.length > 0) {
          setLeaderboard(fullLeaderboard)
        }
        setGamePhase('podium')
        setStatus('ended')
      }
    )

    socket.on('game:ended', () => setStatus('ended'))

    socket.on('room:reset', () => {
      setStatus('lobby')
      setGamePhase('question')
      setPodium([])
      setLeaderboard([])
      setCurrentQuestion(null)
      setCorrectIndex(null)
      setAnsweredPlayerIds(new Set())
      setShowLeaderboard(false)
      setFreeTextAnswers([])
      setVotingAnswers([])
      setFreeTextWinner(null)
      setAnswerCount(0)
      setPlayerCount(0)
    })

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
      socket.off('room:reset')
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

  const handlePlayAgain = useCallback(() => {
    getSocket().emit('game:reset')
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
      <div className="min-h-dvh flex flex-col bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900 p-6 gap-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold text-white">غرفة اللعب</h1>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-white/20'}`} />
            <span className="text-xs text-white/50">{connected ? 'متصل' : 'غير متصل'}</span>
          </div>
        </div>

        {/* Room code display */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-6 text-center space-y-2">
          <p className="text-sm text-brand-300 font-medium">كود الغرفة</p>
          <p className="text-5xl font-bold tracking-widest text-white font-mono">{roomCode}</p>
          <p className="text-xs text-white/30 break-all">{joinUrl}</p>
          <div className="pt-2">
            <QRCodeDisplay joinUrl={joinUrl} />
          </div>
        </div>

        {/* WhatsApp share */}
        <WhatsAppShareButton roomCode={roomCode} joinUrl={joinUrl} />

        {/* Players list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/50">اللاعبون ({players.length}/8)</h2>
          {players.length === 0 ? (
            <SkeletonCard count={3} />
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <PlayerCard key={player.id} name={player.name} emoji={player.emoji} avatarConfig={player.avatarConfig} />
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
              answerCount={answerCount}
              playerCount={playerCount}
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

  // ended — post-game screen with shareable result card
  return (
    <div
      className="min-h-dvh flex flex-col bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900 overflow-y-auto"
      dir="rtl"
    >
      <div className="max-w-lg mx-auto w-full flex flex-col gap-6 px-6 py-8 pb-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-4xl font-black text-brand-400">شعللها</span>
          <p className="text-2xl font-bold text-white">انتهت اللعبة!</p>
          <p className="text-sm text-white/50">كود الغرفة: {roomCode}</p>
        </div>

        {/* Result card with share/download UI */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <ResultCard gameId={roomCode} leaderboard={leaderboard} />
        </div>

        {/* Play Again */}
        <button
          onClick={handlePlayAgain}
          className="w-full flex items-center justify-center py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 transition-all font-bold text-white text-base"
        >
          العب مجدداً
        </button>

        {/* Back to home */}
        <a
          href="/host"
          className="w-full flex items-center justify-center py-3 rounded-2xl bg-white/8 border border-white/10 text-white/70 hover:text-white hover:bg-white/12 transition-all font-semibold text-base"
        >
          العودة إلى الرئيسية
        </a>
      </div>
    </div>
  )
}
