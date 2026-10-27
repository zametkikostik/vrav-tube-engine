import { useState } from 'react'
import { BarChart3, TrendingUp, Shield, Zap } from 'lucide-react'
import { mockChannels } from '../data/mock'
import { MetricCard } from './MetricCard'
import { useI18n } from '../i18n'

export function Dashboard({ onStartAudit }: { onStartAudit: () => void }) {
  const { t } = useI18n()
  const [url, setUrl] = useState('')
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Дашборд</h2>
        <p className="text-gray-400 text-sm">AI-аудит и мониторинг здоровья каналов</p>
      </div>
      <div className="glass rounded-2xl p-6 border border-purple-500/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">Ссылка на канал или видео</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://youtube.com/@channel или /watch?v=..."
            className="flex-1 bg-[#12121f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition"
          />
          <button
            onClick={onStartAudit}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
          >
            <Zap size={16} />
            Запустить AI-Аудит
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Средний CTR превью" value="4.7%" sub="+0.8% за неделю" icon={TrendingUp} color="purple" />
        <MetricCard title="SEO-оптимизация" value="76%" sub="Хороший уровень" icon={BarChart3} color="blue" />
        <MetricCard title="Риск монетизации" value="Низкий" sub="2 предупреждения" icon={Shield} color="green" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">{t.dashboard.recent}</h3>
        <div className="space-y-3">
          {mockChannels.map(ch => (
            <div key={ch.id} className="glass rounded-xl p-4 flex items-center gap-4 hover:border-purple-500/30 border border-transparent transition cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center font-bold text-sm">
                {ch.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ch.name}</p>
                <p className="text-xs text-gray-500">{ch.handle}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-300">{ch.score}%</div>
                <p className="text-[10px] text-gray-500">Health Score</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                ch.risk === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                ch.risk === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {ch.risk === 'low' ? 'Низкий риск' : ch.risk === 'medium' ? 'Средний' : 'Высокий'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
