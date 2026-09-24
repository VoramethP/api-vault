import { eq } from 'drizzle-orm'
import { entries } from '../../db/schema'
import { manualOnly } from '../../entries/rules'
import { entryIdParam, manualEntryUpdate } from '../../../shared/entry'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, entryIdParam.parse)
  const body = await readValidatedBody(event, manualEntryUpdate.parse)
  return withDb(async (db) => {
    const [row] = await db.select({ source: entries.source, name: entries.name, url: entries.url }).from(entries).where(eq(entries.id, id))
    const denied = manualOnly(row)
    if (denied) throw createError(denied)
    await assertNoDuplicate(db, body.name ?? row!.name, body.url ?? row!.url, id)
    try {
      await db.update(entries).set({ ...body, updatedAt: new Date() }).where(eq(entries.id, id))
      return { id }
    }
    catch (e) {
      if (isUniqueViolation(e, 'entries_name_url_key')) throw createError({ statusCode: 409, statusMessage: 'มี Entry ชื่อและ URL นี้แล้ว' })
      throw e
    }
  })
})
