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

  const provider = (keys.provider || 'routerai') as LlmProvider
  const order: LlmProvider[] = [provider, 'routerai', 'openrouter', 'openai']
    .filter((v, i, a) => a.indexOf(v) === i)

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
      if (res.ok) {
        const data = await res.json()
        const text = data?.choices?.[0]?.message?.content?.trim()
        if (text) return text
      }
    } catch (e) {
      console.warn(`LLM ${p} failed:`, e)
    }
  }
  return null
}

function localTitles(meta: VideoMeta, count = 8): TitleSuggestion[] {
  const topic = (meta.title || 'YouTube').replace(/\s+/g, ' ').trim().slice(0, 55)
  const templates = [
    `${topic}: что изменилось в 2026`,
    `Как не потерять монетизацию: ${topic}`,
    `${topic} — полный разбор без воды`,
    `Я проверил ${topic} на практике`,
    `Почему ${topic} режет RPM (и как чинить)`,
    `${topic}: чек-лист за 10 минут`,
    `Скрытые ошибки в ${topic}`,
    `${topic} — рабочая схема роста`,
  ]
  return templates.slice(0, count).map((title, i) => ({
    title: title.slice(0, 100),
    score: 92 - i * 2,
    reason: 'Локальная генерация',
  }))
}

function localDescription(meta: VideoMeta): string {
  const title = meta.title || 'видео'
  return `🔥 ${title}

В этом выпуске — разбор темы без кликбейта и с пользой для монетизации.

⏱️ Таймкоды:
0:00 — Введение
1:30 — Главная идея
4:00 — Практика
8:00 — Ошибки, которых стоит избегать
12:00 — Итоги и следующие шаги

#YouTube #SEO #Монетизация #Контент`
}

export async function generateTitles(meta: VideoMeta, count = 8): Promise<TitleSuggestion[]> {
  const keys = loadKeys()
  if (keys.openai) {
    const system =
      'Ты эксперт по YouTube SEO и CTR. Генерируй кликабельные, но честные названия на русском. Без обмана, 40–70 символов. Только JSON: [{"title":"...","score":0-100}]'
    const user = `Тема: ${meta.title}\nОписание: ${meta.description.slice(0, 500)}\nСгенерируй ${count} вариантов.`
    const raw = await callLLM(system, user, keys)
    if (raw) {
      try {
        const m = raw.match(/\[[\s\S]*\]/)
        if (m) {
          const parsed = JSON.parse(m[0]) as TitleSuggestion[]
          if (Array.isArray(parsed) && parsed.length) {
            return parsed.slice(0, count).map((t, i) => ({
              title: String(t.title || '').slice(0, 100),
              score: Number(t.score) || 90 - i * 2,
              reason: 'LLM',
            }))
          }
        }
      } catch {
        // fallback
      }
    }
  }
  if (meta?.title) return localTitles(meta, count)
  return mockTitles.slice(0, count).map(t => ({ ...t, reason: 'Mock' }))
}

export async function generateDescription(meta: VideoMeta): Promise<string> {
  const keys = loadKeys()
  if (keys.openai) {
    const raw = await callLLM(
      'Ты YouTube SEO-копирайтер. Пиши описание на русском: хук, ценность, таймкоды, хэштеги. Без обмана.',
      `Название: ${meta.title}\nОписание: ${meta.description.slice(0, 800)}`,
      keys
    )
    if (raw && raw.length > 80) return raw
  }
  return localDescription(meta)
}

export async function runFullAudit(url: string, apiKey?: string): Promise<AuditResult> {
  const meta = await fetchVideoMeta(url, apiKey)
  const [titles, optimizedDescription] = await Promise.all([
    generateTitles(meta),
    generateDescription(meta),
  ])

  let score = 55
  if (meta.title.length > 40 && meta.title.length < 70) score += 10
  if (meta.description.length > 200) score += 10
  if (meta.tags.length >= 5) score += 8
  if (meta.description.includes('#')) score += 5
  score = Math.min(95, score)

  const issues: string[] = []
  if (meta.title.length < 30) issues.push('Название слишком короткое')
  if (meta.description.length < 150) issues.push('Описание слишком короткое')
  if (!meta.description.match(/\d{1,2}:\d{2}/)) issues.push('Нет таймкодов')
  if (meta.tags.length < 5) issues.push('Мало тегов')

  return {
    meta,
    score,
    titles,
    optimizedDescription,
    tags: [...new Set([...meta.tags, 'youtube 2026', 'монетизация', 'жёлтый значок', 'rpm', 'adsense'])],
    issues,
  }
}

export async function analyzeRisk(text: string): Promise<RiskResult> {
  await new Promise(r => setTimeout(r, 800))

  const lower = text.toLowerCase()
  const findings: RiskFinding[] = []

  for (const d of dangerousWords) {
    if (lower.includes(d.word.toLowerCase())) {
      findings.push({
        word: d.word,
        reason: d.reason,
        severity:
          d.reason.toLowerCase().includes('мат') || d.reason.toLowerCase().includes('сильный')
            ? 'high'
            : d.reason.includes('Шок') || d.reason.includes('Насилие')
              ? 'medium'
              : 'low',
      })
    }
  }

  const keys = loadKeys()
  if (keys.openai && text.length > 20) {
    const raw = await callLLM(
      'Ты эксперт по YouTube Advertiser-Friendly guidelines. Найди риски жёлтого значка. Ответь JSON: {"findings":[{"word":"...","reason":"...","severity":"low|medium|high"}],"summary":"..."}',
      text.slice(0, 3000),
      keys
    )
    if (raw) {
      try {
        const m = raw.match(/\{[\s\S]*\}/)
        if (m) {
          const parsed = JSON.parse(m[0]) as { findings?: RiskFinding[]; summary?: string }
          if (parsed.findings?.length) {
            for (const f of parsed.findings) {
              if (!findings.some(x => x.word === f.word)) findings.push(f)
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  const highCount = findings.filter(f => f.severity === 'high').length
  const mediumCount = findings.filter(f => f.severity === 'medium').length
  let score = 100 - (highCount * 25 + mediumCount * 12 + (findings.length - highCount - mediumCount) * 6)
  score = Math.max(5, Math.min(100, score))

  let level: 'green' | 'yellow' | 'red' = 'green'
  if (score < 40 || highCount >= 2) level = 'red'
  else if (score < 75 || findings.length > 0) level = 'yellow'

  const summary =
    level === 'green'
      ? 'Текст выглядит безопасно для полной монетизации.'
      : level === 'yellow'
        ? 'Есть умеренные риски. Рекомендуется отредактировать выделенные места.'
        : 'Высокий риск жёлтого/красного значка. Обязательно исправьте перед публикацией.'

  return { score, level, findings, summary }
}
