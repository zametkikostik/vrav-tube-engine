import { Router } from 'express'
import { randomBytes } from 'crypto'
import { upsertLicense, getLicense, type LicenseTier } from '../store/licenses.js'
import { query } from '../db/pool.js'

const router = Router()

const PRICE_TO_TIER: Record<string, { tier: LicenseTier; maxChannels: number }> = {
  price_trial: { tier: 'trial', maxChannels: 1 },
  price_pro: { tier: 'pro', maxChannels: 10 },
  price_agency: { tier: 'agency', maxChannels: 100 },
}

function genKey(tier: LicenseTier): string {
  const suffix = randomBytes(6).toString('hex')
  return `${tier}_${suffix}`
}

router.post('/checkout', async (req, res) => {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return res.status(503).json({
      error: 'Stripe not configured',
      hint: 'Set STRIPE_SECRET_KEY and Price IDs in server/.env',
    })
  }

  const { email, priceId, successUrl, cancelUrl } = req.body || {}
  if (!email || !priceId) {
    return res.status(400).json({ error: 'email and priceId required' })
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secret)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'http://localhost:5173/settings?paid=1',
      cancel_url: cancelUrl || 'http://localhost:5173/settings?canceled=1',
      metadata: { priceId },
    })

    res.json({ url: session.url, sessionId: session.id })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: e.message || 'Checkout failed' })
  }
})

router.post('/webhook', async (req, res) => {
  const secret = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return res.status(503).send('Stripe not configured')

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secret)

    let event: any = req.body
    if (whSecret && req.headers['stripe-signature']) {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody || JSON.stringify(req.body),
        req.headers['stripe-signature'] as string,
        whSecret
      )
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const email = session.customer_email || session.customer_details?.email
      const priceId = session.metadata?.priceId || ''
      const map = PRICE_TO_TIER[priceId] || { tier: 'pro' as LicenseTier, maxChannels: 10 }
      const key = genKey(map.tier)

      upsertLicense({
        key,
        tier: map.tier,
        active: true,
        maxChannels: map.maxChannels,
        ownerEmail: email,
        createdAt: new Date().toISOString(),
      })

      const db = await query(
        `INSERT INTO users (email, stripe_customer_id)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id
         RETURNING id`,
        [email, session.customer || null]
      )
      if (db?.rows?.[0]) {
        await query(
          `INSERT INTO licenses (key, user_id, tier, max_channels, stripe_subscription_id, active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [key, db.rows[0].id, map.tier, map.maxChannels, session.subscription || null]
        )
      }

      console.log('License issued:', key, 'for', email)
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      await query(
        `UPDATE licenses SET active = false WHERE stripe_subscription_id = $1`,
        [sub.id]
      )
    }

    res.json({ received: true })
  } catch (e: any) {
    console.error('webhook error', e)
    res.status(400).send(`Webhook Error: ${e.message}`)
  }
})

router.get('/prices', (_req, res) => {
  res.json({
    plans: [
      {
        id: 'price_pro',
        tier: 'pro',
        name: 'Pro',
        price: 29,
        currency: 'usd',
        interval: 'month',
        features: ['10 channels', 'History', 'API access'],
      },
      {
        id: 'price_agency',
        tier: 'agency',
        name: 'Agency',
        price: 99,
        currency: 'usd',
        interval: 'month',
        features: ['100 channels', 'White-label', 'Priority support'],
      },
    ],
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  })
})

export default router
