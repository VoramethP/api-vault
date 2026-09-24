import { entries } from '../../db/schema'
import { manualEntryInput } from '../../../shared/entry'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const body = await readValidatedBody(event, manualEntryInput.parse)
  return withDb(async (db) => {
    await assertNoDuplicate(db, body.name, body.url)
    try {
      // tags = null = ยังไม่ตัดสิน · Tag อัตโนมัติมาพร้อม Jev ใน V1.1 (ADR-0007)
      const [row] = await db.insert(entries).values({ ...body, source: 'manual' }).returning({ id: entries.id })
      return { id: row!.id }
    }
    catch (e) {
      // เช็กซ้ำแล้วยังชน = มีคนเพิ่มตัวเดียวกันระหว่างนั้น
      if (isUniqueViolation(e, 'entries_name_url_key')) throw createError({ statusCode: 409, statusMessage: 'มี Entry ชื่อและ URL นี้แล้ว' })
      throw e
    }
  })
})
