import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth.js'
import auditRouter from './routes/audit.js'
import riskRouter from './routes/risk.js'
import historyRouter from './routes/history.js'
import licenseRouter from './routes/license.js'
import stripeRouter from './routes/stripe.js'
import yookassaRouter from './routes/yookassa.js'

const app = express()
const PORT = Number(process.env.PORT) || 8787

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'vrav-tube-engine', version: '0.2.0' })
})

app.use(authMiddleware)

app.use('/api/audit', auditRouter)
app.use('/api/risk', riskRouter)
app.use('/api/history', historyRouter)
app.use('/api/license', licenseRouter)
app.use('/api/stripe', stripeRouter)
app.use('/api/yookassa', yookassaRouter)

app.listen(PORT, () => {
  console.log(`VRAV API listening on http://localhost:${PORT}`)
  console.log('Demo keys: trial_demo | pro_demo_2026 | agency_demo_2026')
})
