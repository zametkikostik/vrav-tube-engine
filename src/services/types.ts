export interface VideoMeta {
  id: string
  title: string
  description: string
  tags: string[]
  channelTitle: string
  channelId: string
  publishedAt: string
  viewCount?: string
  likeCount?: string
  thumbnail?: string
}

export interface TitleSuggestion {
  title: string
  score: number
  reason?: string
}

export interface AuditResult {
  meta: VideoMeta
  score: number
  titles: TitleSuggestion[]
  optimizedDescription: string
  tags: string[]
  issues: string[]
}

export interface RiskFinding {
  word: string
  reason: string
  severity: 'low' | 'medium' | 'high'
  context?: string
}

export interface RiskResult {
  score: number
  level: 'green' | 'yellow' | 'red'
  findings: RiskFinding[]
  summary: string
}

export type LlmProvider = 'routerai' | 'openrouter' | 'openai'

export interface ApiKeys {
  youtube?: string
  openai?: string
  model?: string
  provider?: LlmProvider
}

export const LLM_ENDPOINTS: Record<LlmProvider, string> = {
  routerai: 'https://routerai.ru/api/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
}
