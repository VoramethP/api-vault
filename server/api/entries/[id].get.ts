import { eq } from 'drizzle-orm'
import { entries } from '../../db/schema'
import { entryIdParam } from '../../../shared/entry'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, entryIdParam.parse)
  const [row] = await withDb(db => db.select({
    id: entries.id, name: entries.name, url: entries.url, description: entries.description,
    categories: entries.categories, auth: entries.auth, https: entries.https, cors: entries.cors, source: entries.source,
  }).from(entries).where(eq(entries.id, id)))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'ไม่พบ Entry' })
  return row
})
