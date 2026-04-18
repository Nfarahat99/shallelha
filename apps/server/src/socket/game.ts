import type { Server, Socket } from 'socket.io'
import { getRoom, updateRoomStatus } from '../room/room.service'
import {
  calculateScore,
  createInitialPlayerStates,
  getLeaderboard,
  saveGameState,
  getGameState,
  deleteGameState,
  calculateFreeTextScore,
} from '../game/game.service'
import type { GameState, HostSettings, LeaderboardEntry } from '../game/game.types'
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
  type: 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'
  mediaUrl?: string
}

// ---------------------------------------------------------------------------
// Module-level state (lives for the Node.js process lifetime)
// ---------------------------------------------------------------------------

/** Auto-reveal timers keyed by roomCode */
const autoRevealTimers = new Map<string, NodeJS.Timeout>()

/** Voting timers keyed by roomCode — cleared on question:next and game:end */
const votingTimers = new Map<string, NodeJS.Timeout>()

/** Question cache keyed by roomCode — populated at game:start, cleared at game:end */
const questionCache = new Map<string, QuestionData[]>()

/**
 * Previous rankings keyed by roomCode → Map<playerId, rank>.
 * Used to compute rankDelta in leaderboard broadcasts.
 * Reset on game:start, updated after each leaderboard:show.
 */
const previousRankings = new Map<string, Map<string, number>>()

/**
 * In-flight lock for freetext:answer — prevents TOCTOU duplicate submissions
 * from rapid-fire emits before the first async write completes (T-05-15).
 * Key format: `${roomCode}:${playerId}`
 */
const freeTextLocks = new Set<string>()

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
export function clearAutoRevealTimer(roomCode: string): void {
  const timer = autoRevealTimers.get(roomCode)
  if (timer) {
    clearTimeout(timer)
    autoRevealTimers.delete(roomCode)
  }
}

/** Clear the voting timer for a room if one is running. */
export function clearVotingTimer(roomCode: string): void {
  const timer = votingTimers.get(roomCode)
  if (timer) {
    clearTimeout(timer)
    votingTimers.delete(roomCode)
  }
}

/**
 * Escape HTML special characters to prevent XSS when storing/broadcasting
 * free text answers (T-05-08). Defence-in-depth: React JSX escapes by default
 * but raw text is also persisted in Redis and re-emitted to all consumers.
 */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
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
      type: question.type,
      mediaUrl: question.mediaUrl,
    },
    questionIndex: gameState.currentQuestionIndex,
    total: gameState.questionIds.length,
    hostSettings: gameState.hostSettings,
  }

  io.to(roomCode).emit('question:start', payload)

  // Reset per-question flags
  gameState.revealedCurrentQ = false
  gameState.freeTextAnswers = {}
  gameState.votingDeadline = undefined
  for (const id of Object.keys(gameState.playerStates)) {
    gameState.playerStates[id].answeredCurrentQ = false
    gameState.playerStates[id].votedCurrentQ = false
  }

  // Clear any existing voting timer
  clearVotingTimer(roomCode)

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
 * Start the voting phase for a FREE_TEXT question.
 * Called when the auto-reveal timer fires or host clicks lock.
 */
async function startVotingPhase(io: Server, roomCode: string): Promise<void> {
  const gameState = await getGameState(roomCode)
  if (!gameState || gameState.phase !== 'question') return

  gameState.phase = 'voting'
  gameState.votingDeadline = Date.now() + 15_000
  await saveGameState(roomCode, gameState)

  // Shuffle answers before broadcast (T-05-13: eliminate order bias)
  const room = await getRoom(roomCode)
  const answers = Object.entries(gameState.freeTextAnswers ?? {}).map(([playerId, a]) => {
    const player = room?.players.find((p) => p.id === playerId)
    return { id: playerId, emoji: player?.emoji ?? '?', text: a.text }
  })
  shuffle(answers)

  io.to(roomCode).emit('freetext:lock', { answers, votingDeadline: gameState.votingDeadline })

  // Auto-close voting after 15s
  clearVotingTimer(roomCode)
  const timer = setTimeout(() => {
    void resolveVoting(io, roomCode)
  }, 15_000)
  votingTimers.set(roomCode, timer)
}

/**
 * Resolve voting after timer expires — calculate scores, broadcast results.
 */
