import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { listHistory, getHistory } from '../store/history.js'

const router = Router()

router.get('/', (req, res) => {
  const auth = req as AuthRequest
  const limit = Math.min(100, Number(req.query.limit) || 50)
  res.json({ items: listHistory(auth.userId, limit) })
})

router.get('/:id', (req, res) => {
  const auth = req as AuthRequest
  const item = getHistory(req.params.id, auth.userId)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

export default router
