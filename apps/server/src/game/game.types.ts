export interface HostSettings {
  layout: '2x2' | '4-column' | 'vertical'
  timerStyle: 'bar' | 'circle' | 'number'
  revealMode: 'auto' | 'manual'
}

/** Mirrors the Prisma QuestionType enum for use in frontend/shared code without Prisma client dependency. */
export type QuestionType = 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'

/** A single player's free text answer with the list of voters who voted for it. */
export interface FreeTextAnswer {
  text: string
  votes: string[]
}

export interface PlayerGameState {
  score: number
  streak: number
  answeredCurrentQ: boolean
  lastAnswerTime?: number
  /** Free text voting deduplication guard — true once player has cast their vote. */
  votedCurrentQ?: boolean
  // --- Phase 6: Lifeline state ---
  /** Permanent per-game flag: Double Points lifeline has been used */
  doublePointsUsed: boolean
  /** Permanent per-game flag: Remove Two lifeline has been used */
  removeTwoUsed: boolean
  /** Permanent per-game flag: Freeze Opponent lifeline has been used */
  freezeOpponentUsed: boolean
  /** Transient per-question: Double Points is active for current question scoring */
  doublePointsActiveCurrentQ: boolean
  /** Transient per-question: This player is frozen and cannot answer */
  frozenCurrentQ: boolean
}

export interface GameState {
  questionIds: string[]
  currentQuestionIndex: number
  phase: 'pre-game' | 'question' | 'reveal' | 'leaderboard' | 'ended' | 'voting'
  questionStartedAt: number
  timerDuration: number
  playerStates: Record<string, PlayerGameState>
  hostSettings: HostSettings
  /** Idempotency guard — true once question:revealed has been emitted for the current question. */
  revealedCurrentQ?: boolean
  /** Free text answers keyed by answering player ID. Present during voting phase. */
  freeTextAnswers?: Record<string, FreeTextAnswer>
  /** Unix timestamp (ms) when the voting phase closes. */
  votingDeadline?: number
}

export interface LeaderboardEntry {
  id: string
  name: string
  emoji: string
  score: number
  rank: number
  streak: number
}

export interface QuestionPayload {
  text: string
  options: string[]
  timerDuration: number
  type: QuestionType
  mediaUrl?: string
}
