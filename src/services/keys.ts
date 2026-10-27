import type { ApiKeys } from './types'

const STORAGE_KEY = 'vrav_api_keys'

export function loadKeys(): ApiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveKeys(keys: ApiKeys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
}
