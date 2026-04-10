export interface HostSettings {
  layout: '2x2' | '4-column' | 'vertical'
  timerStyle: 'bar' | 'circle' | 'number'
  revealMode: 'auto' | 'manual'
}

export interface PlayerGameState {
  score: number
  streak: number
  answeredCurrentQ: boolean
  lastAnswerTime?: number
}

export interface GameState {
  questionIds: string[]
  currentQuestionIndex: number
  phase: 'pre-game' | 'question' | 'reveal' | 'leaderboard' | 'ended'
  questionStartedAt: number
  timerDuration: number
  playerStates: Record<string, PlayerGameState>
  hostSettings: HostSettings
  /** Idempotency guard — true once question:revealed has been emitted for the current question. */
  revealedCurrentQ?: boolean
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
}
