import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import {
  getLicense,
  upsertLicense,
  featuresForTier,
  resolveWhiteLabel,
  type LicenseTier,
  type WhiteLabelConfig,
} from '../store/licenses.js'

const router = Router()

router.get('/', (req, res) => {
  const auth = req as AuthRequest
  const key = (req.headers['x-api-key'] as string) || auth.userId
  const lic = getLicense(key)

  if (!lic || !lic.active) {
    return res.json({
      userId: auth.userId,
      tier: 'trial' as LicenseTier,
      valid: true,
      features: featuresForTier('trial'),
      whiteLabel: resolveWhiteLabel(),
      maxChannels: 1,
      message: 'Trial mode. Enter a license key in Settings for Pro/Agency.',
    })
  }

  if (lic.expiresAt && new Date(lic.expiresAt) < new Date()) {
    return res.status(403).json({ error: 'License expired', tier: lic.tier, valid: false })
  }

  res.json({
    userId: auth.userId,
    key: lic.key,
    tier: lic.tier,
    valid: true,
    features: featuresForTier(lic.tier),
    whiteLabel: resolveWhiteLabel(lic),
    maxChannels: lic.maxChannels,
    expiresAt: lic.expiresAt,
  })
})

router.post('/activate', (req, res) => {
  const { key } = req.body || {}
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'key required' })
  }
  const lic = getLicense(key.trim())
  if (!lic || !lic.active) {
    return res.status(404).json({ error: 'Invalid or inactive license key' })
  }
  if (lic.expiresAt && new Date(lic.expiresAt) < new Date()) {
    return res.status(403).json({ error: 'License expired' })
  }
  res.json({
    ok: true,
    tier: lic.tier,
    features: featuresForTier(lic.tier),
    whiteLabel: resolveWhiteLabel(lic),
    maxChannels: lic.maxChannels,
  })
})

router.put('/whitelabel', (req, res) => {
  const key = (req.headers['x-api-key'] as string) || ''
  const lic = getLicense(key)
  if (!lic || lic.tier !== 'agency') {
    return res.status(403).json({ error: 'White-label available on Agency plan only' })
  }

  const body = (req.body || {}) as Partial<WhiteLabelConfig>
  const next: WhiteLabelConfig = {
    appName: body.appName || lic.whiteLabel?.appName || 'VRAV Tube Engine',
    logoUrl: body.logoUrl ?? lic.whiteLabel?.logoUrl,
    primaryColor: body.primaryColor || lic.whiteLabel?.primaryColor || '#a855f7',
    accentColor: body.accentColor || lic.whiteLabel?.accentColor || '#3b82f6',
    youtubeRed: body.youtubeRed || lic.whiteLabel?.youtubeRed || '#ff0000',
    supportEmail: body.supportEmail ?? lic.whiteLabel?.supportEmail,
    customDomain: body.customDomain ?? lic.whiteLabel?.customDomain,
  }

  lic.whiteLabel = next
  upsertLicense(lic)

  res.json({ ok: true, whiteLabel: next })
})

export default router
