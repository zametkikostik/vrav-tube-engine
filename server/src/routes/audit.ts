import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { addHistory } from '../store/history.js'

const router = Router()

function parseVideoId(url: string): string | null {
  try {
    if (/^[\w-]{11}$/.test(url.trim())) return url.trim()
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0]
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2]
  } catch {}
  return null
}

async function fetchYoutubeMeta(videoId: string, apiKey: string) {
  const endpoint =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=snippet,statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`YouTube API ${res.status}`)
  const data = await res.json() as any
  const item = data?.items?.[0]
  if (!item) throw new Error('Video not found')
  const sn = item.snippet || {}
  const st = item.statistics || {}
  return {
    id: item.id,
    title: sn.title || '',
    description: sn.description || '',
    tags: sn.tags || [],
    channelTitle: sn.channelTitle || '',
    channelId: sn.channelId || '',
    publishedAt: sn.publishedAt || '',
    viewCount: st.viewCount,
    likeCount: st.likeCount,
    thumbnail: sn.thumbnails?.high?.url || sn.thumbnails?.default?.url,
  }
}

async function callLLM(system: string, user: string, apiKey: string, model: string) {
  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.8,
    max_tokens: 1200,
  }

  const endpoints = [
    {
      url: 'https://routerai.ru/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://vrav.tube',
        'X-Title': 'VRAV Tube Engine',
      } as Record<string, string>,
    },
    {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://vrav.tube',
        'X-Title': 'VRAV Tube Engine',
      },
    },
    {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: { ...body, model: model.startsWith('gpt') ? model : 'gpt-4o-mini' },
    },
  ]

  let lastErr = ''
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: ep.headers,
        body: JSON.stringify((ep as any).body || body),
      })
      if (res.ok) {
        const data = (await res.json()) as any
        const text = data?.choices?.[0]?.message?.content?.trim()
        if (text) return text
      } else {
        lastErr = `${res.status} ${await res.text()}`
      }
    } catch (e: any) {
      lastErr = e.message
    }
  }
  throw new Error(`LLM failed: ${lastErr.slice(0, 200)}`)
}

function localTitles(title: string, count = 8) {
  const topic = title.replace(/\s+/g, ' ').trim().slice(0, 55) || 'YouTube'
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
  return templates.slice(0, count).map((t, i) => ({
    title: t.slice(0, 100),
    score: 92 - i * 2,
    reason: 'Local',
  }))
}

function localDescription(title: string) {
  return `🔥 ${title}\n\nВ этом выпуске — разбор темы без кликбейта и с пользой для монетизации.\n\n⏱️ Таймкоды:\n0:00 — Введение\n1:30 — Главная идея\n4:00 — Практика\n8:00 — Ошибки, которых стоит избегать\n12:00 — Итоги и следующие шаги\n\n#YouTube #SEO #Монетизация #Контент`
}

router.post('/', async (req, res) => {
  try {
    const { url, youtubeKey, llmKey, model = 'gpt-4o-mini' } = req.body || {}
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url required' })
    }

    const videoId = parseVideoId(url)
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' })

    const ytKey = youtubeKey || process.env.YOUTUBE_API_KEY || ''
    let meta: any
    if (ytKey) {
      try {
        meta = await fetchYoutubeMeta(videoId, ytKey)
      } catch (e: any) {
        meta = {
          id: videoId,
          title: 'Видео (meta недоступна)',
          description: '',
          tags: [],
          channelTitle: '',
          channelId: '',
          publishedAt: new Date().toISOString(),
        }
      }
    } else {
      meta = {
        id: videoId,
        title: 'Как заработать на YouTube в 2026 году полное руководство',
        description: 'В этом видео о монетизации и AdSense.',
        tags: ['youtube', 'монетизация'],
        channelTitle: 'Demo Channel',
        channelId: 'demo',
        publishedAt: new Date().toISOString(),
        viewCount: '10000',
        likeCount: '500',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      }
    }

    const llm = llmKey || process.env.ROUTERAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || ''
    let titles: any[]
    let optimizedDescription: string

    if (llm) {
      try {
        const titlesRaw = await callLLM(
          'Ты эксперт по YouTube SEO. Честные кликабельные названия на русском, 40–70 символов. Только JSON: [{"title":"...","score":0-100}]',
          `Тема: ${meta.title}\nОписание: ${(meta.description || '').slice(0, 500)}\nСгенерируй 8 вариантов.`,
          llm,
          model
        )
        const m = titlesRaw.match(/\[[\s\S]*\]/)
        titles = m ? JSON.parse(m[0]) : localTitles(meta.title)
        optimizedDescription = await callLLM(
          'Ты YouTube SEO-копирайтер. Описание на русском: хук, таймкоды, хэштеги. Без обмана.',
          `Название: ${meta.title}\nОписание: ${(meta.description || '').slice(0, 800)}`,
          llm,
          model
        )
        if (!optimizedDescription || optimizedDescription.length < 50) {
          optimizedDescription = localDescription(meta.title)
        }
      } catch {
        titles = localTitles(meta.title)
        optimizedDescription = localDescription(meta.title)
      }
    } else {
      titles = localTitles(meta.title)
      optimizedDescription = localDescription(meta.title)
    }

    let score = 55
    if (meta.title?.length > 40 && meta.title.length < 70) score += 10
    if ((meta.description || '').length > 200) score += 10
    if ((meta.tags || []).length >= 5) score += 8
    if ((meta.description || '').includes('#')) score += 5
    score = Math.min(95, score)

    const issues: string[] = []
    if ((meta.title || '').length < 30) issues.push('Название слишком короткое')
    if ((meta.description || '').length < 150) issues.push('Описание слишком короткое')
    if (!(meta.description || '').match(/\d{1,2}:\d{2}/)) issues.push('Нет таймкодов')
    if ((meta.tags || []).length < 5) issues.push('Мало тегов')

    const result = {
      meta,
      score,
      titles: (titles || []).slice(0, 8).map((t: any, i: number) => ({
        title: String(t.title || '').slice(0, 100),
        score: Number(t.score) || 90 - i * 2,
        reason: t.reason || 'LLM',
      })),
      optimizedDescription,
      tags: [...new Set([...(meta.tags || []), 'youtube 2026', 'монетизация', 'seo'])],
      issues,
    }

    const auth = req as AuthRequest
    addHistory(auth.userId, 'audit', url, result)

    res.json(result)
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: e.message || 'Audit failed' })
  }
})

export default router
