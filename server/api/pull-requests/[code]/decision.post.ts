import { and, eq, gt } from 'drizzle-orm'
import { pullRequests } from '../../../db/schema'
import { normalizeUserCode, pullDecision } from '../../../../shared/cli'
import { checkFreshTotp } from '../../../../shared/vault'

// อนุมัติ = การ Reveal ทั้งโปรเจกต์ล่วงหน้า → ต้องใช้ TOTP สดแบบเดียวกับ Reveal และกินรหัสทิ้ง · ปฏิเสธไม่ต้องใช้ TOTP
export default defineEventHandler(async (event) => {
  const { claims } = await requireOwner(event)
  const code = normalizeUserCode(getRouterParam(event, 'code') ?? '')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'รหัสไม่ถูกต้อง' })
  const { approve } = await readValidatedBody(event, pullDecision.parse)

  let totpAt: Date | undefined
  if (approve) {
    const fresh = checkFreshTotp(claims.amr as Parameters<typeof checkFreshTotp>[0], Math.floor(Date.now() / 1000))
    if (!fresh.ok) throw createError({ statusCode: 403, statusMessage: fresh.message })
    totpAt = new Date(fresh.totpAt * 1000)
  }

  return withDb(db => db.transaction(async (tx) => {
    const now = new Date()
    const [row] = await tx.update(pullRequests)
      .set({ status: approve ? 'approved' : 'denied', decidedAt: now, totpAt })
      .where(and(eq(pullRequests.userCode, code), eq(pullRequests.status, 'pending'), gt(pullRequests.expiresAt, now)))
      .returning({ id: pullRequests.id })
    if (!row) throw createError({ statusCode: 409, statusMessage: 'คำขอนี้หมดอายุหรือตัดสินไปแล้ว' })
    if (totpAt) await consumeTotp(tx, totpAt)
    return { status: approve ? 'approved' : 'denied' }
  }))
})
