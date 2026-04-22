import type { Server, Socket } from 'socket.io'
import {
  getGameState,
  saveGameState,
  calculateScore,
} from '../game/game.service'
import type { DrawingStroke } from '../game/game.types'
import { getRoom } from '../room/room.service'
import { prisma } from '../db/prisma'

// Drawing-round timers keyed by roomCode
const drawingTimers = new Map<string, NodeJS.Timeout>()

export function clearDrawingTimer(roomCode: string): void {
  const t = drawingTimers.get(roomCode)
  if (t) {
    clearTimeout(t)
    drawingTimers.delete(roomCode)
  }
}

export function setDrawingTimer(roomCode: string, timer: NodeJS.Timeout): void {
  clearDrawingTimer(roomCode)
  drawingTimers.set(roomCode, timer)
}

/** Validate stroke data from client — sanitize numeric ranges, type enum */
function validateStroke(raw: unknown): DrawingStroke | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!['start', 'move', 'end'].includes(s.type as string)) return null
  const x = Number(s.x)
  const y = Number(s.y)
  if (isNaN(x) || isNaN(y) || x < 0 || x > 1 || y < 0 || y > 1) return null
  const size = Math.min(Math.max(Number(s.size) || 6, 1), 50)
  const color =
    typeof s.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.color)
      ? s.color
      : '#000000'
  return { x, y, color, size, type: s.type as DrawingStroke['type'] }
}

export function registerDrawingHandlers(io: Server, socket: Socket): void {
  /**
   * draw:stroke — emitted by artist only; relayed to all other players.
   * Coordinates are normalized [0,1] relative to canvas dimensions.
   * Strokes buffered in gameState.drawingStrokes for late-joining replay.
   */
  socket.on('draw:stroke', async (data: unknown) => {
    const roomCode = socket.data.roomCode as string
    if (!roomCode) return

    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'question') return

    // Only the designated artist may emit strokes
    if (gameState.artistPlayerId !== socket.data.playerId) return

    const stroke = validateStroke(data)
    if (!stroke) return

    // Buffer stroke for replay
    if (!gameState.drawingStrokes) gameState.drawingStrokes = []
    gameState.drawingStrokes.push(stroke)
    await saveGameState(roomCode, gameState)

    // Relay to all players EXCEPT the artist
    socket.to(roomCode).emit('draw:stroke', stroke)
  })

  /**
   * draw:guess — emitted by any non-artist player during DRAWING question.
   * Text must match prompt exactly (case-insensitive, Arabic diacritics stripped).
   * Speed-based scoring: 1000→500 points depending on elapsed time.
   */
  socket.on('draw:guess', async (data: { text: string }) => {
    const roomCode = socket.data.roomCode as string
    const playerId = socket.data.playerId as string
    if (!roomCode || !playerId) return

    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'question') return

    // Artist cannot guess their own drawing
    if (gameState.artistPlayerId === playerId) return

    // Prevent double-scoring
    if (gameState.drawingGuessers?.[playerId]) return

    const playerState = gameState.playerStates[playerId]
    if (!playerState || playerState.answeredCurrentQ) return
    if (playerState.frozenCurrentQ) return

    const raw = typeof data?.text === 'string' ? data.text.trim() : ''
    if (!raw || raw.length > 100) return

    // Normalize Arabic text: strip diacritics and lowercase
    const normalizeArabic = (s: string) =>
      s.replace(/[\u064B-\u065F\u0670]/g, '').trim().toLowerCase()

    // For DRAWING questions, questionId IS the DrawingPrompt id
    const qIdx = gameState.currentQuestionIndex
    const qId = gameState.questionIds[qIdx]
    const prompt = await prisma.drawingPrompt.findUnique({
      where: { id: qId },
    })
    if (!prompt) return

    const isCorrect = normalizeArabic(raw) === normalizeArabic(prompt.text)
    if (!isCorrect) {
      // Wrong guess — notify only the guesser
      socket.emit('draw:guess:result', { correct: false })
      return
    }

    // Correct guess!
    const elapsed = Date.now() - gameState.questionStartedAt
    const points = calculateScore(
      true,
      elapsed,
      gameState.timerDuration * 1000,
      playerState.streak,
    )

    playerState.answeredCurrentQ = true
    playerState.score += points
    playerState.streak += 1
    if (!gameState.drawingGuessers) gameState.drawingGuessers = {}
    gameState.drawingGuessers[playerId] = true

    // Artist also earns 200 points per correct guesser
    if (
      gameState.artistPlayerId &&
      gameState.playerStates[gameState.artistPlayerId]
    ) {
      gameState.playerStates[gameState.artistPlayerId].score += 200
    }

    await saveGameState(roomCode, gameState)

    // Notify guesser of success
    socket.emit('draw:guess:result', { correct: true, points })

    // Broadcast to room that someone guessed correctly
    const room = await getRoom(roomCode)
    const guesserPlayer = room?.players.find((p) => p.id === playerId)
    io.to(roomCode).emit('draw:correct_guess', {
      playerName: guesserPlayer?.name ?? '???',
      playerEmoji: guesserPlayer?.emoji ?? '?',
    })
  })

  /**
   * draw:clear — artist clears the canvas; relay to all players.
   */
  socket.on('draw:clear', async () => {
    const roomCode = socket.data.roomCode as string
    if (!roomCode) return
    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'question') return
    if (gameState.artistPlayerId !== socket.data.playerId) return

    gameState.drawingStrokes = []
    await saveGameState(roomCode, gameState)
    socket.to(roomCode).emit('draw:clear')
  })

  /**
   * draw:reveal — host-triggered reveal of the drawing prompt word.
   * Transitions phase to 'reveal', broadcasts prompt text.
   */
  socket.on('draw:reveal', async () => {
    const roomCode = socket.data.roomCode as string
    if (!roomCode) return
    if (!socket.data.isHost) {
      socket.emit('room:error', { message: 'Only the host can reveal the answer' })
      return
    }

    clearDrawingTimer(roomCode)
    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.revealedCurrentQ) return

    const qIdx = gameState.currentQuestionIndex
    const qId = gameState.questionIds[qIdx]
    const prompt = await prisma.drawingPrompt.findUnique({
      where: { id: qId },
    })

    gameState.phase = 'reveal'
    gameState.revealedCurrentQ = true
    await saveGameState(roomCode, gameState)

    io.to(roomCode).emit('draw:revealed', {
      promptText: prompt?.text ?? '',
      artistId: gameState.artistPlayerId ?? '',
    })
  })
}
