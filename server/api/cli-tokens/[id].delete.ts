import { and, eq, isNull } from 'drizzle-orm'
import { cliTokens } from '../../db/schema'
import { idParam } from '../../../shared/vault'

// เพิกถอน ไม่ลบแถว — ประวัติคำขอ Pull ยังชี้กลับมาได้ว่าเครื่องไหน
export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  const [row] = await withDb(db => db.update(cliTokens).set({ revokedAt: new Date() })
    .where(and(eq(cliTokens.id, id), isNull(cliTokens.revokedAt))).returning({ id: cliTokens.id }))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'ไม่พบ token หรือถูกเพิกถอนไปแล้ว' })
  return { id: row.id }
})
