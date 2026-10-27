import { getApiBase } from './platform'

const API_BASE = getApiBase()

export type LicenseTier = 'trial' | 'pro' | 'agency'

export interface WhiteLabelConfig {
  appName: string
  logoUrl?: string
  primaryColor: string
  accentColor: string
  youtubeRed?: string
  supportEmail?: string
  customDomain?: string
}

export interface LicenseInfo {
  tier: LicenseTier
  valid: boolean
  features: {
    audit: boolean
    risk: boolean
    history: boolean
    multiChannel: boolean
    advancedRisk: boolean
    whiteLabel: boolean
    apiAccess: boolean
    prioritySupport: boolean
  }
  whiteLabel: WhiteLabelConfig
  maxChannels: number
  message?: string
  key?: string
}

const LS_KEY = 'vrav_license_key'
const LS_WL = 'vrav_whitelabel_cache'

export function getStoredLicenseKey(): string {
  return localStorage.getItem(LS_KEY) || ''
}

export function setStoredLicenseKey(key: string) {
  if (key) localStorage.setItem(LS_KEY, key)
  else localStorage.removeItem(LS_KEY)
}

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  const key = getStoredLicenseKey()
  if (key) h['X-API-Key'] = key
  let uid = localStorage.getItem('vrav_user_id')
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('vrav_user_id', uid)
  }
  h['X-User-Id'] = uid
  return h
}

export async function fetchLicense(): Promise<LicenseInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/license`, { headers: headers() })
    if (!res.ok) return null
    const data = (await res.json()) as LicenseInfo
    if (data.whiteLabel) {
      localStorage.setItem(LS_WL, JSON.stringify(data.whiteLabel))
      applyWhiteLabel(data.whiteLabel)
    }
    return data
  } catch {
    const cached = localStorage.getItem(LS_WL)
    const wl: WhiteLabelConfig = cached
      ? JSON.parse(cached)
      : { appName: 'VRAV Tube Engine', primaryColor: '#a855f7', accentColor: '#3b82f6' }
    applyWhiteLabel(wl)
    return {
      tier: getStoredLicenseKey().startsWith('agency')
        ? 'agency'
        : getStoredLicenseKey().startsWith('pro')
          ? 'pro'
          : 'trial',
      valid: true,
      features: {
        audit: true,
        risk: true,
        history: true,
        multiChannel: !!getStoredLicenseKey(),
        advancedRisk: !!getStoredLicenseKey(),
        whiteLabel: getStoredLicenseKey().startsWith('agency'),
        apiAccess: !!getStoredLicenseKey(),
        prioritySupport: getStoredLicenseKey().startsWith('agency'),
      },
      whiteLabel: wl,
      maxChannels: getStoredLicenseKey().startsWith('agency') ? 100 : getStoredLicenseKey() ? 10 : 1,
    }
  }
}

export async function activateLicense(key: string): Promise<{ ok: boolean; error?: string; info?: LicenseInfo }> {
  try {
    const res = await fetch(`${API_BASE}/api/license/activate`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ key }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || 'Activation failed' }
    setStoredLicenseKey(key)
    const info = await fetchLicense()
    return { ok: true, info: info || undefined }
  } catch {
    if (['trial_demo', 'pro_demo_2026', 'agency_demo_2026'].includes(key)) {
      setStoredLicenseKey(key)
      const info = await fetchLicense()
      return { ok: true, info: info || undefined }
    }
    return { ok: false, error: 'Server offline and key not recognized offline' }
  }
}

export async function saveWhiteLabel(cfg: Partial<WhiteLabelConfig>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/license/whitelabel`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(cfg),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || 'Failed' }
    if (data.whiteLabel) {
      localStorage.setItem(LS_WL, JSON.stringify(data.whiteLabel))
      applyWhiteLabel(data.whiteLabel)
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Server offline' }
  }
}

export function applyWhiteLabel(cfg: WhiteLabelConfig) {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', cfg.primaryColor || '#a855f7')
  root.style.setProperty('--brand-accent', cfg.accentColor || '#3b82f6')
  root.style.setProperty('--brand-yt', cfg.youtubeRed || '#ff0000')
  if (cfg.appName) document.title = cfg.appName
}

export async function startCheckout(email: string, priceId: string) {
  const r = await fetch(`${API_BASE}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      priceId,
      successUrl: window.location.origin + '/?paid=1',
      cancelUrl: window.location.origin + '/?canceled=1',
    }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Checkout failed')
  if (data.url) window.location.href = data.url
  return data
}

export async function fetchPlans() {
  try {
    const res = await fetch(`${API_BASE}/api/stripe/prices`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
