import type { AuditResult, RiskResult, ApiKeys } from './types'
import { loadKeys } from './keys'
import { runAudit as clientAudit, checkRisk as clientRisk } from './llm'
import { getApiBase } from './platform'

const API_BASE = getApiBase()

function headers(_keys?: ApiKeys): HeadersInit {
  const k = _keys || loadKeys()
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const lic = localStorage.getItem('vrav_license_key')
  if (lic) h['X-API-Key'] = lic
  h['X-User-Id'] =
    localStorage.getItem('vrav_user_id') ||
    (() => {
      const id = 'user_' + Math.random().toString(36).slice(2, 10)
      localStorage.setItem('vrav_user_id', id)
      return id
    })()
  return h
}

async function tryBackend<T>(path: string, body: object): Promise<T | null> {
  try {
    const base = API_BASE || ''
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Audit: server first (no CORS), else client LLM with saved keys */
export async function auditVideo(url: string): Promise<AuditResult> {
  const keys = loadKeys()
  const fromServer = await tryBackend<AuditResult>('/api/audit', {
    url,
    youtubeKey: keys.youtube,
    llmKey: keys.openai,
    model: keys.model || 'gpt-4o-mini',
    provider: keys.provider || undefined,
  })
  if (fromServer?.titles?.length) return fromServer
  // Pass FULL keys object — not only youtube
  return clientAudit(url, keys)
}

export async function checkRisk(text: string): Promise<RiskResult> {
  const keys = loadKeys()
  const fromServer = await tryBackend<RiskResult>('/api/risk', {
    text,
    llmKey: keys.openai,
    model: keys.model || 'gpt-4o-mini',
    provider: keys.provider || undefined,
  })
  if (fromServer) return fromServer
  return clientRisk(text, keys)
}

export async function fetchHistory(limit = 30) {
  try {
    const res = await fetch(`${API_BASE}/api/history?limit=${limit}`, {
      headers: headers(),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
}

export async function fetchLicense() {
  try {
    const res = await fetch(`${API_BASE}/api/license`, { headers: headers() })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
