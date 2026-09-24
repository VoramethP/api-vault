import { eq } from 'drizzle-orm'
import { entries, keys } from '../../db/schema'
import { seal } from '../../vault/crypto'
import { keyCreate, last4 } from '../../../shared/vault'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const body = await readValidatedBody(event, keyCreate.parse)
  const sealed = seal(body.value, masterKey())
  return withDb(async (db) => {
    const [entry] = await db.select({ id: entries.id }).from(entries).where(eq(entries.id, body.entryId))
    if (!entry) throw createError({ statusCode: 404, statusMessage: 'ไม่พบ Entry' })
    // Key กับ audit ต้องเกิดด้วยกันหรือไม่เกิดเลย
    return db.transaction(async (tx) => {
      const [row] = await tx.insert(keys).values({ entryId: body.entryId, label: body.label, last4: last4(body.value), ...sealed })
        .returning({ id: keys.id })
      await writeAudit(tx, event, { keyId: row!.id, keyLabel: body.label, action: 'create' })
      return { id: row!.id }
    })
  })
})
