import { eq } from 'drizzle-orm'
import { keys } from '../../db/schema'
import { idParam } from '../../../shared/vault'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  return withDb(db => db.transaction(async (tx) => {
    const [row] = await tx.delete(keys).where(eq(keys.id, id)).returning({ id: keys.id, label: keys.label })
    if (!row) throw createError({ statusCode: 404, statusMessage: 'ไม่พบ Key' })
    await writeAudit(tx, event, { keyId: row.id, keyLabel: row.label, action: 'delete' })
    return { id: row.id }
  }))
})
