import type {
  TitleSuggestion,
  AuditResult,
  VideoMeta,
  RiskResult,
  RiskFinding,
  ApiKeys,
  LlmProvider,
} from './types'
import { LLM_ENDPOINTS } from './types'
import { dangerousWords } from '../data/mock'
import { loadKeys } from './keys'
import { fetchVideoMeta } from './youtube'

/** Guess provider from key prefix so OpenAI keys are not sent to RouterAI first */
function detectProvider(keys: ApiKeys): LlmProvider {
  if (keys.provider === 'openai' || keys.provider === 'openrouter' || keys.provider === 'routerai') {
    return keys.provider
  }
  const k = (keys.openai || '').trim()
  if (k.startsWith('sk-or-')) return 'openrouter'
  if (k.startsWith('sk-')) return 'openai'
  return 'routerai'
}

function providerOrder(keys: ApiKeys): LlmProvider[] {
  const primary = detectProvider(keys)
  // OpenAI keys often fail in browser (CORS) — still try OpenRouter/RouterAI as fallback
  const rest: LlmProvider[] =
    primary === 'openai'
      ? ['openai', 'openrouter', 'routerai']
      : primary === 'openrouter'
        ? ['openrouter', 'routerai', 'openai']
        : ['routerai', 'openrouter', 'openai']
  return rest.filter((v, i, a) => a.indexOf(v) === i)
}

export type LlmCallResult = { text: string | null; error?: string; provider?: LlmProvider }

