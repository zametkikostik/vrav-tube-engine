export type PlatformKind = 'web' | 'tauri' | 'capacitor'

export function detectPlatform(): PlatformKind {
  if (typeof window === 'undefined') return 'web'
  if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) return 'tauri'
  const cap = (window as any).Capacitor
  if (cap?.isNativePlatform?.()) return 'capacitor'
  return 'web'
}

export function getApiBase(): string {
  const env = import.meta.env.VITE_API_URL as string | undefined
  if (env) return env.replace(/\/$/, '')
  const platform = detectPlatform()
  if (platform === 'tauri') return 'http://127.0.0.1:8787'
  if (platform === 'capacitor') return 'http://10.0.2.2:8787'
  if (import.meta.env.DEV) return ''
  return ''
}

export function isDesktop() {
  return detectPlatform() === 'tauri'
}

export function isMobile() {
  return detectPlatform() === 'capacitor'
}