async function resolveVoting(io: Server, roomCode: string): Promise<void> {
  clearVotingTimer(roomCode)

  const gameState = await getGameState(roomCode)
  if (!gameState || gameState.phase !== 'voting') return

  const freeTextAnswers = gameState.freeTextAnswers ?? {}
  const result = calculateFreeTextScore(freeTextAnswers)

  // Apply author scores (D-09: no streak impact for FREE_TEXT)
  for (const [playerId, pts] of Object.entries(result.authorScores)) {
    if (gameState.playerStates[playerId]) {
      gameState.playerStates[playerId].score += pts
    }
  }
  // Apply voter scores
  for (const [playerId, pts] of Object.entries(result.voterScores)) {
    if (gameState.playerStates[playerId]) {
      gameState.playerStates[playerId].score += pts
    }
  }

  // Move to reveal phase so host can show leaderboard / next question
  gameState.phase = 'reveal'
  gameState.revealedCurrentQ = true
  await saveGameState(roomCode, gameState)

  // Broadcast results
  const votes: Record<string, string[]> = {}
  for (const [pid, a] of Object.entries(freeTextAnswers)) {
    votes[pid] = a.votes
  }

  io.to(roomCode).emit('freetext:results', {
    winnerId: result.winnerIds[0] ?? '',
    winnerText: result.winnerText,
    votes,
    authorBonus: result.winnerIds,
  })
}

/**
 * Shared reveal logic — used by both manual (question:reveal) and
 * automatic (timer-based) reveals.
 */
async function handleReveal(io: Server, roomCode: string): Promise<void> {
  clearAutoRevealTimer(roomCode)

  const gameState = await getGameState(roomCode)
  // Guard: skip if not in question phase or if this question was already revealed
  // (catches the TOCTOU race between auto-reveal timer and manual question:reveal)
  if (!gameState || gameState.phase !== 'question' || gameState.revealedCurrentQ) return

  // For FREE_TEXT questions, "reveal" means "start voting phase" (not show correctIndex)
  const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]
  if (questionData?.type === 'FREE_TEXT') {
    await startVotingPhase(io, roomCode)
    return
  }

  // Guard: cache miss means we cannot determine the correct answer — abort reveal
  // rather than silently broadcasting correctIndex:0 which would award points incorrectly.
  if (!questionData) {
    console.warn(`[WARN] Game: handleReveal: question cache miss for room ${roomCode} index ${gameState.currentQuestionIndex}`)
    return
  }

  // Flip both the phase and the idempotency flag atomically before broadcasting
  gameState.phase = 'reveal'
  gameState.revealedCurrentQ = true
  await saveGameState(roomCode, gameState)

  io.to(roomCode).emit('question:revealed', {
    correctAnswerIndex: questionData.correctIndex,
    playerResults: Object.entries(gameState.playerStates).map(([id, state]) => ({
      id,
      score: state.score,
      streak: state.streak,
    })),
  })

  // --- Analytics: fire-and-forget (ADMIN-04) ---
  // MUST NOT block the reveal — void + .catch() ensures no impact on game loop
  if (questionData.id) {
    // Increment timesPlayed atomically
    void prisma.question.update({
      where: { id: questionData.id },
      data: { timesPlayed: { increment: 1 } },
    }).catch((err) => {
      console.warn('[WARN] Analytics: timesPlayed increment failed:', err)
    })

    // Count wrong answers: players who answered but streak reset to 0 (wrong answer)
    const wrongCount = Object.values(gameState.playerStates)
      .filter((s) => s.answeredCurrentQ && s.streak === 0)
      .length
    if (wrongCount > 0) {
      void prisma.question.update({
        where: { id: questionData.id },
        data: { timesAnsweredWrong: { increment: wrongCount } },
      }).catch((err) => {
        console.warn('[WARN] Analytics: timesAnsweredWrong increment failed:', err)
      })
    }
  }
}

// ---------------------------------------------------------------------------
// saveGameHistory — fire-and-forget game history persistence
// ---------------------------------------------------------------------------

/**
 * Persists a completed game session and per-player results to PostgreSQL.
 * Called fire-and-forget after game:podium emission — MUST NOT block the game loop.
 * Only saves PlayerGameResult rows for players whose ID matches a real User record
 * (FK constraint: PlayerGameResult.userId → User.id).
 */
