/**
 * YooKassa (ЮKassa) — payments in RUB for Russia & CIS
 * Docs: https://yookassa.ru/developers/api
 * Supports: bank cards, SBP, YooMoney, SberPay
 */
import { Router } from 'express'
import { randomBytes, randomUUID } from 'crypto'
import { upsertLicense, type LicenseTier } from '../store/licenses.js'
import { query } from '../db/pool.js'

const router = Router()

export const RUB_PLANS: Record<
  string,
  { tier: LicenseTier; maxChannels: number; amountRub: number; title: string }
> = {
  pro: { tier: 'pro', maxChannels: 10, amountRub: 2900, title: 'VRAV Tube Engine — Pro (1 month)' },
  agency: { tier: 'agency', maxChannels: 100, amountRub: 9900, title: 'VRAV Tube Engine — Agency (1 month)' },
}

function genKey(tier: LicenseTier): string {
  return `${tier}_${randomBytes(6).toString('hex')}`
}

function shopAuthHeader(): string | null {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secret = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secret) return null
  return 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64')
}

router.get('/prices', (_req, res) => {
  res.json({
    currency: 'RUB',
    region: 'RU/CIS',
    methods: ['bank_card', 'sbp', 'yoo_money', 'sberbank'],
    plans: Object.entries(RUB_PLANS).map(([id, p]) => ({
      id,
      tier: p.tier,
      name: p.tier === 'pro' ? 'Pro' : 'Agency',
      price: p.amountRub,
      currency: 'RUB',
      interval: 'month',
      features:
        p.tier === 'pro'
          ? ['10 channels', 'History', 'API access']
          : ['100 channels', 'White-label', 'Priority support'],
    })),
    yookassaConfigured: Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY),
  })
})

router.post('/checkout', async (req, res) => {
  const auth = shopAuthHeader()
  if (!auth) {
    return res.status(503).json({
      error: 'YooKassa not configured',
      hint: 'Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY in server/.env',
    })
  }

  const { email, planId, successUrl, cancelUrl } = req.body || {}
  const plan = RUB_PLANS[planId as string]
  if (!email || !plan) {
    return res.status(400).json({ error: 'email and planId (pro|agency) required' })
  }

  const returnUrl =
    successUrl ||
    process.env.YOOKASSA_RETURN_URL ||
    'http://localhost:5173/?paid=1&provider=yookassa'
  const idempotenceKey = randomUUID()

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify({
        amount: { value: plan.amountRub.toFixed(2), currency: 'RUB' },
        capture: true,
        confirmation: { type: 'redirect', return_url: returnUrl },
        description: plan.title,
        metadata: {
          email: String(email),
          planId: String(planId),
          tier: plan.tier,
          maxChannels: String(plan.maxChannels),
        },
        receipt: {
          customer: { email: String(email) },
          items: [
            {
              description: plan.title,
              quantity: '1.00',
              amount: { value: plan.amountRub.toFixed(2), currency: 'RUB' },
              vat_code: Number(process.env.YOOKASSA_VAT_CODE || 1),
              payment_mode: 'full_payment',
              payment_subject: 'service',
            },
          ],
        },
      }),
    })

    const data = (await response.json()) as any
    if (!response.ok) {
      console.error('YooKassa error', data)
      return res.status(response.status).json({
        error: data?.description || data?.message || 'YooKassa payment create failed',
        details: data,
      })
    }

    res.json({
      url: data?.confirmation?.confirmation_url,
      paymentId: data.id,
      status: data.status,
      amount: data.amount,
      cancelUrl: cancelUrl || null,
    })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: e.message || 'YooKassa checkout failed' })
  }
})

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body
    const type = event?.event || event?.type
    const obj = event?.object

    if (type === 'payment.succeeded' && obj?.status === 'succeeded') {
      const email = obj.metadata?.email || obj.receipt?.customer?.email
      const planId = obj.metadata?.planId || 'pro'
      const plan = RUB_PLANS[planId] || RUB_PLANS.pro
      const key = genKey(plan.tier)

      upsertLicense({
        key,
        tier: plan.tier,
        active: true,
        maxChannels: plan.maxChannels,
        ownerEmail: email,
        createdAt: new Date().toISOString(),
      })

      if (email) {
        const db = await query(
          `INSERT INTO users (email, stripe_customer_id)
           VALUES ($1, $2)
           ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
           RETURNING id`,
          [email, obj.id || null]
        )
        if (db?.rows?.[0]) {
          await query(
            `INSERT INTO licenses (key, user_id, tier, max_channels, stripe_subscription_id, active)
             VALUES ($1, $2, $3, $4, $5, true)`,
            [key, db.rows[0].id, plan.tier, plan.maxChannels, obj.id || null]
          )
        }
      }

      console.log('YooKassa license issued:', key, 'for', email, 'payment', obj.id)
    }

    res.status(200).json({ received: true })
  } catch (e: any) {
    console.error('yookassa webhook', e)
    res.status(200).json({ received: true, error: e.message })
  }
})

export default router
