import { redis } from '../redis/client'
import type { Player } from '../room/room'
import type { GameState, LeaderboardEntry, PlayerGameState } from './game.types'

const GAME_STATE_TTL = 60 * 60 * 24 // 24 hours

function gameStateKey(roomCode: string): string {
  return `game:${roomCode}`
}

/**
 * Calculate score for a correct answer based on speed.
 * Formula: max 1000 points, min 500 points, linear decay.
 * Streak multiplier: 1.5x after 3+ consecutive correct answers.
 * Wrong answer: 0 points.
 */
export function calculateScore(
  isCorrect: boolean,
  elapsedMs: number,
  timerDurationMs: number,
  streak: number,
): number {
  if (!isCorrect) return 0

  // Linear decay from 1000 to 500
  const ratio = Math.min(1, elapsedMs / timerDurationMs)
  const base = Math.floor(1000 - ratio * 500)
  const clampedBase = Math.max(500, Math.min(1000, base))

  // Apply streak multiplier after 3+ consecutive correct answers
  const multiplier = streak >= 3 ? 1.5 : 1
  return Math.floor(clampedBase * multiplier)
}

/**
 * Create initial player states from room players list.
 * All players start at 0 score, 0 streak, and have not answered the current question.
 */
export function createInitialPlayerStates(
  players: Player[],
): Record<string, PlayerGameState> {
  const states: Record<string, PlayerGameState> = {}
  for (const player of players) {
    states[player.id] = {
      score: 0,
      streak: 0,
      answeredCurrentQ: false,
    }
  }
  return states
}

/**
 * Get a sorted leaderboard from current player states.
 * Merges player profile data (name, emoji) with game state (score, streak).
 * Sorted descending by score; rank assigned 1-indexed.
 */
export function getLeaderboard(
  playerStates: Record<string, PlayerGameState>,
  players: Player[],
): LeaderboardEntry[] {
  const playerMap = new Map(players.map((p) => [p.id, p]))

  const entries: LeaderboardEntry[] = Object.entries(playerStates)
    .map(([id, state]) => {
      const player = playerMap.get(id)
      return {
        id,
        name: player?.name ?? 'Unknown',
        emoji: player?.emoji ?? '❓',
        score: state.score,
        streak: state.streak,
        rank: 0, // filled below
      }
    })
    .sort((a, b) => b.score - a.score)

  return entries.map((entry, i) => ({ ...entry, rank: i + 1 }))
}

/**
 * Persist game state to Redis as a JSON string.
 */
export async function saveGameState(
  roomCode: string,
  gameState: GameState,
): Promise<void> {
  await redis.set(gameStateKey(roomCode), JSON.stringify(gameState), 'EX', GAME_STATE_TTL)
}

/**
 * Retrieve game state from Redis.
 * Returns null if no game state exists for this room.
 */
export async function getGameState(roomCode: string): Promise<GameState | null> {
  const raw = await redis.get(gameStateKey(roomCode))
  if (!raw) return null
  return JSON.parse(raw) as GameState
}

/**
 * Delete game state from Redis (called on game end cleanup).
 */
export async function deleteGameState(roomCode: string): Promise<void> {
  await redis.del(gameStateKey(roomCode))
}
