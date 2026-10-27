import { randomUUID } from 'crypto'

export interface HistoryItem {
  id: string
  userId: string
  type: 'audit' | 'risk'
  input: string
  result: unknown
  createdAt: string
}

const items: HistoryItem[] = []
const MAX = 200

export function addHistory(userId: string, type: HistoryItem['type'], input: string, result: unknown): HistoryItem {
  const item: HistoryItem = {
    id: randomUUID(),
    userId,
    type,
    input,
    result,
    createdAt: new Date().toISOString(),
  }
  items.unshift(item)
  if (items.length > MAX) items.length = MAX
  return item
}

export function listHistory(userId: string, limit = 50): HistoryItem[] {
  return items.filter(i => i.userId === userId).slice(0, limit)
}

export function getHistory(id: string, userId: string): HistoryItem | undefined {
  return items.find(i => i.id === id && i.userId === userId)
}
