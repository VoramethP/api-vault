import { and, eq, inArray } from 'drizzle-orm'
import { pullRequests } from '../../../../db/schema'
import { idParam } from '../../../../../shared/vault'

// CLI ถูกยกเลิก (Ctrl+C) → ปิดคำขอทันที ไม่ปล่อยให้ค้างจนเจ้าของเผลออนุมัติคำขอที่ไม่มีใครรอรับ
// ใช้สถานะ denied — ผลเหมือนกันคือดึงค่าไม่ได้อีก
export default defineEventHandler(async (event) => {
  const token = await requireCliToken(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  await withDb(db => db.update(pullRequests).set({ status: 'denied', decidedAt: new Date() })
    .where(and(eq(pullRequests.id, id), eq(pullRequests.tokenId, token.id), inArray(pullRequests.status, ['pending', 'approved']))))
  return { ok: true }
})
