import type { ElementType } from 'react'

export function MetricCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub?: string; icon: ElementType; color: string
}) {
  const colorMap: Record<string, string> = {
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-500/20',
    blue: 'from-blue-600/20 to-blue-900/10 border-blue-500/20',
    green: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/20',
  }
  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br ${colorMap[color]} border`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <div className="p-2 rounded-lg bg-white/5">
          <Icon size={16} className="text-purple-400" />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