async function callLLM(system: string, user: string, keys: ApiKeys): Promise<LlmCallResult> {
  if (!keys.openai?.trim()) {
    return { text: null, error: 'Нет LLM-ключа. Сохраните ключ в Настройках.' }
  }

  const model = keys.model || 'gpt-4o-mini'
  const bodyBase = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.85,
    max_tokens: 1600,
  }

  const errors: string[] = []

  for (const p of providerOrder(keys)) {
    try {
      const url = LLM_ENDPOINTS[p]
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keys.openai.trim()}`,
      }
      if (p === 'openrouter' || p === 'routerai') {
        headers['HTTP-Referer'] =
          typeof window !== 'undefined' ? window.location.origin : 'https://vrav.tube'
        headers['X-Title'] = 'VRAV Tube Engine'
      }

      const modelForProvider =
        p === 'openai' && !model.startsWith('gpt') && !model.startsWith('o1') && !model.startsWith('o3')
          ? 'gpt-4o-mini'
          : model

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...bodyBase, model: modelForProvider }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        errors.push(`${p}: HTTP ${res.status} ${errText.slice(0, 120)}`)
        continue
      }

      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (typeof text === 'string' && text.trim()) {
        return { text: text.trim(), provider: p }
      }
      errors.push(`${p}: empty response`)
    } catch (e: any) {
      // CORS / network — typical for OpenAI from browser/Tauri webview
      errors.push(`${p}: ${e?.message || 'network/CORS'}`)
    }
  }

  return {
    text: null,
    error:
      errors.slice(0, 3).join(' · ') ||
      'LLM недоступен. OpenAI из приложения часто блокируется CORS — используйте OpenRouter/RouterAI или запустите API-сервер.',
  }
}

/** Titles derived from real video title — never the static mock list */
function heuristicTitles(meta: VideoMeta, count = 10): TitleSuggestion[] {
  const topic = (meta.title || 'YouTube').replace(/\s+/g, ' ').trim().slice(0, 55)
  const templates = [
    `${topic}: что изменилось в 2026`,
    `Как не потерять монетизацию: ${topic}`,
    `${topic} — полный разбор без воды`,
    `Я проверил «${topic.slice(0, 40)}» на практике`,
    `Почему «${topic.slice(0, 35)}» режет RPM`,
    `${topic}: чек-лист за 10 минут`,
    `Скрытые ошибки в теме «${topic.slice(0, 30)}»`,
    `${topic} — рабочая схема роста`,
    `Разбор: ${topic}`,
    `${topic} | честно и по делу`,
  ]
  return templates.slice(0, count).map((title, i) => ({
    title: title.slice(0, 100),
    score: 90 - i * 2,
    reason: 'heuristic',
  }))
}

function parseTitles(text: string, fallback: VideoMeta): TitleSuggestion[] {
  const lines = text
    .split(/\n+/)
    .map(l =>
      l
        .replace(/^#{1,3}\s*/, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^[-*]\s*/, '')
        .replace(/^"|"$/g, '')
        .trim()
    )
    .filter(l => l.length > 12 && l.length < 120 && !l.toLowerCase().startsWith('title'))
  if (!lines.length) return heuristicTitles(fallback)
  return lines.slice(0, 12).map((title, i) => ({
    title,
    score: Math.max(62, 96 - i * 3),
    reason: 'AI',
  }))
}

export async function runAudit(url: string, keys?: ApiKeys): Promise<AuditResult> {
  const k = keys || loadKeys()
  const meta = await fetchVideoMeta(url, k.youtube)

  const system = `Ты эксперт по YouTube SEO и CTR. Отвечай на языке названия видео.
Верни СТРОГО:
1) Нумерованный список из 10 кликабельных, но честных названий (без лжи и кликбейта-обмана), 40–70 символов.
2) Пустая строка.
3) SEO-описание: хук, ценность, 3–5 таймкодов (0:00, …), призыв подписаться, 5–8 хэштегов.`

  const user = `Название: ${meta.title}\nОписание: ${(meta.description || '').slice(0, 900)}\nТеги: ${(meta.tags || []).join(', ')}`

  const { text: ai, error, provider } = await callLLM(system, user, k)

  let titles = heuristicTitles(meta)
  let optimizedDescription = meta.description || ''
  const tags = [...new Set([...(meta.tags || []), 'youtube', 'seo', 'монетизация'])]
  const issues: string[] = []

  if (ai) {
    const parts = ai.split(/\n\s*\n/)
    titles = parseTitles(parts[0] || ai, meta)
    if (parts.length > 1) optimizedDescription = parts.slice(1).join('\n\n').trim()
    if (provider) issues.push(`LLM: ${provider}`)
  } else {
    issues.push(error || 'LLM недоступен')
    issues.push('Показаны названия от реальной темы видео (не общий mock-список)')
  }

  if (!meta.title || meta.title.length < 20) issues.push('Короткое название')
  if (!meta.description || meta.description.length < 100) issues.push('Тонкое описание')
  if (!(meta.tags || []).length) issues.push('Мало тегов')

  const score = Math.min(
    98,
    55 +
      (meta.title?.length > 30 ? 10 : 0) +
      ((meta.description?.length || 0) > 200 ? 12 : 0) +
      ((meta.tags?.length || 0) > 5 ? 8 : 0) +
      (ai ? 12 : 0)
  )

  return { meta, score, titles, optimizedDescription, tags, issues }
}

/** aliases used by older imports */
export const runFullAudit = runAudit

export async function checkRisk(text: string, keys?: ApiKeys): Promise<RiskResult> {
  const lower = text.toLowerCase()
  const findings: RiskFinding[] = []

  for (const w of dangerousWords) {
    if (lower.includes(w.word.toLowerCase())) {
      findings.push({
        word: w.word,
        reason: w.reason,
        severity: (w as any).severity || 'medium',
      })
    }
  }

  const k = keys || loadKeys()
  if (k.openai && text.length > 40) {
    const { text: ai } = await callLLM(
      'Ты эксперт YouTube Advertiser-Friendly. Верни ТОЛЬКО JSON-массив: [{"word":"...","reason":"...","severity":"low|medium|high"}]',
      text.slice(0, 3000),
      k
    )
    if (ai) {
      try {
        const m = ai.match(/\[[\s\S]*\]/)
        if (m) {
          const json = JSON.parse(m[0])
          if (Array.isArray(json)) {
            for (const item of json) {
              if (item?.word)
                findings.push({
                  word: String(item.word),
                  reason: String(item.reason || 'AI'),
                  severity: (item.severity as RiskFinding['severity']) || 'medium',
                })
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  const high = findings.filter(f => f.severity === 'high').length
  const med = findings.filter(f => f.severity === 'medium').length
  let level: RiskResult['level'] = 'green'
  let score = 12
  if (high > 0 || med > 3) {
    level = 'red'
    score = 70 + high * 8
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
        ? 'Безопасно для полной монетизации'
        : level === 'yellow'
          ? 'Умеренный риск — правьте выделенное'
          : 'Высокий риск ограничения монетизации',
  }
}

export const analyzeRisk = checkRisk
