import { eq } from 'drizzle-orm'
import { keys } from '../../db/schema'
import { seal } from '../../vault/crypto'
import { idParam, keyUpdate, last4 } from '../../../shared/vault'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  const body = await readValidatedBody(event, keyUpdate.parse)
  // หมุน Key = DEK ใหม่ + IV ใหม่ทั้งชุด ไม่ใช้ DEK เดิมซ้ำ
  const rotated = body.value === undefined ? {} : { ...seal(body.value, masterKey()), last4: last4(body.value), rotatedAt: new Date() }
  return withDb(db => db.transaction(async (tx) => {
    const [row] = await tx.update(keys).set({ ...(body.label ? { label: body.label } : {}), ...rotated })
      .where(eq(keys.id, id)).returning({ id: keys.id, label: keys.label })
    if (!row) throw createError({ statusCode: 404, statusMessage: 'ไม่พบ Key' })
    await writeAudit(tx, event, { keyId: row.id, keyLabel: row.label, action: 'update' })
    return { id: row.id }
  }))
})
