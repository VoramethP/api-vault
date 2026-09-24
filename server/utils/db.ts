import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

// resolve ต่อ request เสมอ ห้ามมี db ระดับ module (ADR-0005)
// prepare:false เพราะ transaction pooler (6543) ไม่รองรับ prepared statements
export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL is not set' })
  return drizzle({ client: postgres(url, { prepare: false, max: 1 }) })
}