async function saveGameHistory(
  roomCode: string,
  hostId: string,
  leaderboard: LeaderboardEntry[],
  categoryId?: string,
  categoryName?: string,
): Promise<void> {
  try {
    const winnerId = leaderboard.find((e) => e.rank === 1)?.id ?? null

    const session = await prisma.gameSession.create({
      data: {
        roomCode,
        hostId,
        categoryId: categoryId ?? null,
        categoryName: categoryName ?? null,
        playerCount: leaderboard.length,
        winnerId,
      },
    })

    if (leaderboard.length === 0) return

    // Only save results for players who are real User rows (FK guard)
    const playerIds = leaderboard.map((e) => e.id)
    const realUsers = await prisma.user.findMany({
      where: { id: { in: playerIds } },
      select: { id: true },
    })
    const realUserIds = new Set(realUsers.map((u) => u.id))

    const rows = leaderboard
      .filter((e) => realUserIds.has(e.id))
      .map((e) => ({
        gameSessionId: session.id,
        userId: e.id,
        playerName: e.name,
        playerEmoji: e.emoji,
        score: e.score,
        rank: e.rank,
        isWinner: e.rank === 1,
      }))

    if (rows.length > 0) {
      await prisma.playerGameResult.createMany({ data: rows })
    }

    console.log(`[INFO] History: saved session ${session.id} for room ${roomCode} (${rows.length} user results)`)
  } catch (err) {
    console.warn('[WARN] History: saveGameHistory failed:', err)
  }
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

      console.log(`[INFO] Game: configured ${roomCode}:`, hostSettings)
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

      let questions: QuestionData[]

      if (room.packId) {
        // --- Community pack branch ---
        // T-10-08-01: Verify pack is still APPROVED (tamper guard — Redis could be stale)
        const pack = await prisma.pack.findUnique({ where: { id: room.packId } })
        if (!pack || pack.status !== 'APPROVED') {
          socket.emit('game:error', { message: 'الباقة المحددة غير متاحة' })
          return
        }

        // T-10-08-02: Limit question count to prevent large-pack DoS
        const questionLimit = 20
        const packQuestions = await prisma.packQuestion.findMany({
          where: { packId: room.packId },
          orderBy: { order: 'asc' },
          take: questionLimit,
        })

        if (packQuestions.length === 0) {
          socket.emit('game:error', { message: 'الباقة المحددة لا تحتوي على أسئلة' })
          return
        }

        questions = packQuestions.map((pq) => ({
          id: pq.id,
          text: pq.text,
          options: pq.options as string[],
          correctIndex: pq.correctIndex ?? 0,
          timerDuration: 20, // Default timer for pack questions
          type: pq.type as QuestionData['type'],
          mediaUrl: undefined,
        }))
      } else {
        // --- Existing behavior: load from Question table by categoryId ---
        const where: { status: QuestionStatus; categoryId?: string } = {
          status: QuestionStatus.approved,
        }
        if (data?.categoryId) {
          where.categoryId = data.categoryId
        }

        const rawQuestions = await prisma.question.findMany({
          where,
          select: {
            id: true,
            text: true,
            options: true,
            correctIndex: true,
            timerDuration: true,
            type: true,
            mediaUrl: true,
          },
        })

        if (rawQuestions.length === 0) {
          socket.emit('room:error', { message: 'No approved questions available' })
          return
        }

        // Shuffle and cap at 20 questions
        questions = shuffle(
          rawQuestions.map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options as string[],
            correctIndex: q.correctIndex,
            timerDuration: q.timerDuration,
            type: q.type as QuestionData['type'],
            mediaUrl: q.mediaUrl ?? undefined,
          })),
        ).slice(0, 20)
      }

      // Retrieve existing game state to inherit host settings if already configured
      const existingGameState = await getGameState(roomCode)

      // Resolve category name for history
      let resolvedCategoryId: string | undefined
      let resolvedCategoryName: string | undefined
      if (data?.categoryId) {
        resolvedCategoryId = data.categoryId
        try {
          const cat = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { name: true } })
          resolvedCategoryName = cat?.name ?? undefined
        } catch {
          // non-critical — history will just have no category name
        }
      }

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
        ...(room.packId ? { packId: room.packId } : {}),
        ...(resolvedCategoryId ? { categoryId: resolvedCategoryId, categoryName: resolvedCategoryName } : {}),
      }

      // Cache questions in memory to avoid DB hits per player answer
      questionCache.set(roomCode, questions)

      // Reset previous rankings for new game
      previousRankings.set(roomCode, new Map())

      await saveGameState(roomCode, gameState)
      await updateRoomStatus(roomCode, 'playing')

      io.to(roomCode).emit('game:started', { roomCode })
      sendQuestion(io, roomCode, gameState, questions[0])

      // Persist the reset answeredCurrentQ flags
      await saveGameState(roomCode, gameState)

      console.log(`[INFO] Game: started ${roomCode} — ${questions.length} questions${room.packId ? ` (pack: ${room.packId})` : ''}`)
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

      // Reject answers from frozen players (T-06-04: Freeze Opponent lifeline)
      if (gameState.playerStates[playerId].frozenCurrentQ) return

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
      const answerCount = answeredIds.length
      // playerCount = all active (non-disconnected) players — same as playerStates size
      const playerCount = Object.keys(gameState.playerStates).length

      io.to(roomCode).emit('question:progress', { answerCount, playerCount, answeredIds })
    } catch (err) {
      console.error('[ERROR] Game: player:answer error:', err)
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

      const roomPrevRankings = previousRankings.get(roomCode)
      const leaderboard = getLeaderboard(gameState.playerStates, room.players, roomPrevRankings)

      // Update previousRankings with current ranks for next question's delta
      const newRankings = new Map<string, number>()
      for (const entry of leaderboard) {
        newRankings.set(entry.id, entry.rank)
      }
      previousRankings.set(roomCode, newRankings)

      gameState.phase = 'leaderboard'
      await saveGameState(roomCode, gameState)

      io.to(roomCode).emit('leaderboard:update', { players: leaderboard })

      console.log(`[INFO] Game: leaderboard shown for ${roomCode}`)
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
        clearVotingTimer(roomCode)
        questionCache.delete(roomCode)
        previousRankings.delete(roomCode)

        // Increment pack play count fire-and-forget (T-10-08: playCount tracking)
        if (gameState.packId) {
          prisma.pack.update({
            where: { id: gameState.packId },
            data: { playCount: { increment: 1 } },
          }).catch((err) => console.warn('[pack] playCount increment failed:', err))
        }

        io.to(roomCode).emit('game:podium', { top3, leaderboard })

        // Fire-and-forget game history save
        void saveGameHistory(
          roomCode,
          room.hostId,
          leaderboard,
          gameState.categoryId,
          gameState.categoryName,
        )

        console.log(`[INFO] Game: game ended (all questions answered) in ${roomCode}`)
        return
      }

      // Clear any voting timer before advancing (T-05-14: no orphaned timers)
      clearVotingTimer(roomCode)

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

      console.log(`[INFO] Game: advanced to question ${nextIndex + 1} in ${roomCode}`)
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
      clearVotingTimer(roomCode)      // internally calls votingTimers.delete(roomCode)
      questionCache.delete(roomCode)
      previousRankings.delete(roomCode)

      // Increment pack play count fire-and-forget (T-10-08: playCount tracking)
      if (gameState.packId) {
        prisma.pack.update({
          where: { id: gameState.packId },
          data: { playCount: { increment: 1 } },
        }).catch((err) => console.warn('[pack] playCount increment failed:', err))
      }

      io.to(roomCode).emit('game:podium', { top3, leaderboard })

      // Fire-and-forget game history save
      void saveGameHistory(
        roomCode,
        room.hostId,
        leaderboard,
        gameState.categoryId,
        gameState.categoryName,
      )

      console.log(`[INFO] Game: game ended early in ${roomCode}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end game'
      socket.emit('room:error', { message })
    }
  })

  // -------------------------------------------------------------------------
  // freetext:answer — Player submits a free text answer
  // -------------------------------------------------------------------------
  socket.on('freetext:answer', async (data: { text: string }) => {
    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    // Per-socket in-memory lock: prevents TOCTOU duplicate submissions from
    // rapid-fire emits before the first async write completes (T-05-15).
    const playerId: string = socket.data.reconnectToken
    if (!playerId) return
    const lockKey = `${roomCode}:${playerId}`
    if (freeTextLocks.has(lockKey)) return
    freeTextLocks.add(lockKey)

    try {
      const gameState = await getGameState(roomCode)
      if (!gameState || gameState.phase !== 'question') return

      // Validate question type (T-05-11: reject if not FREE_TEXT)
      const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]
      if (!questionData || questionData.type !== 'FREE_TEXT') return

      // Validate text — server-side enforcement (T-05-08: XSS prevention)
      const { text } = data ?? {}
      if (!text || typeof text !== 'string') return
      const trimmed = escapeHtml(text.trim().slice(0, 80))  // D-07: max 80 chars; escapeHtml: T-05-08
      if (trimmed.length === 0) return

      if (!gameState.playerStates[playerId]) return

      // One answer per player per question (deduplication)
      if (gameState.freeTextAnswers?.[playerId]) return

      gameState.freeTextAnswers = gameState.freeTextAnswers ?? {}
      gameState.freeTextAnswers[playerId] = { text: trimmed, votes: [] }
      await saveGameState(roomCode, gameState)

      // Broadcast updated answer list to room (host sees live feed — D-07)
      const room = await getRoom(roomCode)
      const answers = Object.entries(gameState.freeTextAnswers).map(([pid, a]) => {
        const player = room?.players.find((p) => p.id === pid)
        return { playerId: pid, emoji: player?.emoji ?? '?', text: a.text }
      })
      io.to(roomCode).emit('freetext:answers', { answers })
    } catch (err) {
      console.error('[ERROR] Game: freetext:answer error:', err)
    } finally {
      freeTextLocks.delete(lockKey)
    }
  })

  // -------------------------------------------------------------------------
  // freetext:vote — Player votes for another player's answer
  // -------------------------------------------------------------------------
  socket.on('freetext:vote', async (data: { answerId: string }) => {
    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      const gameState = await getGameState(roomCode)
      if (!gameState || gameState.phase !== 'voting') return  // T-05-12: reject after results

      const playerId: string = socket.data.reconnectToken
      if (!playerId || !gameState.playerStates[playerId]) return

      // Deduplicate votes (T-05-09: one vote per player per question)
      if (gameState.playerStates[playerId].votedCurrentQ) return

      const { answerId } = data ?? {}
      if (!answerId || typeof answerId !== 'string') return

      // Cannot vote for own answer (T-05-10: D-08)
      if (answerId === playerId) return

      // answerId must be a valid player who submitted an answer
      if (!gameState.freeTextAnswers?.[answerId]) return

      gameState.playerStates[playerId].votedCurrentQ = true
      gameState.freeTextAnswers[answerId].votes.push(playerId)
      await saveGameState(roomCode, gameState)
    } catch (err) {
      console.error('[ERROR] Game: freetext:vote error:', err)
    }
  })

  // -------------------------------------------------------------------------
  // lifeline:double_points — Player activates Double Points lifeline (LIFE-01)
  // -------------------------------------------------------------------------
  socket.on('lifeline:double_points', async () => {
    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      const gameState = await getGameState(roomCode)
      if (!gameState || gameState.phase !== 'question') return  // T-06-04: phase guard

      const playerId: string = socket.data.reconnectToken
      if (!playerId || !gameState.playerStates[playerId]) return

      const playerState = gameState.playerStates[playerId]
      if (playerState.doublePointsUsed) return  // T-06-01: replay guard

      // Defense-in-depth: reject on FREE_TEXT (UI already hides button)
      const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]
      if (!questionData || questionData.type === 'FREE_TEXT') return

      playerState.doublePointsUsed = true
      playerState.doublePointsActiveCurrentQ = true
      await saveGameState(roomCode, gameState)

      socket.emit('lifeline:double_points_ack', {})
      console.log(`[INFO] Game: double points activated by ${playerId} in ${roomCode}`)
    } catch (err) {
      console.error('[ERROR] Game: lifeline:double_points error:', err)
    }
  })

  // -------------------------------------------------------------------------
  // lifeline:remove_two — Player activates Remove Two lifeline (LIFE-02)
  // -------------------------------------------------------------------------
  socket.on('lifeline:remove_two', async () => {
    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      const gameState = await getGameState(roomCode)
      if (!gameState || gameState.phase !== 'question') return  // T-06-04: phase guard

      const playerId: string = socket.data.reconnectToken
      if (!playerId || !gameState.playerStates[playerId]) return

      const playerState = gameState.playerStates[playerId]
      if (playerState.removeTwoUsed) return  // T-06-01: replay guard

      // T-06-02: reject on FREE_TEXT question type
      const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]
      if (!questionData || questionData.type === 'FREE_TEXT') return

      // Select 2 wrong indices — NEVER include correctIndex
      const wrongIndices = [0, 1, 2, 3].filter(i => i !== questionData.correctIndex)
      shuffle(wrongIndices)
      const eliminatedIndices = wrongIndices.slice(0, 2)

      playerState.removeTwoUsed = true
      await saveGameState(roomCode, gameState)

      // Private to requesting player only (not room broadcast)
      socket.emit('lifeline:remove_two_result', { eliminatedIndices })
      console.log(`[INFO] Game: remove two activated by ${playerId} in ${roomCode}: eliminated ${eliminatedIndices}`)
    } catch (err) {
      console.error('[ERROR] Game: lifeline:remove_two error:', err)
    }
  })

  // -------------------------------------------------------------------------
  // game:reset — Host resets the room back to lobby after a game ends
  // -------------------------------------------------------------------------
  socket.on('game:reset', async () => {
    if (!requireHost(socket)) return

    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      // Clear in-memory state for this room
      clearAutoRevealTimer(roomCode)
      clearVotingTimer(roomCode)
      questionCache.delete(roomCode)
      previousRankings.delete(roomCode)

      // Clear Redis game state
      await deleteGameState(roomCode)

      // Reset room status back to lobby
      await updateRoomStatus(roomCode, 'lobby')

      // Notify all clients to return to lobby
      io.to(roomCode).emit('room:reset')

      console.log(`[INFO] Game: room ${roomCode} reset to lobby`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset room'
      socket.emit('room:error', { message })
    }
  })

  // -------------------------------------------------------------------------
  // lifeline:freeze_opponent — Player freezes another player (LIFE-03)
  // -------------------------------------------------------------------------
  socket.on('lifeline:freeze_opponent', async (data: { targetPlayerId: string }) => {
    const roomCode: string = socket.data.roomCode
    if (!roomCode) return

    try {
      const gameState = await getGameState(roomCode)
      if (!gameState || gameState.phase !== 'question') return  // T-06-04: phase guard

      const playerId: string = socket.data.reconnectToken
      if (!playerId || !gameState.playerStates[playerId]) return

      const activatorState = gameState.playerStates[playerId]
      if (activatorState.freezeOpponentUsed) {
        socket.emit('lifeline:freeze_ack', { success: false, reason: 'already_used' })
        return  // T-06-01: replay guard
      }

      // T-06-03: Input validation — targetPlayerId must be string
      const { targetPlayerId } = data ?? {}
      if (!targetPlayerId || typeof targetPlayerId !== 'string') return

      // T-06-03: Cannot freeze self
      if (targetPlayerId === playerId) return

      const targetState = gameState.playerStates[targetPlayerId]
      if (!targetState) {
        socket.emit('lifeline:freeze_ack', { success: false, reason: 'invalid_target' })
        return  // T-06-03: target must exist in game
      }

      // Fair game design: if target already answered, freeze has no effect — return lifeline unused
      if (targetState.answeredCurrentQ) {
        socket.emit('lifeline:freeze_ack', { success: false, reason: 'already_answered' })
        return  // Do NOT set freezeOpponentUsed — lifeline returned to player
      }

      // Apply freeze
      activatorState.freezeOpponentUsed = true
      targetState.frozenCurrentQ = true
      await saveGameState(roomCode, gameState)

      socket.emit('lifeline:freeze_ack', { success: true })

      // Rule 2: notify frozen player so their client can show the freeze overlay.
      // Find the target player's current socket ID and emit directly to them.
      const room = await getRoom(roomCode)
      const targetPlayer = room?.players.find(p => p.id === targetPlayerId)
      if (targetPlayer?.socketId) {
        io.to(targetPlayer.socketId).emit('player:frozen')
      }

      console.log(`[INFO] Game: freeze opponent: ${playerId} froze ${targetPlayerId} in ${roomCode}`)
    } catch (err) {
      console.error('[ERROR] Game: lifeline:freeze_opponent error:', err)
    }
  })
}
