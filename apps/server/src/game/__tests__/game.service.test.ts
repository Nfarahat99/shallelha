import { describe, it, expect, vi } from 'vitest'

// Mock Redis client before importing the service (prevents REDIS_URL env var requirement)
vi.mock('../../redis/client', () => {
  const mockRedis = {
    hset: vi.fn(),
    hget: vi.fn(),
  }
  return { redis: mockRedis }
})

import { calculateScore, getLeaderboard, createInitialPlayerStates, calculateFreeTextScore } from '../game.service'
import type { Player } from '../../room/room'

describe('calculateScore', () => {
  it('returns 1000 for instant correct answer (elapsed=0) with no streak', () => {
    expect(calculateScore(true, 0, 20000, 0)).toBe(1000)
  })

  it('returns 500 for last-second correct answer (elapsed=timerDuration) with no streak', () => {
    expect(calculateScore(true, 20000, 20000, 0)).toBe(500)
  })

  it('returns 750 for halfway-correct answer (elapsed=half of timer) with no streak', () => {
    expect(calculateScore(true, 10000, 20000, 0)).toBe(750)
  })

  it('returns 0 for a wrong answer regardless of elapsed time', () => {
    expect(calculateScore(false, 0, 20000, 0)).toBe(0)
  })

  it('returns 1500 for instant correct answer with streak of 3 (1.5x multiplier)', () => {
    expect(calculateScore(true, 0, 20000, 3)).toBe(1500)
  })

  it('returns 1000 for instant correct answer with streak of 2 (no multiplier)', () => {
    expect(calculateScore(true, 0, 20000, 2)).toBe(1000)
  })

  it('returns 1125 for halfway correct answer with streak of 4 (750 * 1.5)', () => {
    expect(calculateScore(true, 10000, 20000, 4)).toBe(1125)
  })

  it('clamps to 1000 when elapsed is negative', () => {
    expect(calculateScore(true, -100, 20000, 0)).toBe(1000)
  })

  it('clamps to 500 when elapsed exceeds timer duration', () => {
    expect(calculateScore(true, 30000, 20000, 0)).toBe(500)
  })

  it('returns 0 for wrong answer with streak of 5', () => {
    expect(calculateScore(false, 5000, 20000, 5)).toBe(0)
  })

  // --- Phase 6: Double Points parameter ---
  it('returns 2000 for instant correct with doublePoints=true (1000*2)', () => {
    expect(calculateScore(true, 0, 20000, 0, true)).toBe(2000)
  })

  it('returns 3000 for instant correct with streak=3 and doublePoints=true (1000*1.5*2)', () => {
    expect(calculateScore(true, 0, 20000, 3, true)).toBe(3000)
  })

  it('returns 2250 for halfway correct with streak=3 and doublePoints=true (750*1.5*2)', () => {
    expect(calculateScore(true, 10000, 20000, 3, true)).toBe(2250)
  })

  it('returns 0 for wrong answer even with doublePoints=true', () => {
    expect(calculateScore(false, 0, 20000, 0, true)).toBe(0)
  })

  it('returns 1000 for instant correct with doublePoints=false (no change)', () => {
    expect(calculateScore(true, 0, 20000, 0, false)).toBe(1000)
  })
})

describe('getLeaderboard', () => {
  const players: Player[] = [
    { id: 'p1', name: 'أحمد', emoji: '😄', socketId: 'socket1' },
    { id: 'p2', name: 'فاطمة', emoji: '😊', socketId: 'socket2' },
    { id: 'p3', name: 'خالد', emoji: '🎉', socketId: 'socket3' },
  ]

  it('returns players sorted by score descending', () => {
    const states = {
      p1: { score: 500, streak: 1, answeredCurrentQ: true },
      p2: { score: 1000, streak: 2, answeredCurrentQ: true },
      p3: { score: 750, streak: 0, answeredCurrentQ: true },
    }
    const result = getLeaderboard(states, players)
    expect(result[0].id).toBe('p2')
    expect(result[1].id).toBe('p3')
    expect(result[2].id).toBe('p1')
  })

  it('assigns correct rank numbers', () => {
    const states = {
      p1: { score: 500, streak: 1, answeredCurrentQ: true },
      p2: { score: 1000, streak: 2, answeredCurrentQ: true },
      p3: { score: 750, streak: 0, answeredCurrentQ: true },
    }
    const result = getLeaderboard(states, players)
    expect(result[0].rank).toBe(1)
    expect(result[1].rank).toBe(2)
    expect(result[2].rank).toBe(3)
  })

  it('assigns the same rank for tied scores', () => {
    const states = {
      p1: { score: 750, streak: 1, answeredCurrentQ: true },
      p2: { score: 1000, streak: 2, answeredCurrentQ: true },
      p3: { score: 750, streak: 0, answeredCurrentQ: true },
    }
    const result = getLeaderboard(states, players)
    // p2 is rank 1; p1 and p3 both 750 — both should be rank 2
    const p1Entry = result.find(e => e.id === 'p1')!
    const p3Entry = result.find(e => e.id === 'p3')!
    expect(p1Entry.rank).toBe(2)
    expect(p3Entry.rank).toBe(2)
  })

  it('handles players missing from state by defaulting score to 0', () => {
    const result = getLeaderboard({}, players)
    expect(result.every(e => e.score === 0)).toBe(true)
  })
})

