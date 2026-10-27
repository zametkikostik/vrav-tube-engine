import type { TitleSuggestion, AuditResult, VideoMeta, RiskResult, RiskFinding, ApiKeys, LlmProvider } from './types'
import { LLM_ENDPOINTS } from './types'
import { mockTitles, dangerousWords } from '../data/mock'
import { loadKeys } from './keys'
import { fetchVideoMeta } from './youtube'

async function callLLM(system: string, user: string, keys: ApiKeys): Promise<string | null> {
  if (!keys.openai) return null
  const model = keys.model || 'gpt-4o-mini'
  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.8,
    max_tokens: 1200,
  }

  // Order: explicit provider → RouterAI (default) → OpenRouter → OpenAI
  const provider = (keys.provider || 'routerai') as LlmProvider
  const candidates: LlmProvider[] = [provider, 'routerai', 'openrouter', 'openai']
  const order: LlmProvider[] = candidates.filter((v, i, a) => a.indexOf(v) === i)

  for (const p of order) {
    try {
      const url = LLM_ENDPOINTS[p]
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keys.openai}`,
      }
      if (p === 'openrouter' || p === 'routerai') {
        headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://vrav.tube'
        headers['X-Title'] = 'VRAV Tube Engine'
      }
      const payload =
        p === 'openai' && !model.startsWith('gpt')
          ? { ...body, model: 'gpt-4o-mini' }
          : body

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (typeof text === 'string' && text.trim()) return text.trim()
    } catch {
      /* try next provider */
    }
  }
  return null
}

function parseTitles(text: string): TitleSuggestion[] {
  const lines = text
    .split(/\n+/)
    .map(l => l.replace(/^\d+[.)]\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(l => l.length > 10 && l.length < 120)
  if (!lines.length) return mockTitles
  return lines.slice(0, 12).map((title, i) => ({
    title,
    score: Math.max(60, 95 - i * 3),
    reason: 'AI generated',
  }))
}

export async function runAudit(url: string, keys?: ApiKeys): Promise<AuditResult> {
  const k = keys || loadKeys()
  const meta = await fetchVideoMeta(url, k.youtube)

  const system = `You are a YouTube SEO expert. Reply in the same language as the video title. Return ONLY a numbered list of 10 clickable titles (no clickbait lies), then a blank line, then an optimized description with timestamps placeholders and hashtags.`
  const user = `Title: ${meta.title}\nDescription: ${meta.description?.slice(0, 800)}\nTags: ${(meta.tags || []).join(', ')}`

  const ai = await callLLM(system, user, k)
  let titles = mockTitles
  let optimizedDescription = meta.description || ''
  let tags = meta.tags || []
  let issues: string[] = []

  if (ai) {
    const parts = ai.split(/\n\s*\n/)
    titles = parseTitles(parts[0] || ai)
    if (parts[1]) optimizedDescription = parts.slice(1).join('\n\n')
  } else {
    issues.push('LLM unavailable — showing heuristic suggestions')
  }

  if (!meta.title || meta.title.length < 20) issues.push('Title is short')
  if (!meta.description || meta.description.length < 100) issues.push('Description is thin for SEO')
  if (!tags.length) issues.push('No tags')

  const score = Math.min(
    98,
    55 +
      (meta.title?.length > 30 ? 10 : 0) +
      (meta.description?.length > 200 ? 15 : 0) +
      (tags.length > 5 ? 10 : 0) +
      (ai ? 10 : 0)
  )

  return { meta, score, titles, optimizedDescription, tags, issues }
}

export async function checkRisk(text: string, keys?: ApiKeys): Promise<RiskResult> {
  const lower = text.toLowerCase()
  const findings: RiskFinding[] = []

  for (const w of dangerousWords) {
    if (lower.includes(w.word.toLowerCase())) {
      findings.push({
        word: w.word,
        reason: w.reason,
        severity: w.severity as RiskFinding['severity'],
      })
    }
  }

  const k = keys || loadKeys()
  if (k.openai && text.length > 40) {
    const ai = await callLLM(
      'You flag YouTube monetization risk (yellow icon). List risky words/phrases only as JSON array of {word, reason, severity: low|medium|high}. No markdown.',
      text.slice(0, 3000)
    )
    if (ai) {
      try {
        const json = JSON.parse(ai.replace(/```json|```/g, '').trim())
        if (Array.isArray(json)) {
          for (const item of json) {
            if (item?.word)
              findings.push({
                word: String(item.word),
                reason: String(item.reason || 'AI flagged'),
                severity: (item.severity as RiskFinding['severity']) || 'medium',
              })
          }
        }
      } catch {
        /* ignore parse */
      }
    }
  }

  const high = findings.filter(f => f.severity === 'high').length
  const med = findings.filter(f => f.severity === 'medium').length
  let level: RiskResult['level'] = 'green'
  let score = 10
  if (high > 0 || med > 3) {
    level = 'red'
    score = 75 + high * 5
  } else if (med > 0 || findings.length > 0) {
    level = 'yellow'
    score = 40 + med * 8
  }

  return {
    score: Math.min(100, score),
    level,
    findings,
    summary:
      level === 'green'
        ? 'Looks safe for full monetization'
        : level === 'yellow'
          ? 'Moderate risk — review highlighted parts'
          : 'High risk of limited or no ads',
  }
}
