import type { Server, Socket } from 'socket.io'
import {
  getGameState,
  saveGameState,
} from '../game/game.service'
import { getRoom } from '../room/room.service'
import { prisma } from '../db/prisma'

const bluffingVotingTimers = new Map<string, NodeJS.Timeout>()

export function clearBluffingTimers(roomCode: string): void {
  const t = bluffingVotingTimers.get(roomCode)
  if (t) { clearTimeout(t); bluffingVotingTimers.delete(roomCode) }
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Called when a BLUFFING question starts (triggered from game.ts question:start path).
 * Assigns one random player as realAnswerHolder and emits targeted notifications.
 */
export async function startBluffingRound(
  io: Server,
  roomCode: string,
): Promise<void> {
  const gameState = await getGameState(roomCode)
  if (!gameState) return

  const room = await getRoom(roomCode)
  if (!room || room.players.length === 0) return

  // Pick a random player as the real answer holder
  const activePlayers = room.players.filter(
    (p) => !gameState.playerStates[p.id]?.frozenCurrentQ,
  )
  const holder = activePlayers[Math.floor(Math.random() * activePlayers.length)]

  gameState.bluffingRealAnswerHolderId = holder.id
  gameState.bluffingSubmissions = {}
  gameState.phase = 'bluffing:submit'
  await saveGameState(roomCode, gameState)

  // Fetch the real answer from the BLUFFING question
  const qIdx = gameState.currentQuestionIndex
  const qId = gameState.questionIds[qIdx]
  const question = await prisma.question.findUnique({ where: { id: qId } })
  const realAnswer = question?.options[question.correctIndex ?? 0] ?? ''

  // Targeted: real answer holder gets the real answer
  const holderSocket = [...(await io.in(roomCode).fetchSockets())].find(
    (s) => s.data.playerId === holder.id,
  )
  if (holderSocket) {
    holderSocket.emit('bluffing:role', {
      role: 'truth',
      answer: realAnswer,
      instruction: '\u0623\u0646\u062A \u062A\u0639\u0631\u0641 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629. \u062D\u0627\u0648\u0644 \u0625\u0642\u0646\u0627\u0639 \u0627\u0644\u0622\u062E\u0631\u064A\u0646 \u0623\u0646\u0647\u0627 \u0635\u062D\u064A\u062D\u0629!',
    })
  }

  // Broadcast: all others are bluffers
  io.to(roomCode).emit('bluffing:start', {
    instruction: '\u0627\u0643\u062A\u0628 \u0625\u062C\u0627\u0628\u0629 \u0645\u0642\u0646\u0639\u0629 \u2014 \u0623\u0646\u062A \u062A\u062D\u0627\u0648\u0644 \u062E\u062F\u0627\u0639 \u0627\u0644\u0622\u062E\u0631\u064A\u0646!',
    realAnswerHolderKnown: false,
  })
}

export function registerBluffingHandlers(io: Server, socket: Socket): void {

  /**
   * bluffing:submit — player submits their answer (real or fake).
   * Server hides answers from all players until all have submitted.
   */
  socket.on('bluffing:submit', async (data: { text: string }) => {
    const roomCode = socket.data.roomCode as string
    const playerId = socket.data.playerId as string
    if (!roomCode || !playerId) return

    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'bluffing:submit') return

    const playerState = gameState.playerStates[playerId]
    if (!playerState || playerState.answeredCurrentQ) return

    const text = typeof data?.text === 'string'
      ? escapeHtml(data.text.trim().substring(0, 200))
      : ''
    if (!text) return

    if (!gameState.bluffingSubmissions) gameState.bluffingSubmissions = {}

    const isReal = gameState.bluffingRealAnswerHolderId === playerId
    gameState.bluffingSubmissions[playerId] = { text, votes: [], isReal }
    playerState.answeredCurrentQ = true

    await saveGameState(roomCode, gameState)

    // Tell submitter their submission was received (no text to others)
    socket.emit('bluffing:submitted', { ok: true })

    // Broadcast answer count progress to host
    const submittedCount = Object.keys(gameState.bluffingSubmissions).length
    const totalPlayers = Object.keys(gameState.playerStates).length
    io.to(roomCode).emit('bluffing:progress', { submitted: submittedCount, total: totalPlayers })

    // Auto-advance to voting when all players have submitted
    if (submittedCount >= totalPlayers) {
      await startBluffingVoting(io, roomCode)
    }
  })

  /**
   * bluffing:lock — host manually advances from submit to vote phase.
   */
  socket.on('bluffing:lock', async () => {
    const roomCode = socket.data.roomCode as string
    if (!roomCode || !socket.data.isHost) return
    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'bluffing:submit') return
    await startBluffingVoting(io, roomCode)
  })

  /**
   * bluffing:vote — player votes for which answer they think is real.
   * Cannot vote for their own answer.
   */
  socket.on('bluffing:vote', async (data: { targetPlayerId: string }) => {
    const roomCode = socket.data.roomCode as string
    const playerId = socket.data.playerId as string
    if (!roomCode || !playerId) return

    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'bluffing:vote') return

    const playerState = gameState.playerStates[playerId]
    if (!playerState || playerState.votedCurrentQ) return

    const targetId = typeof data?.targetPlayerId === 'string' ? data.targetPlayerId : ''
    if (!targetId || targetId === playerId) return // cannot vote for own answer

    if (!gameState.bluffingSubmissions?.[targetId]) return

    gameState.bluffingSubmissions[targetId].votes.push(playerId)
    playerState.votedCurrentQ = true
    await saveGameState(roomCode, gameState)

    // Broadcast vote count update (not who voted for whom)
    const votedCount = Object.values(gameState.playerStates).filter((p) => p.votedCurrentQ).length
    const totalVoters = Object.keys(gameState.playerStates).length
    io.to(roomCode).emit('bluffing:vote_progress', { voted: votedCount, total: totalVoters })

    // Auto-resolve if all eligible players voted
    const allVoted = Object.entries(gameState.playerStates).every(
      ([, ps]) => ps.votedCurrentQ,
    )
    if (allVoted) {
      clearBluffingTimers(roomCode)
      await resolveBluffing(io, roomCode)
    }
  })
}

