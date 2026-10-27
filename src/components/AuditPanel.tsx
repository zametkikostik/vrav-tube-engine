import { useState } from 'react'
import { Loader2, Copy, Sparkles, MessageSquare } from 'lucide-react'
import { auditVideo } from '../services/api'
import type { AuditResult } from '../services/types'
import { useI18n } from '../i18n'

export function AuditPanel() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [url, setUrl] = useState('https://youtube.com/watch?v=dQw4w9WgXcQ')
  const [error, setError] = useState('')

  const runAudit = async () => {
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const data = await auditVideo(url)
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Ошибка аудита')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string) => navigator.clipboard?.writeText(text)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t.audit.title}</h2>
        <p className="text-gray-400 text-sm">{t.audit.subtitle}</p>
      </div>
      <div className="glass rounded-2xl p-5 flex gap-3">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="flex-1 bg-[#12121f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50"
          placeholder={t.dashboard.placeholder}
        />
        <button
          onClick={runAudit}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-medium text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? t.audit.analyzing : t.audit.analyze}
        </button>
      </div>
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-red-300 text-sm">{error}</div>
      )}
      {loading && (
        <div className="space-y-4">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      )}
      {result && !loading && (
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1f2937" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#g)" strokeWidth="3" strokeDasharray={`${result.score}, 100`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{result.score}</span>
            </div>
            <div>
              <p className="text-sm text-gray-400">{t.audit.score}</p>
              <p className="text-lg font-semibold mt-1 truncate max-w-md">{result.meta?.title || 'Видео'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {result.issues?.length ? result.issues.join(' · ') : t.audit.noIssues}
              </p>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              {t.audit.titles}
            </h3>
            <div className="space-y-2">
              {result.titles.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition group">
                  <span className="text-xs font-mono text-purple-400 w-6">{i + 1}</span>
                  <p className="flex-1 text-sm">{item.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{item.score}</span>
                  <button onClick={() => copy(item.title)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition">
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-400" />
                {t.audit.description}
              </h3>
              <button onClick={() => copy(result.optimizedDescription)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition flex items-center gap-1">
                <Copy size={12} /> {t.audit.copy}
              </button>
            </div>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed bg-[#0d0d18] rounded-xl p-4 border border-white/5">
              {result.optimizedDescription}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
