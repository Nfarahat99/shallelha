import type { Server, Socket } from 'socket.io'
import { getRoom, updateRoomStatus } from '../room/room.service'
import {
  calculateScore,
  createInitialPlayerStates,
  getLeaderboard,
  saveGameState,
  getGameState,
} from '../game/game.service'
import type { GameState, HostSettings } from '../game/game.types'
import { prisma } from '../db/prisma'
import { QuestionStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestionData {
  id: string
  text: string
  options: string[]
  correctIndex: number
  timerDuration: number
}

// ---------------------------------------------------------------------------
// Module-level state (lives for the Node.js process lifetime)
// ---------------------------------------------------------------------------

/** Auto-reveal timers keyed by roomCode */
const autoRevealTimers = new Map<string, NodeJS.Timeout>()

/** Question cache keyed by roomCode — populated at game:start, cleared at game:end */
const questionCache = new Map<string, QuestionData[]>()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify the socket is the host of its room.
 * Emits room:error and returns false if not.
 */
function requireHost(socket: Socket): boolean {
  if (!socket.data.isHost) {
    socket.emit('room:error', { message: 'Only the host can perform this action' })
    return false
  }
  return true
}

/** Clear the auto-reveal timer for a room if one is running. */
function clearAutoRevealTimer(roomCode: string): void {
  const timer = autoRevealTimers.get(roomCode)
  if (timer) {
    clearTimeout(timer)
    autoRevealTimers.delete(roomCode)
  }
}

/**
 * Fisher-Yates shuffle — mutates the array and returns it.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Emit question:start to the whole room and (re)start the auto-reveal timer
 * if the host configured auto-reveal mode.
 */
function sendQuestion(
  io: Server,
  roomCode: string,
  gameState: GameState,
  question: QuestionData,
): void {
  const payload = {
    question: {
      text: question.text,
      options: question.options,
      timerDuration: question.timerDuration,
    },
    questionIndex: gameState.currentQuestionIndex,
    total: gameState.questionIds.length,
    hostSettings: gameState.hostSettings,
  }

  io.to(roomCode).emit('question:start', payload)

  // Reset answeredCurrentQ for all players
  for (const id of Object.keys(gameState.playerStates)) {
    gameState.playerStates[id].answeredCurrentQ = false
  }

  // Schedule auto-reveal if host chose that mode
  if (gameState.hostSettings.revealMode === 'auto') {
    clearAutoRevealTimer(roomCode)
    const durationMs = question.timerDuration * 1000
    const timer = setTimeout(() => {
      void handleReveal(io, roomCode)
    }, durationMs)
    autoRevealTimers.set(roomCode, timer)
  }
}

/**
 * Shared reveal logic — used by both manual (question:reveal) and
 * automatic (timer-based) reveals.
 */
async function handleReveal(io: Server, roomCode: string): Promise<void> {
  clearAutoRevealTimer(roomCode)

  const gameState = await getGameState(roomCode)
  if (!gameState || gameState.phase !== 'question') return

  gameState.phase = 'reveal'
  await saveGameState(roomCode, gameState)

  const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]

  io.to(roomCode).emit('question:revealed', {
    correctAnswerIndex: questionData?.correctIndex ?? 0,
    playerResults: Object.entries(gameState.playerStates).map(([id, state]) => ({
      id,
      score: state.score,
      streak: state.streak,
    })),
  })
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function registerGameHandlers(io: Server, socket: Socket): void {
  // -------------------------------------------------------------------------
  // game:configure — Host sets pre-game settings (layout, timer style, reveal mode)
  // -------------------------------------------------------------------------
  socket.on('game:configure', async (data: Partial<HostSettings>) => {
    if (!requireHost(socket)) return

    const roomCode: string = socket.data.roomCode
    if (!roomCode) {
      socket.emit('room:error', { message: 'Not in a room' })
      return
    }

    const hostSettings: HostSettings = {
      layout: data.layout ?? '2x2',
      timerStyle: data.timerStyle ?? 'bar',
      revealMode: data.revealMode ?? 'manual',
    }

    try {
      let gameState = await getGameState(roomCode)

      if (!gameState) {
        // Create initial game state with pre-game settings
        gameState = {
          questionIds: [],
          currentQuestionIndex: -1,
          phase: 'pre-game',
          questionStartedAt: 0,
          timerDuration: 0,
          playerStates: {},
          hostSettings,
        }
      } else {
        // Only update host settings — preserve existing state
        gameState.hostSettings = hostSettings
      }

      await saveGameState(roomCode, gameState)
      socket.emit('game:configured', { hostSettings })

      console.log(`[Game] Configured ${roomCode}:`, hostSettings)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to configure game'
      socket.emit('room:error', { message })
    }
  })

  // -------------------------------------------------------------------------
  // game:start — Host starts the game; fetches questions & sends first question
  // -------------------------------------------------------------------------
  socket.on('game:start', async (data?: { categoryId?: string }) => {
    if (!requireHost(socket)) return

    const roomCode: string = socket.data.roomCode
    if (!roomCode) {
      socket.emit('room:error', { message: 'Not in a room' })
      return
    }

    try {
      const room = await getRoom(roomCode)
      if (!room) {
        socket.emit('room:error', { message: 'Room not found' })
        return
      }

      // Build Prisma where clause — filter by approved status and optional category
      const where: { status: QuestionStatus; categoryId?: string } = {
        status: QuestionStatus.approved,
      }
      if (data?.categoryId) {
        where.categoryId = data.categoryId
      }

      // Fetch approved questions from PostgreSQL
      const rawQuestions = await prisma.question.findMany({
        where,
        select: {
          id: true,
          text: true,
          options: true,
          correctIndex: true,
          timerDuration: true,
        },
      })

      if (rawQuestions.length === 0) {
        socket.emit('room:error', { message: 'No approved questions available' })
        return
      }

      // Shuffle and cap at 20 questions
      const questions: QuestionData[] = shuffle(
        rawQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options as string[],
          correctIndex: q.correctIndex,
          timerDuration: q.timerDuration,
        })),
      ).slice(0, 20)

      // Retrieve existing game state to inherit host settings if already configured
      const existingGameState = await getGameState(roomCode)

      const gameState: GameState = {
        questionIds: questions.map((q) => q.id),
        currentQuestionIndex: 0,
        phase: 'question',
        questionStartedAt: Date.now(),
        timerDuration: questions[0].timerDuration * 1000,
        playerStates: createInitialPlayerStates(room.players),
        hostSettings: existingGameState?.hostSettings ?? {
          layout: '2x2',
          timerStyle: 'bar',
          revealMode: 'manual',
        },
      }

      // Cache questions in memory to avoid DB hits per player answer
      questionCache.set(roomCode, questions)

      await saveGameState(roomCode, gameState)
      await updateRoomStatus(roomCode, 'playing')

      io.to(roomCode).emit('game:started', { roomCode })
      sendQuestion(io, roomCode, gameState, questions[0])

      // Persist the reset answeredCurrentQ flags
      await saveGameState(roomCode, gameState)

      console.log(`[Game] Started ${roomCode} — ${questions.length} questions`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game'
      socket.emit('room:error', { message })
    }
  })

  // -------------------------------------------------------------------------
  // player:answer — Player submits their answer for the current question
  // -------------------------------------------------------------------------
  socket.on('player:answer', async (data: { answerIndex: number }) => {
    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      const gameState = await getGameState(roomCode)
      if (!gameState) return

      // Reject late answers (T-03-06: silent rejection after reveal)
      if (gameState.phase !== 'question') return

      // Validate answer index range (T-03-04)
      const { answerIndex } = data ?? {}
      if (answerIndex === undefined || answerIndex < 0 || answerIndex > 3) {
        socket.emit('room:error', { message: 'Invalid answer index' })
        return
      }

      // Identify player by reconnect token (their persistent player ID)
      const playerId: string = socket.data.reconnectToken
      if (!playerId || !gameState.playerStates[playerId]) return

      // Reject duplicate answers (T-03-04)
      if (gameState.playerStates[playerId].answeredCurrentQ) return

      // Compute elapsed time server-side (T-03-05: client cannot influence score)
      const elapsedMs = Date.now() - gameState.questionStartedAt
      const timerDurationMs = gameState.timerDuration

      // Look up correct answer from in-memory cache
      const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]
      if (!questionData) return

      const isCorrect = answerIndex === questionData.correctIndex

      // Update player state
      const playerState = gameState.playerStates[playerId]
      const currentStreak = playerState.streak
      const points = calculateScore(isCorrect, elapsedMs, timerDurationMs, currentStreak)

      playerState.score += points
      playerState.answeredCurrentQ = true
      playerState.lastAnswerTime = Date.now()
      playerState.streak = isCorrect ? currentStreak + 1 : 0

      await saveGameState(roomCode, gameState)

      // Broadcast progress — includes answeredIds[] for D-03 PlayerIndicators
      const answeredIds = Object.entries(gameState.playerStates)
        .filter(([, state]) => state.answeredCurrentQ)
        .map(([id]) => id)
      const answeredCount = answeredIds.length
      const totalPlayers = Object.keys(gameState.playerStates).length

      io.to(roomCode).emit('question:progress', { answeredCount, totalPlayers, answeredIds })
    } catch (err) {
      console.error('[Game] player:answer error:', err)
    }
  })

  // -------------------------------------------------------------------------
  // question:reveal — Host manually reveals the correct answer
  // -------------------------------------------------------------------------
  socket.on('question:reveal', async () => {
    if (!requireHost(socket)) return

    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      await handleReveal(io, roomCode)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reveal answer'
      socket.emit('room:error', { message })
    }
  })

  // -------------------------------------------------------------------------
  // leaderboard:show — Host triggers leaderboard display
  // -------------------------------------------------------------------------
  socket.on('leaderboard:show', async () => {
    if (!requireHost(socket)) return

    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      const [gameState, room] = await Promise.all([getGameState(roomCode), getRoom(roomCode)])

      if (!gameState || !room) {
        socket.emit('room:error', { message: 'Game or room not found' })
        return
      }

      const leaderboard = getLeaderboard(gameState.playerStates, room.players)

      gameState.phase = 'leaderboard'
      await saveGameState(roomCode, gameState)

      io.to(roomCode).emit('leaderboard:update', { players: leaderboard })

      console.log(`[Game] Leaderboard shown for ${roomCode}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to show leaderboard'
      socket.emit('room:error', { message })
    }
  })

  // -------------------------------------------------------------------------
  // question:next — Host advances to the next question (or ends game)
  // -------------------------------------------------------------------------
  socket.on('question:next', async () => {
    if (!requireHost(socket)) return

    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      const [gameState, room] = await Promise.all([getGameState(roomCode), getRoom(roomCode)])

      if (!gameState || !room) {
        socket.emit('room:error', { message: 'Game or room not found' })
        return
      }

      const nextIndex = gameState.currentQuestionIndex + 1

      // Check if we've exhausted all questions
      if (nextIndex >= gameState.questionIds.length) {
        // End of game — compute final podium
        const leaderboard = getLeaderboard(gameState.playerStates, room.players)
        const top3 = leaderboard.slice(0, 3)

        gameState.phase = 'ended'
        await saveGameState(roomCode, gameState)
        await updateRoomStatus(roomCode, 'ended')

        clearAutoRevealTimer(roomCode)
        questionCache.delete(roomCode)

        io.to(roomCode).emit('game:podium', { top3 })
        console.log(`[Game] Game ended (all questions answered) in ${roomCode}`)
        return
      }

      // Advance to next question
      const questions = questionCache.get(roomCode)
      if (!questions) {
        socket.emit('room:error', { message: 'Question data not found' })
        return
      }

      const nextQuestion = questions[nextIndex]

      gameState.currentQuestionIndex = nextIndex
      gameState.phase = 'question'
      gameState.questionStartedAt = Date.now()
      gameState.timerDuration = nextQuestion.timerDuration * 1000

      // Reset answeredCurrentQ flags for all players
      for (const id of Object.keys(gameState.playerStates)) {
        gameState.playerStates[id].answeredCurrentQ = false
      }

      await saveGameState(roomCode, gameState)

      sendQuestion(io, roomCode, gameState, nextQuestion)

      // Persist updated state after sendQuestion resets answeredCurrentQ
      await saveGameState(roomCode, gameState)

      console.log(`[Game] Advanced to question ${nextIndex + 1} in ${roomCode}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to advance to next question'
      socket.emit('room:error', { message })
    }
  })

  // -------------------------------------------------------------------------
  // game:end — Host ends the game early
  // -------------------------------------------------------------------------
  socket.on('game:end', async () => {
    if (!requireHost(socket)) return

    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      const [gameState, room] = await Promise.all([getGameState(roomCode), getRoom(roomCode)])

      if (!gameState || !room) {
        socket.emit('room:error', { message: 'Game or room not found' })
        return
      }

      const leaderboard = getLeaderboard(gameState.playerStates, room.players)
      const top3 = leaderboard.slice(0, 3)

      gameState.phase = 'ended'
      await saveGameState(roomCode, gameState)
      await updateRoomStatus(roomCode, 'ended')

      clearAutoRevealTimer(roomCode)
      questionCache.delete(roomCode)

      io.to(roomCode).emit('game:podium', { top3 })
      console.log(`[Game] Game ended early in ${roomCode}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end game'
      socket.emit('room:error', { message })
    }
  })
}
