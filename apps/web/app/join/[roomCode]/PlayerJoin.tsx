'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { PlayerCard } from '@/components/ui/PlayerCard'
import ErrorBanner from '@/components/ui/ErrorBanner'
import LoadingButton from '@/components/ui/LoadingButton'
import DisconnectBanner from '@/components/ui/DisconnectBanner'
import SkeletonCard from '@/components/ui/SkeletonCard'
import { PlayerGameScreen } from './game/PlayerGameScreen'
import { AnswerOptions } from './game/AnswerOptions'
import { PlayerTimerBar } from './game/PlayerTimerBar'
import { WaitingScreen } from './game/WaitingScreen'
import { MediaQuestion } from '@/app/host/[roomCode]/game/MediaQuestion'
import { FreeTextInput } from './game/FreeTextInput'
import { VotingUI } from './game/VotingUI'
import { LifelineBar } from './game/LifelineBar'
import { FreezeOpponentOverlay } from './game/FreezeOpponentOverlay'

interface Player {
  id: string
  name: string
  emoji: string
  socketId: string
}

type JoinPhase = 'form' | 'lobby' | 'playing' | 'ended'

/** Player phase during a question lifecycle */
type PlayerPhase = 'answering' | 'waiting' | 'revealed' | 'voting'

/** Answer option Tailwind color classes — must match AnswerOptions and host QuestionDisplay (D-04) */
const ANSWER_COLORS = [
  'bg-red-500 text-white',        // A
  'bg-blue-500 text-white',       // B
  'bg-yellow-400 text-gray-900',  // C
  'bg-green-500 text-white',      // D
] as const

const RECONNECT_KEY = (code: string) => `shllahaReconnectToken_${code}`

interface PlayerJoinProps {
  roomCode: string
}

