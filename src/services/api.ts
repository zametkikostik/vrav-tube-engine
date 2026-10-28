import type { AuditResult, RiskResult, ApiKeys } from './types'
import { loadKeys } from './keys'
import { runAudit as clientAudit, checkRisk as clientRisk } from './llm'
import { getApiBase } from './platform'

const API_BASE = getApiBase()

function headers(keys?: ApiKeys): HeadersInit {
  const k = keys || loadKeys()
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const lic = localStorage.getItem('vrav_license_key')
  if (lic) h['X-API-Key'] = lic
  else if (k.openai) h['X-API-Key'] = k.openai.slice(0, 32)
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
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null // backend offline → client fallback
  }
}

/** Audit: backend first (no CORS), else client */
export async function auditVideo(url: string): Promise<AuditResult> {
  const keys = loadKeys()
  const fromServer = await tryBackend<AuditResult>('/api/audit', {
    url,
    youtubeKey: keys.youtube,
    llmKey: keys.openai,
    model: keys.model || 'gpt-4o-mini',
  })
  if (fromServer) return fromServer
  return clientAudit(url, keys)
}

/** Risk: backend first, else client */
export async function checkRisk(text: string): Promise<RiskResult> {
  const keys = loadKeys()
  const fromServer = await tryBackend<RiskResult>('/api/risk', {
    text,
    llmKey: keys.openai,
    model: keys.model || 'gpt-4o-mini',
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
