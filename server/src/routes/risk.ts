import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { addHistory } from '../store/history.js'

const router = Router()

const DANGEROUS = [
  { word: 'убить', reason: 'Насилие / угроза' },
  { word: 'смерть', reason: 'Шок-контент' },
  { word: 'наркотики', reason: 'Запрещённые вещества' },
  { word: 'суицид', reason: 'Самоповреждение' },
  { word: 'блять', reason: 'Мат (сильный)' },
  { word: 'пиздец', reason: 'Мат' },
  { word: 'хуй', reason: 'Мат' },
  { word: 'ебать', reason: 'Мат' },
  { word: 'терроризм', reason: 'Экстремизм' },
  { word: 'взрыв', reason: 'Опасный контент' },
  { word: 'кровь', reason: 'Графика' },
  { word: 'порно', reason: 'Взрослый контент' },
]

router.post('/', async (req, res) => {
  try {
    const { text, llmKey, model = 'gpt-4o-mini' } = req.body || {}
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' })
    }

    const lower = text.toLowerCase()
    const findings: { word: string; reason: string; severity: string }[] = []

    for (const d of DANGEROUS) {
      if (lower.includes(d.word.toLowerCase())) {
        findings.push({
          word: d.word,
          reason: d.reason,
          severity:
            d.reason.toLowerCase().includes('мат') || d.reason.includes('сильный')
              ? 'high'
              : d.reason.includes('Шок') || d.reason.includes('Насилие')
                ? 'medium'
                : 'low',
        })
      }
    }

    const llm = llmKey || process.env.ROUTERAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || ''
    if (llm && text.length > 30) {
      try {
        let resLlm = await fetch('https://routerai.ru/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${llm}`,
            'HTTP-Referer': 'https://vrav.tube',
            'X-Title': 'VRAV Tube Engine',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'Ты эксперт YouTube Advertiser-Friendly. Найди риски жёлтого значка. JSON: {"findings":[{"word":"...","reason":"...","severity":"low|medium|high"}],"summary":"..."}',
              },
              { role: 'user', content: text.slice(0, 3000) },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        })
        if (!resLlm.ok) resLlm = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${llm}`,
            'HTTP-Referer': 'https://vrav.tube',
            'X-Title': 'VRAV Tube Engine',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'Ты эксперт YouTube Advertiser-Friendly. Найди риски жёлтого значка. JSON: {"findings":[{"word":"...","reason":"...","severity":"low|medium|high"}],"summary":"..."}',
              },
              { role: 'user', content: text.slice(0, 3000) },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        })
        if (resLlm.ok) {
          const data = await resLlm.json() as any
          const raw = data?.choices?.[0]?.message?.content || ''
          const m = raw.match(/\{[\s\S]*\}/)
          if (m) {
            const parsed = JSON.parse(m[0])
            if (Array.isArray(parsed.findings)) {
              for (const f of parsed.findings) {
                if (!findings.some(x => x.word === f.word)) findings.push(f)
              }
            }
          }
        }
      } catch {
        // ignore
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

    const result = { score, level, findings, summary }
    const auth = req as AuthRequest
    addHistory(auth.userId, 'risk', text.slice(0, 200), result)

    res.json(result)
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: e.message || 'Risk analysis failed' })
  }
})

export default router