describe('createInitialPlayerStates', () => {
  it('initializes all players with score 0, streak 0, answeredCurrentQ false, and all 5 lifeline fields false', () => {
    const players: Player[] = [
      { id: 'p1', name: 'أحمد', emoji: '😄', socketId: 'socket1' },
      { id: 'p2', name: 'فاطمة', emoji: '😊', socketId: 'socket2' },
    ]
    const states = createInitialPlayerStates(players)
    expect(states['p1']).toEqual({
      score: 0,
      streak: 0,
      answeredCurrentQ: false,
      doublePointsUsed: false,
      removeTwoUsed: false,
      freezeOpponentUsed: false,
      doublePointsActiveCurrentQ: false,
      frozenCurrentQ: false,
    })
    expect(states['p2']).toEqual({
      score: 0,
      streak: 0,
      answeredCurrentQ: false,
      doublePointsUsed: false,
      removeTwoUsed: false,
      freezeOpponentUsed: false,
      doublePointsActiveCurrentQ: false,
      frozenCurrentQ: false,
    })
  })

  it('returns an empty object for an empty player list', () => {
    const states = createInitialPlayerStates([])
    expect(states).toEqual({})
  })
})

describe('calculateFreeTextScore', () => {
  it('single winner with 3 votes: author gets 800, all 3 voters get 200', () => {
    const answers = {
      p1: { text: 'الصحراء', votes: ['p2', 'p3', 'p4'] },
      p2: { text: 'البحر', votes: [] },
    }
    const result = calculateFreeTextScore(answers)
    expect(result.winnerIds).toEqual(['p1'])
    expect(result.authorScores['p1']).toBe(800)
    expect(result.authorScores['p2']).toBe(0)
    expect(result.voterScores['p2']).toBe(200)
    expect(result.voterScores['p3']).toBe(200)
    expect(result.voterScores['p4']).toBe(200)
  })

  it('two tied winners (2 votes each): both authors get 800, all 4 voters get 200', () => {
    const answers = {
      p1: { text: 'الصحراء', votes: ['p3', 'p4'] },
      p2: { text: 'البحر', votes: ['p5', 'p6'] },
    }
    const result = calculateFreeTextScore(answers)
    expect(result.winnerIds).toContain('p1')
    expect(result.winnerIds).toContain('p2')
    expect(result.authorScores['p1']).toBe(800)
    expect(result.authorScores['p2']).toBe(800)
    expect(result.voterScores['p3']).toBe(200)
    expect(result.voterScores['p4']).toBe(200)
    expect(result.voterScores['p5']).toBe(200)
    expect(result.voterScores['p6']).toBe(200)
  })

  it('zero votes: no winners, all scores 0, winnerText empty', () => {
    const answers = {
      p1: { text: 'الصحراء', votes: [] },
      p2: { text: 'البحر', votes: [] },
    }
    const result = calculateFreeTextScore(answers)
    expect(result.winnerIds).toEqual([])
    expect(result.authorScores['p1']).toBe(0)
    expect(result.authorScores['p2']).toBe(0)
    expect(result.winnerText).toBe('')
  })

  it('single voter: that answer wins, author gets 800, voter gets 200', () => {
    const answers = {
      p1: { text: 'الصحراء', votes: ['p2'] },
    }
    const result = calculateFreeTextScore(answers)
    expect(result.winnerIds).toEqual(['p1'])
    expect(result.authorScores['p1']).toBe(800)
    expect(result.voterScores['p2']).toBe(200)
  })

  it('player with no votes does not appear in winnerIds and gets authorScore 0', () => {
    const answers = {
      p1: { text: 'الصحراء', votes: ['p3'] },
      p2: { text: 'البحر', votes: [] },
    }
    const result = calculateFreeTextScore(answers)
    expect(result.winnerIds).not.toContain('p2')
    expect(result.authorScores['p2']).toBe(0)
  })

  it('voters for non-winning answers do not receive voter bonus', () => {
    const answers = {
      p1: { text: 'الصحراء', votes: ['p3', 'p4', 'p5'] },
      p2: { text: 'البحر', votes: ['p6'] },
    }
    const result = calculateFreeTextScore(answers)
    expect(result.winnerIds).toEqual(['p1'])
    expect(result.voterScores['p6']).toBe(0)
    expect(result.voterScores['p3']).toBe(200)
  })
})