async function startBluffingVoting(io: Server, roomCode: string): Promise<void> {
  const gameState = await getGameState(roomCode)
  if (!gameState) return

  gameState.phase = 'bluffing:vote'
  gameState.bluffingVotingDeadline = Date.now() + 20_000
  await saveGameState(roomCode, gameState)

  // Shuffle submissions before broadcast — hide who wrote what
  const entries = Object.entries(gameState.bluffingSubmissions ?? {}).map(([pid, sub]) => ({
    id: pid,
    text: sub.text,
  }))
  shuffle(entries)

  io.to(roomCode).emit('bluffing:vote_start', {
    answers: entries,
    deadline: gameState.bluffingVotingDeadline,
  })

  // Auto-resolve after 20s
  clearBluffingTimers(roomCode)
  const timer = setTimeout(() => { void resolveBluffing(io, roomCode) }, 20_000)
  bluffingVotingTimers.set(roomCode, timer)
}

async function resolveBluffing(io: Server, roomCode: string): Promise<void> {
  clearBluffingTimers(roomCode)
  const gameState = await getGameState(roomCode)
  if (!gameState || gameState.phase !== 'bluffing:vote') return

  const submissions = gameState.bluffingSubmissions ?? {}
  const holderId = gameState.bluffingRealAnswerHolderId ?? ''

  // Scoring:
  // Bluffer earns 300 pts per vote their fake answer attracts
  // Real answer holder earns 500 pts if majority voted for the real answer
  const realVotes = submissions[holderId]?.votes.length ?? 0
  const totalVotes = Object.values(submissions).reduce((sum, s) => sum + s.votes.length, 0)
  const majorityFoundTruth = realVotes > totalVotes / 2

  for (const [pid, sub] of Object.entries(submissions)) {
    const ps = gameState.playerStates[pid]
    if (!ps) continue
    if (pid === holderId) {
      if (majorityFoundTruth) ps.score += 500
    } else {
      // Bluffer bonus
      ps.score += sub.votes.length * 300
    }
  }

  gameState.phase = 'reveal'
  gameState.revealedCurrentQ = true
  await saveGameState(roomCode, gameState)

  // Reveal all submissions with authorship
  const room = await getRoom(roomCode)
  const revealData = Object.entries(submissions).map(([pid, sub]) => {
    const player = room?.players.find((p) => p.id === pid)
    return {
      playerId: pid,
      playerName: player?.name ?? '???',
      playerEmoji: player?.emoji ?? '?',
      text: sub.text,
      votes: sub.votes,
      isReal: sub.isReal,
    }
  })

  io.to(roomCode).emit('bluffing:results', {
    submissions: revealData,
    realAnswerHolderId: holderId,
    majorityFoundTruth,
  })
}
