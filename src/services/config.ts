export const config = {
  youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',
  openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  openAiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  routerAiApiKey: import.meta.env.VITE_ROUTERAI_API_KEY || '',
  defaultModel: import.meta.env.VITE_DEFAULT_MODEL || 'gpt-4o-mini',
  routerAiUrl: 'https://routerai.ru/api/v1/chat/completions',
  openRouterUrl: 'https://openrouter.ai/api/v1/chat/completions',
  openAiUrl: 'https://api.openai.com/v1/chat/completions',
}
