import type { GameState, PlayerGameState, LeaderboardEntry } from './game.types'
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
): number {
  if (!isCorrect) return 0
  const ratio = Math.min(Math.max(elapsedMs / timerDurationMs, 0), 1)
  const base = Math.floor((1 - ratio / 2) * 1000)
  const multiplier = streak >= 3 ? 1.5 : 1
  return Math.floor(base * multiplier)
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
    states[p.id] = { score: 0, streak: 0, answeredCurrentQ: false }
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
