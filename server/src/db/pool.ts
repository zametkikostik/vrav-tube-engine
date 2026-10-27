/**
 * Postgres pool. If DATABASE_URL is missing — returns null (in-memory mode).
 */
import pg from 'pg'

let pool: pg.Pool | null = null

export function getPool(): pg.Pool | null {
  if (pool) return pool
  const url = process.env.DATABASE_URL
  if (!url) return null
  pool = new pg.Pool({ connectionString: url, max: 10 })
  return pool
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T> | null> {
  const p = getPool()
  if (!p) return null
  return p.query<T>(text, params)
}