export function PlayerJoin({ roomCode }: PlayerJoinProps) {
  // ── Core join state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<JoinPhase>('form')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🦁')
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [myToken, setMyToken] = useState<string | null>(null)

  // ── Game state ─────────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<{
    text: string
    options: string[]
    timerDuration: number
    type?: 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'
    mediaUrl?: string
  } | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [hostSettings, setHostSettings] = useState<{
    layout: '2x2' | '4-column' | 'vertical'
    timerStyle: 'bar' | 'circle' | 'number'
    revealMode: 'auto' | 'manual'
  }>({ layout: '2x2', timerStyle: 'bar', revealMode: 'manual' })
  const [myAnswer, setMyAnswer] = useState<number | null>(null)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [playerPhase, setPlayerPhase] = useState<PlayerPhase>('answering')
  const [questionStartedAt, setQuestionStartedAt] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [myStreak, setMyStreak] = useState(0)

  // Free text state
  const [freeTextSubmitted, setFreeTextSubmitted] = useState(false)
  const [submittedText, setSubmittedText] = useState('')
  const [votingAnswers, setVotingAnswers] = useState<Array<{ id: string; emoji: string; text: string }>>([])
  const [votedAnswerId, setVotedAnswerId] = useState<string | null>(null)
  const [votingDeadline, setVotingDeadline] = useState(0)

  // ── Lifeline state (Phase 6) ──────────────────────────────────────────────
  const [doublePointsUsed, setDoublePointsUsed] = useState(false)
  const [removeTwoUsed, setRemoveTwoUsed] = useState(false)
  const [freezeOpponentUsed, setFreezeOpponentUsed] = useState(false)
  const [doublePointsActive, setDoublePointsActive] = useState(false)
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([])
  const [freezeOverlayOpen, setFreezeOverlayOpen] = useState(false)
  const [freezeError, setFreezeError] = useState<string | null>(null)

  // ── Reconnect on mount ─────────────────────────────────────────────────────
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
      sessionStorage.removeItem(RECONNECT_KEY(roomCode))
      socket.off('room:joined')
    })

    return () => {
      socket.off('room:joined')
      socket.off('room:error')
    }
  }, [roomCode])

  // ── Lobby + game event listeners ───────────────────────────────────────────
  useEffect(() => {
    if (phase === 'form') return

    const socket = getSocket()

    socket.on('lobby:update', ({ players: updated }: { players: Player[] }) => {
      setPlayers(updated)
    })
    socket.on('game:started', () => setPhase('playing'))
    socket.on('game:ended', () => setPhase('ended'))

    // question:start — received when host starts each new question (D-07)
    socket.on('question:start', ({
      question,
      questionIndex: qi,
      hostSettings: hs,
    }: {
      question: { text: string; options: string[]; timerDuration: number; type?: 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'; mediaUrl?: string }
      questionIndex: number
      total: number
      hostSettings: { layout: '2x2' | '4-column' | 'vertical'; timerStyle: 'bar' | 'circle' | 'number'; revealMode: 'auto' | 'manual' }
    }) => {
      setCurrentQuestion(question)
      setQuestionIndex(qi)
      setHostSettings(hs)
      setMyAnswer(null)
      setCorrectIndex(null)
      setPlayerPhase('answering')
      setQuestionStartedAt(Date.now())
      setPhase('playing')
      // Reset free text state for new question
      setFreeTextSubmitted(false)
      setSubmittedText('')
      setVotingAnswers([])
      setVotedAnswerId(null)
      setVotingDeadline(0)
      // Reset lifeline per-question state
      setDoublePointsActive(false)
      setEliminatedIndices([])
      setFreezeOverlayOpen(false)
      setFreezeError(null)
    })

    // freetext:lock — voting phase starts
    socket.on('freetext:lock', ({ answers, votingDeadline }: { answers: Array<{ id: string; emoji: string; text: string }>; votingDeadline?: number }) => {
      setVotingAnswers(answers)
      setVotingDeadline(votingDeadline ?? Date.now() + 15_000)
      setPlayerPhase('voting')
    })

    // freetext:results — voting resolved
    socket.on('freetext:results', (_data: { winnerId: string; winnerText: string; votes: Record<string, string[]>; authorBonus: string[] }) => {
      setPlayerPhase('revealed')
    })

    // Phase 6: Lifeline acknowledgement listeners
    socket.on('lifeline:double_points_ack', () => {
      setDoublePointsUsed(true)
      setDoublePointsActive(true)
    })
    socket.on('lifeline:remove_two_result', ({ eliminatedIndices: ei }: { eliminatedIndices: number[] }) => {
      setRemoveTwoUsed(true)
      setEliminatedIndices(ei)
    })
    socket.on('lifeline:freeze_ack', ({ success, reason }: { success: boolean; reason?: string }) => {
      if (success) {
        setFreezeOpponentUsed(true)
        setFreezeOverlayOpen(false)
      } else {
        setFreezeOverlayOpen(false)
        if (reason === 'already_answered') {
          setFreezeError('اللاعب أجاب بالفعل — لم يُستخدم التجميد')
        } else if (reason === 'invalid_target') {
          setFreezeError('هذا اللاعب غير موجود')
        } else {
          setFreezeError('تعذّر تجميد المنافس')
        }
      }
    })

    // question:revealed — host revealed the correct answer (D-07)
    socket.on('question:revealed', ({
      correctAnswerIndex,
      playerResults,
    }: {
      correctAnswerIndex: number
      playerResults: Array<{ id: string; score: number; streak: number }>
    }) => {
      setCorrectIndex(correctAnswerIndex)
      setPlayerPhase('revealed')
      setDoublePointsActive(false)
      setFreezeOverlayOpen(false)
      // Find my score from playerResults using myToken
      const myResult = playerResults.find((p) => p.id === myToken)
      if (myResult) {
        setMyScore(myResult.score)
        setMyStreak(myResult.streak)
      }
    })

    // game:podium — game finished, show ended screen
    socket.on('game:podium', () => {
      setPhase('ended')
    })

    return () => {
      socket.off('lobby:update')
      socket.off('game:started')
      socket.off('game:ended')
      socket.off('question:start')
      socket.off('question:revealed')
      socket.off('game:podium')
      socket.off('freetext:lock')
      socket.off('freetext:results')
      socket.off('lifeline:double_points_ack')
      socket.off('lifeline:remove_two_result')
      socket.off('lifeline:freeze_ack')
    }
  }, [phase, myToken])

  // ── Join handler ───────────────────────────────────────────────────────────
  const handleJoin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim() || !emoji) return

      const socket = getSocket()
      socket.connect()

      setIsJoining(true)

      socket.once('room:joined', ({ reconnectToken, players: joined }: { reconnectToken: string; players: Player[] }) => {
        sessionStorage.setItem(RECONNECT_KEY(roomCode), reconnectToken)
        setMyToken(reconnectToken)
        setPlayers(joined)
        setIsJoining(false)
        setPhase('lobby')
      })

      socket.once('room:error', ({ message }: { message: string }) => {
        setError(message)
        setIsJoining(false)
        socket.off('room:joined')
      })

      socket.emit('room:join', { roomCode, name: name.trim(), emoji })
    },
    [roomCode, name, emoji],
  )

  // ── Answer handler ─────────────────────────────────────────────────────────
  const handleAnswer = useCallback((answerIndex: number) => {
    if (myAnswer !== null) return  // already answered — T-03-10 client guard
    setMyAnswer(answerIndex)
    setPlayerPhase('waiting')
    getSocket().emit('player:answer', { answerIndex })
  }, [myAnswer])

  // ── Free text handlers ─────────────────────────────────────────────────────
  const handleFreeTextSubmit = useCallback((text: string) => {
    if (freeTextSubmitted) return  // dedup
    setFreeTextSubmitted(true)
    setSubmittedText(text)
    setPlayerPhase('waiting')
    getSocket().emit('freetext:answer', { text })
  }, [freeTextSubmitted])

  const handleVote = useCallback((answerId: string) => {
    if (votedAnswerId !== null) return  // dedup
    setVotedAnswerId(answerId)
    getSocket().emit('freetext:vote', { answerId })
  }, [votedAnswerId])

  // ── Lifeline handlers ────────────────────────────────────────────────────
  const handleDoublePoints = useCallback(() => {
    if (doublePointsUsed || playerPhase !== 'answering') return
    getSocket().emit('lifeline:double_points')
  }, [doublePointsUsed, playerPhase])

  const handleRemoveTwo = useCallback(() => {
    if (removeTwoUsed || playerPhase !== 'answering') return
    getSocket().emit('lifeline:remove_two')
  }, [removeTwoUsed, playerPhase])

  const handleFreezeSelect = useCallback((targetPlayerId: string) => {
    getSocket().emit('lifeline:freeze_opponent', { targetPlayerId })
  }, [])

  // ── Render: form ───────────────────────────────────────────────────────────
  if (phase === 'form') {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900">
        <DisconnectBanner />

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-white">شعللها</h1>
          <p className="text-white/50 text-sm">غرفة <span dir="ltr" className="font-mono font-bold">{roomCode}</span></p>
        </div>

        <form onSubmit={handleJoin} className="w-full max-w-sm space-y-6">
          {error && (
            <ErrorBanner
              type={error === 'Room is full' ? 'full-room' : 'invalid-code'}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Name input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">اسمك</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value.slice(0, 15)); setError(null) }}
              placeholder="أدخل اسمك"
              maxLength={15}
              required
              autoFocus
              className="w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="text-xs text-white/40 text-end">{name.length}/15</p>
          </div>

          {/* Emoji picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">اختر رمزك</label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <LoadingButton
            type="submit"
            loading={isJoining}
            disabled={!name.trim()}
            className="w-full rounded-xl bg-brand-600 px-6 py-4 text-lg font-bold text-white hover:bg-brand-500 disabled:opacity-40 transition-colors"
          >
            انضم إلى الغرفة
          </LoadingButton>
        </form>
      </main>
    )
  }

  // ── Render: lobby ──────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    const myPlayer = players.find(p => p.id === myToken)
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900">
        <DisconnectBanner />

        <div className="text-center space-y-1">
          {myPlayer && (
            <div className="text-5xl mb-2">{myPlayer.emoji}</div>
          )}
          <h2 className="text-xl font-bold text-white">في انتظار بدء اللعبة</h2>
          <p className="text-white/50 text-sm">
            غرفة <span dir="ltr" className="font-mono font-bold">{roomCode}</span> · {players.length} لاعب
          </p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          {players.length === 0 ? (
            <SkeletonCard count={3} />
          ) : (
            players.map((p) => (
              <PlayerCard key={p.id} name={p.name} emoji={p.emoji} />
            ))
          )}
        </div>

        <p className="text-sm text-white/40 animate-pulse">في انتظار المضيف…</p>
      </main>
    )
  }

  // ── Render: playing ────────────────────────────────────────────────────────
  if (phase === 'playing' && currentQuestion) {
    const isFreeText = currentQuestion.type === 'FREE_TEXT'

    // FREE_TEXT question flow
    if (isFreeText) {
      // Voting phase
      if (playerPhase === 'voting') {
        return (
          <PlayerGameScreen>
            <VotingUI
              answers={votingAnswers}
              myPlayerId={myToken ?? ''}
              onVote={handleVote}
              votedAnswerId={votedAnswerId}
              votingDeadline={votingDeadline}
            />
          </PlayerGameScreen>
        )
      }

      // Waiting after submission
      if (playerPhase === 'waiting') {
        return (
          <PlayerGameScreen>
            <WaitingScreen
              selectedAnswer={submittedText}
              selectedIndex={0}
              selectedColor="bg-gray-400 text-white"
            />
          </PlayerGameScreen>
        )
      }

      // Revealed (after freetext:results)
      if (playerPhase === 'revealed') {
        return (
          <PlayerGameScreen>
            <div className="text-center py-4 space-y-1 px-4">
              <p className="text-lg font-bold text-white">انتهى التصويت</p>
              <p className="text-sm text-white/60">النقاط: {myScore}</p>
            </div>
          </PlayerGameScreen>
        )
      }

      // Answering phase — show FreeTextInput
      return (
        <PlayerGameScreen>
          <PlayerTimerBar
            duration={currentQuestion.timerDuration}
            startedAt={questionStartedAt}
            active={playerPhase === 'answering'}
          />
          <FreeTextInput
            questionText={currentQuestion.text}
            onSubmit={handleFreeTextSubmit}
            disabled={freeTextSubmitted}
          />
        </PlayerGameScreen>
      )
    }

    // MC / MEDIA_GUESSING question flow
    return (
      <PlayerGameScreen>
        <PlayerTimerBar
          duration={currentQuestion.timerDuration}
          startedAt={questionStartedAt}
          active={playerPhase === 'answering'}
        />

        {/* Phase 6: Lifelines — only for MC/MEDIA_GUESSING */}
        {currentQuestion.type !== 'FREE_TEXT' && (
          <LifelineBar
            doublePointsUsed={doublePointsUsed}
            removeTwoUsed={removeTwoUsed}
            freezeOpponentUsed={freezeOpponentUsed}
            onDoublePoints={handleDoublePoints}
            onRemoveTwo={handleRemoveTwo}
            onFreezeOpponent={() => setFreezeOverlayOpen(true)}
            disabled={playerPhase !== 'answering'}
          />
        )}
        {doublePointsActive && (
          <p className="text-xs text-brand-400 font-bold text-center animate-pulse px-4">
            النقاط مضاعفة لهذا السؤال ×2
          </p>
        )}
        {freezeError && (
          <p className="text-xs text-red-400 font-semibold text-center px-4">
            {freezeError}
          </p>
        )}

        {/* Question header */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-white/50 text-start">
            سؤال {questionIndex + 1}
          </p>
          <h2 className="text-xl font-bold text-white text-start leading-relaxed mt-1">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Media guessing: blurred image above answer options */}
        {currentQuestion.type === 'MEDIA_GUESSING' && currentQuestion.mediaUrl && (
          <div className="h-[40vh] px-4 pb-2">
            <MediaQuestion
              mediaUrl={currentQuestion.mediaUrl}
              revealed={playerPhase === 'revealed'}
              timerDuration={currentQuestion.timerDuration}
            />
          </div>
        )}

        {/* Answer options or waiting screen */}
        {playerPhase === 'waiting' && myAnswer !== null ? (
          <WaitingScreen
            selectedAnswer={currentQuestion.options[myAnswer]}
            selectedIndex={myAnswer}
            selectedColor={ANSWER_COLORS[myAnswer]}
          />
        ) : (
          <div className="flex-1 flex flex-col justify-end">
            <AnswerOptions
              options={currentQuestion.options}
              layout={hostSettings.layout}
              selectedIndex={myAnswer}
              correctIndex={playerPhase === 'revealed' ? correctIndex : null}
              revealed={playerPhase === 'revealed'}
              onSelect={handleAnswer}
              disabled={playerPhase !== 'answering'}
              eliminatedIndices={eliminatedIndices}
            />
          </div>
        )}

        {/* Score and feedback after reveal */}
        {playerPhase === 'revealed' && (
          <div className="text-center py-4 space-y-1">
            <p className="text-lg font-bold text-white">
              {myAnswer === correctIndex ? 'إجابة صحيحة!' : 'إجابة خاطئة'}
            </p>
            <p className="text-sm text-white/60">النقاط: {myScore}</p>
            {myStreak >= 3 && (
              <p className="text-xs text-yellow-500 font-semibold">سلسلة ×1.5</p>
            )}
          </div>
        )}

        {/* Freeze Opponent overlay — portal-like, fixed z-50 */}
        {freezeOverlayOpen && (
          <FreezeOpponentOverlay
            players={players.filter((p) => p.id !== myToken)}
            onSelect={handleFreezeSelect}
            onCancel={() => setFreezeOverlayOpen(false)}
          />
        )}
      </PlayerGameScreen>
    )
  }

  // ── Render: ended ──────────────────────────────────────────────────────────
  if (phase === 'ended') {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900">
        <div className="text-center space-y-4">
          <p className="text-4xl">🏁</p>
          <h2 className="text-2xl font-bold text-white">انتهت اللعبة</h2>
          <p className="text-lg text-white/60">النقاط: {myScore}</p>
          <a href="/join" className="text-brand-400 text-sm underline">العب مرة أخرى</a>
        </div>
      </main>
    )
  }

  // Fallback — playing phase with no question yet loaded (between game:started and first question:start)
  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-900 border-t-brand-500 mx-auto" />
        <p className="text-sm text-white/50">جارٍ تحميل السؤال…</p>
      </div>
    </main>
  )
}
