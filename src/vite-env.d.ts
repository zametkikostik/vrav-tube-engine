/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_YOUTUBE_API_KEY?: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_ROUTERAI_API_KEY?: string
  readonly VITE_DEFAULT_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {
  const css: string
  export default css
}
