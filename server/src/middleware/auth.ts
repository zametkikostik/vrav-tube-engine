import type { Request, Response, NextFunction } from 'express'
import { getLicense, type LicenseTier } from '../store/licenses.js'

export interface AuthRequest extends Request {
  userId: string
  licenseKey: string
  licenseTier: LicenseTier
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = ((req.headers['x-api-key'] as string) || '').trim()
  const headerUser = ((req.headers['x-user-id'] as string) || '').trim()

  const lic = apiKey ? getLicense(apiKey) : undefined
  const tier: LicenseTier = lic?.active ? lic.tier : 'trial'
  const userId = headerUser || apiKey || 'anonymous'

  ;(req as AuthRequest).userId = userId
  ;(req as AuthRequest).licenseKey = apiKey
  ;(req as AuthRequest).licenseTier = tier
  next()
}
