import { and, eq, ne } from 'drizzle-orm'
import { entries } from '../db/schema'
import { duplicateError } from '../entries/rules'

/** ชื่อ+URL ซ้ำ → 409 พร้อม id เดิม · ไม่ upsert ทับเพราะตัวที่ซ้ำอาจเป็น Entry จาก public-apis */
export async function assertNoDuplicate(db: Db, name: string, url: string, exceptId?: number) {
  const [dup] = await db.select({ id: entries.id }).from(entries)
    .where(and(eq(entries.name, name), eq(entries.url, url), exceptId ? ne(entries.id, exceptId) : undefined))
  if (dup) throw createError(duplicateError(dup.id))
}
