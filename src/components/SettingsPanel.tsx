import { useState, useEffect } from 'react'
import { Key } from 'lucide-react'
import { loadKeys, saveKeys } from '../services/keys'
import {
  fetchLicense,
  activateLicense,
  saveWhiteLabel,
  getStoredLicenseKey,
  applyWhiteLabel,
  startCheckout,
  startYookassaCheckout,
  fetchPlans,
  fetchYookassaPlans,
  type LicenseInfo,
  type WhiteLabelConfig,
} from '../services/license'
import type { ApiKeys } from '../services/types'
import { useI18n, localeLabels, type Locale } from '../i18n'

type PayCurrency = 'USD' | 'RUB'

export function SettingsPanel() {
  const { t, locale, setLocale } = useI18n()
  const [keys, setKeys] = useState<ApiKeys>(() => loadKeys())
  const [saved, setSaved] = useState(false)
  const [licKey, setLicKey] = useState(() => getStoredLicenseKey())
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [licMsg, setLicMsg] = useState('')
  const [licLoading, setLicLoading] = useState(false)
  const [wl, setWl] = useState<Partial<WhiteLabelConfig>>({})
  const [email, setEmail] = useState(() => localStorage.getItem('vrav_email') || '')
  const [buyLoading, setBuyLoading] = useState<'pro' | 'agency' | null>(null)
  const [buyMsg, setBuyMsg] = useState('')
  const [stripeOk, setStripeOk] = useState(false)
  const [yookassaOk, setYookassaOk] = useState(false)
  const [currency, setCurrency] = useState<PayCurrency>(() =>
    (localStorage.getItem('vrav_pay_currency') as PayCurrency) || 'RUB'
  )
  const [usdPlans, setUsdPlans] = useState<{ id: string; tier: string; name: string; price: number }[]>([])
  const [rubPlans, setRubPlans] = useState<{ id: string; tier: string; name: string; price: number }[]>([])

  useEffect(() => {
    fetchLicense().then(info => {
      if (info) {
        setLicense(info)
        setWl(info.whiteLabel || {})
      }
    })
    fetchPlans().then(data => {
      if (data?.plans) setUsdPlans(data.plans)
      setStripeOk(Boolean(data?.stripeConfigured))
    })
    fetchYookassaPlans().then(data => {
      if (data?.plans) setRubPlans(data.plans)
      setYookassaOk(Boolean(data?.yookassaConfigured))
    })
  }, [])

  const setPayCurrency = (c: PayCurrency) => {
    setCurrency(c)
    localStorage.setItem('vrav_pay_currency', c)
  }

  const handleSave = () => {
    saveKeys(keys)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleActivate = async () => {
    setLicLoading(true)
    setLicMsg('')
    const res = await activateLicense(licKey.trim())
    setLicLoading(false)
    if (res.ok) {
      setLicMsg(t.license.activated + ': ' + (res.info?.tier || 'ok'))
      if (res.info) {
        setLicense(res.info)
        setWl(res.info.whiteLabel || {})
      }
    } else {
      setLicMsg(res.error || t.common.error)
    }
  }

  const priceLabel = (tier: 'pro' | 'agency') => {
    if (currency === 'RUB') {
      const p = rubPlans.find(x => x.tier === tier)
      const amount = p?.price ?? (tier === 'pro' ? 2900 : 9900)
      return `${amount.toLocaleString('ru-RU')} ₽`
    }
    const p = usdPlans.find(x => x.tier === tier)
    const amount = p?.price ?? (tier === 'pro' ? 29 : 99)
    return `$${amount}`
  }

  const handleBuy = async (tier: 'pro' | 'agency') => {
    const mail = email.trim()
    if (!mail || !mail.includes('@')) {
      setBuyMsg(t.settings.email + '…')
      return
    }
    localStorage.setItem('vrav_email', mail)
    setBuyLoading(tier)
    setBuyMsg(currency === 'RUB' ? t.settings.redirectingYookassa : t.settings.redirecting)
    try {
      if (currency === 'RUB') {
        await startYookassaCheckout(mail, tier)
      } else {
        const priceId =
          usdPlans.find(p => p.tier === tier)?.id ||
          (tier === 'agency' ? 'price_agency' : 'price_pro')
        await startCheckout(mail, priceId)
      }
    } catch (e: any) {
      setBuyMsg(e?.message || t.settings.checkoutError)
      setBuyLoading(null)
    }
  }

  const handleWlSave = async () => {
    const res = await saveWhiteLabel(wl)
    if (res.ok) {
      applyWhiteLabel({
        appName: wl.appName || 'VRAV Tube Engine',
        primaryColor: wl.primaryColor || '#a855f7',
        accentColor: wl.accentColor || '#3b82f6',
        logoUrl: wl.logoUrl,
        supportEmail: wl.supportEmail,
        customDomain: wl.customDomain,
      })
    }
  }

  const tierBadge =
    license?.tier === 'agency'
      ? 'bg-cyan-500/20 text-cyan-300'
      : license?.tier === 'pro'
        ? 'bg-purple-500/20 text-purple-300'
        : 'bg-white/10 text-gray-400'

  const payReady = currency === 'RUB' ? yookassaOk : stripeOk

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t.settings.title}</h2>
        <p className="text-gray-400 text-sm">{t.settings.subtitle}</p>
      </div>
      <div className="glass rounded-2xl p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-400">{t.settings.language}</span>
        <div className="flex gap-2">
          {(['en', 'ru', 'bg'] as Locale[]).map(l => (
            <button key={l} onClick={() => setLocale(l)} className={`px-3 py-1.5 rounded-lg text-sm transition ${locale === l ? 'bg-purple-600/40 text-white border border-purple-500/40' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {localeLabels[l]}
            </button>
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Key size={16} className="text-purple-400" />{t.settings.license}</h3>
          {license && <span className={`text-xs px-2.5 py-1 rounded-full uppercase font-medium ${tierBadge}`}>{license.tier}</span>}
        </div>
        <p className="text-xs text-gray-500">Demo: <code className="text-purple-300">trial_demo</code> · <code className="text-purple-300">pro_demo_2026</code> · <code className="text-purple-300">agency_demo_2026</code></p>
        <div className="flex gap-2">
          <input value={licKey} onChange={e => setLicKey(e.target.value)} placeholder="license_key" className="flex-1 bg-[#12121f] border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
          <button onClick={handleActivate} disabled={licLoading} className="px-4 py-2.5 btn-brand rounded-xl text-sm font-medium disabled:opacity-60">{licLoading ? t.settings.activating : t.settings.activate}</button>
        </div>
        {licMsg && <p className="text-sm text-gray-300">{licMsg}</p>}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <h4 className="font-medium text-sm">{t.settings.buyTitle}</h4>
          <p className="text-xs text-gray-500">{t.settings.buySubtitle}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPayCurrency('RUB')} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${currency === 'RUB' ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/5 text-gray-400'}`}>₽ {t.settings.payRub}</button>
            <button type="button" onClick={() => setPayCurrency('USD')} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${currency === 'USD' ? 'border-blue-500/50 bg-blue-500/15 text-blue-300' : 'border-white/10 bg-white/5 text-gray-400'}`}>$ {t.settings.payUsd}</button>
          </div>
          {currency === 'RUB' && <p className="text-xs text-gray-500">{t.settings.yookassaHint}</p>}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.settings.email} className="w-full bg-[#12121f] border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => handleBuy('pro')} disabled={buyLoading !== null} className="py-3 rounded-xl text-sm font-medium bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50">{buyLoading === 'pro' ? t.settings.redirecting : `${t.settings.buyPro} · ${priceLabel('pro')}${t.settings.perMonth}`}</button>
            <button onClick={() => handleBuy('agency')} disabled={buyLoading !== null} className="py-3 rounded-xl text-sm font-medium bg-cyan-600/80 hover:bg-cyan-600 disabled:opacity-50">{buyLoading === 'agency' ? t.settings.redirecting : `${t.settings.buyAgency} · ${priceLabel('agency')}${t.settings.perMonth}`}</button>
          </div>
          {!payReady && <p className="text-xs text-amber-400/90">{currency === 'RUB' ? t.settings.yookassaOffline : t.settings.stripeOffline}</p>}
          {buyMsg && <p className="text-sm text-gray-300">{buyMsg}</p>}
        </div>
      </div>
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold">{t.settings.apiKeys}</h3>
        <div><label className="block text-sm mb-2">{t.settings.youtubeKey}</label><input value={keys.youtube || ''} onChange={e => setKeys(k => ({ ...k, youtube: e.target.value }))} className="w-full bg-[#12121f] border border-white/10 rounded-xl px-4 py-2.5 text-sm" placeholder="AIza..." /></div>
        <div><label className="block text-sm mb-2">{t.settings.llmKey}</label><input value={keys.openai || ''} onChange={e => setKeys(k => ({ ...k, openai: e.target.value }))} className="w-full bg-[#12121f] border border-white/10 rounded-xl px-4 py-2.5 text-sm" placeholder="RouterAI / OpenRouter / OpenAI key" /></div>
        <div><label className="block text-sm mb-2">LLM Provider</label><select value={keys.provider || 'routerai'} onChange={e => setKeys(k => ({ ...k, provider: e.target.value as any }))} className="w-full bg-[#12121f] border border-white/10 rounded-xl px-4 py-2.5 text-sm"><option value="routerai">RouterAI (routerai.ru)</option><option value="openrouter">OpenRouter</option><option value="openai">OpenAI</option></select></div>
        <button onClick={handleSave} className="px-4 py-2.5 btn-brand rounded-xl text-sm font-medium">{saved ? t.settings.saved : t.settings.saveKeys}</button>
      </div>
      {license?.features.whiteLabel && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">{t.settings.whiteLabel}</h3>
          <input value={wl.appName || ''} onChange={e => setWl(w => ({ ...w, appName: e.target.value }))} placeholder={t.settings.productName} className="w-full bg-[#12121f] border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
          <div className="flex gap-3">
            <input type="color" value={wl.primaryColor || '#a855f7'} onChange={e => setWl(w => ({ ...w, primaryColor: e.target.value }))} className="h-10 w-14 bg-transparent" />
            <input type="color" value={wl.accentColor || '#3b82f6'} onChange={e => setWl(w => ({ ...w, accentColor: e.target.value }))} className="h-10 w-14 bg-transparent" />
          </div>
          <button onClick={handleWlSave} className="px-4 py-2.5 btn-brand rounded-xl text-sm font-medium">{t.settings.saveWl}</button>
        </div>
      )}
    </div>
  )
}
