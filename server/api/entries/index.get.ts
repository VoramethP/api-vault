import { asc } from 'drizzle-orm'
import { entries } from '../../db/schema'
import type { CatalogueEntry } from '../../../shared/entry'

// ทั้ง Catalogue ครั้งเดียว (~90 KB gzip) — เบราว์เซอร์เก็บไว้แล้วกรองเอง ไม่ต้องกลับมาถามทุกครั้งที่เปลี่ยนตัวกรอง
export default defineEventHandler(async (event): Promise<CatalogueEntry[]> => {
  await requireOwner(event)
  return withDb(db => db.select({
    id: entries.id, name: entries.name, url: entries.url, description: entries.description,
    categories: entries.categories, auth: entries.auth, https: entries.https, cors: entries.cors, source: entries.source,
  }).from(entries).orderBy(asc(entries.name)))
})
