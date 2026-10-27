import type { VideoMeta } from './types'

export function parseYoutubeUrl(url: string): { type: 'video' | 'channel' | 'unknown'; id: string } {
  try {
    const cleaned = url.trim()
    if (/^[\w-]{11}$/.test(cleaned)) {
      return { type: 'video', id: cleaned }
    }
    const u = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`)
    if (u.hostname.includes('youtu.be')) {
      return { type: 'video', id: u.pathname.slice(1).split('/')[0] }
    }
    if (u.searchParams.get('v')) {
      return { type: 'video', id: u.searchParams.get('v')! }
    }
    if (u.pathname.startsWith('/shorts/')) {
      return { type: 'video', id: u.pathname.split('/')[2] }
    }
    if (u.pathname.startsWith('/@')) {
      return { type: 'channel', id: u.pathname.slice(2).split('/')[0] }
    }
    if (u.pathname.startsWith('/channel/')) {
      return { type: 'channel', id: u.pathname.split('/')[2] }
    }
    if (u.pathname.startsWith('/c/') || u.pathname.startsWith('/user/')) {
      return { type: 'channel', id: u.pathname.split('/')[2] }
    }
  } catch {
    // ignore
  }
  return { type: 'unknown', id: '' }
}

function mockVideoMeta(id: string): VideoMeta {
  return {
    id: id || 'dQw4w9WgXcQ',
    title: 'Как заработать на YouTube в 2026 году полное руководство',
    description:
      'В этом видео я расскажу всё о монетизации, AdSense, жёлтом значке и как поднять RPM. Подписывайтесь!',
    tags: ['youtube', 'монетизация', 'adsense', 'заработок'],
    channelTitle: 'Tech Insights RU',
    channelId: 'UC_mock_channel',
    publishedAt: '2026-09-15T10:00:00Z',
    viewCount: '124500',
    likeCount: '8900',
    thumbnail: `https://i.ytimg.com/vi/${id || 'dQw4w9WgXcQ'}/hqdefault.jpg`,
  }
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function fetchVideoMeta(url: string, apiKey?: string): Promise<VideoMeta> {
  const parsed = parseYoutubeUrl(url)
  let key = apiKey || ''
  try {
    key = key || (import.meta as any).env?.VITE_YOUTUBE_API_KEY || ''
  } catch {
    // ignore
  }

  if (!key || parsed.type !== 'video' || !parsed.id) {
    await delay(500)
    return mockVideoMeta(parsed.id)
  }

  try {
    const endpoint =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=snippet,statistics&id=${encodeURIComponent(parsed.id)}&key=${encodeURIComponent(key)}`

    const res = await fetch(endpoint)
    if (!res.ok) {
      console.warn('YouTube API error:', res.status, await res.text())
      await delay(300)
      return mockVideoMeta(parsed.id)
    }

    const data = await res.json()
    const item = data?.items?.[0]
    if (!item) {
      await delay(300)
      return mockVideoMeta(parsed.id)
    }

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
  } catch (err) {
    console.warn('YouTube fetch failed, using mock:', err)
    await delay(300)
    return mockVideoMeta(parsed.id)
  }
}
