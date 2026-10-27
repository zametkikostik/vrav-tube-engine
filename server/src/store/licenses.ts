/**
 * MVP license store (in-memory).
 * Production: Postgres / Stripe Customer Portal.
 */

export type LicenseTier = 'trial' | 'pro' | 'agency'

export interface WhiteLabelConfig {
  appName: string
  logoUrl?: string
  primaryColor: string
  accentColor: string
  youtubeRed?: string
  supportEmail?: string
  customDomain?: string
}

export interface LicenseRecord {
  key: string
  tier: LicenseTier
  ownerEmail?: string
  active: boolean
  expiresAt?: string
  maxChannels: number
  whiteLabel?: WhiteLabelConfig
  createdAt: string
}

const DEFAULT_WL: WhiteLabelConfig = {
  appName: 'VRAV Tube Engine',
  primaryColor: '#a855f7',
  accentColor: '#3b82f6',
  youtubeRed: '#ff0000',
}

const licenses = new Map<string, LicenseRecord>([
  ['trial_demo', { key: 'trial_demo', tier: 'trial', active: true, maxChannels: 1, createdAt: new Date().toISOString() }],
  ['pro_demo_2026', { key: 'pro_demo_2026', tier: 'pro', active: true, maxChannels: 10, createdAt: new Date().toISOString() }],
  ['agency_demo_2026', {
    key: 'agency_demo_2026', tier: 'agency', active: true, maxChannels: 100,
    whiteLabel: {
      appName: 'Agency Tube Suite', primaryColor: '#22d3ee', accentColor: '#a78bfa',
      youtubeRed: '#ef4444', supportEmail: 'support@agency.example',
    },
    createdAt: new Date().toISOString(),
  }],
])

export function getLicense(key: string): LicenseRecord | undefined {
  if (!key) return undefined
  return licenses.get(key)
}

export function upsertLicense(rec: LicenseRecord): void {
  licenses.set(rec.key, rec)
}

export function listLicenses(): LicenseRecord[] {
  return Array.from(licenses.values())
}

export function featuresForTier(tier: LicenseTier) {
  return {
    audit: true,
    risk: true,
    history: true,
    multiChannel: tier !== 'trial',
    advancedRisk: tier !== 'trial',
    whiteLabel: tier === 'agency',
    apiAccess: tier === 'agency' || tier === 'pro',
    prioritySupport: tier === 'agency',
  }
}

export function resolveWhiteLabel(lic?: LicenseRecord): WhiteLabelConfig {
  if (lic?.tier === 'agency' && lic.whiteLabel) {
    return { ...DEFAULT_WL, ...lic.whiteLabel }
  }
  return { ...DEFAULT_WL }
}

export { DEFAULT_WL }
