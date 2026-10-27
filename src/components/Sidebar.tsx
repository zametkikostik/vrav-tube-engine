import { LayoutDashboard, Search, Shield, Settings, Youtube } from 'lucide-react'
import { useI18n, type Locale } from '../i18n'
import type { Tab } from './types'

export function Sidebar({ active, setActive, brandName = 'VRAV Tube Engine' }: { active: Tab; setActive: (t: Tab) => void; brandName?: string }) {
  const { t, locale, setLocale } = useI18n()
  const items = [
    { id: 'dashboard' as Tab, label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'audit' as Tab, label: t.nav.audit, icon: Search },
    { id: 'monetization' as Tab, label: t.nav.monetization, icon: Shield },
    { id: 'settings' as Tab, label: t.nav.settings, icon: Settings },
  ]
  return (
    <aside className="w-64 glass border-r border-white/5 flex flex-col">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Youtube size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight truncate max-w-[140px]">{brandName}</h1>
            <select
              value={locale}
              onChange={e => setLocale(e.target.value as Locale)}
              className="mt-1 text-[10px] bg-transparent border border-white/10 rounded px-1 py-0.5 text-gray-400 w-full max-w-[140px]"
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="ru">RU</option>
              <option value="bg">BG</option>
            </select>
            <p className="text-xs text-purple-400">Engine Weave</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              active === item.id
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">{t.settings.license}</p>
          <p className="text-sm font-semibold text-purple-300">Pro Trial</p>
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">14 дней осталось</p>
        </div>
      </div>
    </aside>
  )
}
