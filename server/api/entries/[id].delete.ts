import { count, eq } from 'drizzle-orm'
import { entries, keys } from '../../db/schema'
import { deleteBlocked, manualOnly } from '../../entries/rules'
import { entryIdParam } from '../../../shared/entry'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, entryIdParam.parse)
  return withDb(db => db.transaction(async (tx) => {
    const [row] = await tx.select({ source: entries.source }).from(entries).where(eq(entries.id, id))
    const denied = manualOnly(row)
    if (denied) throw createError(denied)
    const [{ n }] = await tx.select({ n: count() }).from(keys).where(eq(keys.entryId, id)) as [{ n: number }]
    const blocked = deleteBlocked(n)
    if (blocked) throw createError(blocked)
    await tx.delete(entries).where(eq(entries.id, id))
    return { id }
  }))
})
