import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { checkRisk } from '../services/api'
import type { RiskResult } from '../services/types'
import { useI18n } from '../i18n'

export function MonetizationPanel() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RiskResult | null>(null)

  const run = async () => {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    try {
      setResult(await checkRisk(text))
    } finally {
      setLoading(false)
    }
  }

  const bar =
    result?.level === 'green' ? 'risk-green' : result?.level === 'yellow' ? 'risk-yellow' : 'risk-red'

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t.risk.title}</h2>
        <p className="text-gray-400 text-sm">{t.risk.subtitle}</p>
      </div>
      <div className="glass rounded-2xl p-6 space-y-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={8}
          placeholder={t.risk.placeholder}
          className="w-full bg-[#12121f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 resize-y"
        />
        <button
          onClick={run}
          disabled={loading || !text.trim()}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-medium text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? t.risk.checking : t.risk.check}
        </button>
      </div>
      {result && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{t.risk.summary}</span>
            <span className="text-2xl font-bold">{result.score}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
            <div className={`h-full ${bar}`} style={{ width: `${result.score}%` }} />
          </div>
          <p className="text-sm text-gray-300">
            {result.level === 'green' ? t.risk.green : result.level === 'yellow' ? t.risk.yellow : t.risk.red}
          </p>
          {result.findings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t.risk.findings}</p>
              {result.findings.map((f, i) => (
                <div key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-white/5">
                  <span className="font-mono text-amber-300">{f.word}</span>
                  <span className="text-gray-400">{f.reason}</span>
                  <span className="ml-auto text-xs uppercase text-gray-500">{f.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
