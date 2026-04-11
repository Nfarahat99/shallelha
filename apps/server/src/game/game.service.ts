import type { GameState, PlayerGameState, LeaderboardEntry, FreeTextAnswer } from './game.types'
import type { Player } from '../room/room'
import { redis } from '../redis/client'

/**
 * Calculate score for a player answer.
 * - Correct: linear decay from 1000 (instant) to 500 (last second)
 * - Wrong: 0
 * - Streak >= 3: 1.5x multiplier applied to base score
 * - elapsedMs and timerDurationMs are clamped to [0, timerDurationMs]
 *
 * Security note (T-03-01): elapsedMs MUST be derived from server-side timestamps only.
 * Never accept elapsedMs directly from the client.
 */
export function calculateScore(
  isCorrect: boolean,
  elapsedMs: number,
  timerDurationMs: number,
  streak: number,
  doublePoints = false,
): number {
  if (!isCorrect) return 0
  const ratio = Math.min(Math.max(elapsedMs / timerDurationMs, 0), 1)
  const base = Math.floor((1 - ratio / 2) * 1000)
  const streakMultiplier = streak >= 3 ? 1.5 : 1
  const dpMultiplier = doublePoints ? 2 : 1
  return Math.floor(base * streakMultiplier * dpMultiplier)
}

/**
 * Create the initial per-player game state for all players in a room.
 * Called when a game session begins.
 */
export function createInitialPlayerStates(
  players: Player[],
): Record<string, PlayerGameState> {
  const states: Record<string, PlayerGameState> = {}
  for (const p of players) {
    states[p.id] = {
      score: 0,
      streak: 0,
      answeredCurrentQ: false,
      doublePointsUsed: false,
      removeTwoUsed: false,
      freezeOpponentUsed: false,
      doublePointsActiveCurrentQ: false,
      frozenCurrentQ: false,
    }
  }
  return states
}

/**
 * Compute a ranked leaderboard from current player states.
 * Sorted by score descending; tied scores receive the same rank.
 */
export function getLeaderboard(
  playerStates: Record<string, PlayerGameState>,
  players: Player[],
): LeaderboardEntry[] {
  const entries = players.map(p => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    score: playerStates[p.id]?.score ?? 0,
    rank: 0,
    streak: playerStates[p.id]?.streak ?? 0,
  }))
  entries.sort((a, b) => b.score - a.score)
  let currentRank = 1
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].score < entries[i - 1].score) {
      currentRank = i + 1
    }
    entries[i].rank = currentRank
  }
  return entries
}

/**
 * Persist game state to Redis under the room's hash key.
 * Uses the existing room:{code} hash pattern to keep all room data co-located.
 */
export async function saveGameState(roomCode: string, gameState: GameState): Promise<void> {
  await redis.hset(`room:${roomCode}`, 'gameState', JSON.stringify(gameState))
}

/**
 * Retrieve game state from Redis. Returns null if no game state exists yet.
 */
export async function getGameState(roomCode: string): Promise<GameState | null> {
  const raw = await redis.hget(`room:${roomCode}`, 'gameState')
  if (!raw) return null
  return JSON.parse(raw)
}

/**
 * Delete game state from Redis (called on game end cleanup).
 */
export async function deleteGameState(roomCode: string): Promise<void> {
  await redis.hdel(`room:${roomCode}`, 'gameState')
}

export interface FreeTextResult {
  authorScores: Record<string, number>
  voterScores: Record<string, number>
  winnerIds: string[]
  winnerText: string
}

/**
 * Calculate scores after the free text voting phase.
 *
 * Rules (per D-09):
 * - Find max vote count across all answers.
 * - If maxVotes === 0: no winners, all scores 0.
 * - All answers with votes.length === maxVotes are winners.
 * - Winner authors receive 800 points each.
 * - Non-winner authors receive 0.
 * - Voters who voted for ANY winning answer receive 200 bonus each.
 * - Voters who only voted for losing answers receive 0.
 * - Ties: all tied authors get 800, all their voters get 200.
 *
 * Security note (T-05-02): Pure function with no external state.
 */
export function calculateFreeTextScore(
  freeTextAnswers: Record<string, FreeTextAnswer>,
): FreeTextResult {
  const authorScores: Record<string, number> = {}
  const voterScores: Record<string, number> = {}
  const winnerIds: string[] = []

  const entries = Object.entries(freeTextAnswers)

  // Initialise all authors to 0
  for (const [authorId] of entries) {
    authorScores[authorId] = 0
  }

  // Find max vote count
  const maxVotes = entries.reduce((max, [, answer]) => Math.max(max, answer.votes.length), 0)

  // Zero votes — no winners
  if (maxVotes === 0) {
    return { authorScores, voterScores, winnerIds, winnerText: '' }
  }

  // Identify winners and collect winning voter IDs
  const winningVoterIds = new Set<string>()
  let winnerText = ''

  for (const [authorId, answer] of entries) {
    if (answer.votes.length === maxVotes) {
      winnerIds.push(authorId)
      authorScores[authorId] = 800
      if (winnerText === '') winnerText = answer.text
      for (const voterId of answer.votes) {
        winningVoterIds.add(voterId)
      }
    }
  }

  // Assign voter bonuses — only for voters who voted for a winning answer
  for (const [, answer] of entries) {
    for (const voterId of answer.votes) {
      if (!(voterId in voterScores)) {
        voterScores[voterId] = 0
      }
    }
  }
  for (const voterId of winningVoterIds) {
    voterScores[voterId] = 200
  }

  return { authorScores, voterScores, winnerIds, winnerText }
}
