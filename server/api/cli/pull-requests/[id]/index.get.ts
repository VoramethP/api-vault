import { and, eq, gt } from 'drizzle-orm'
import { keys, projectKeys, pullRequests } from '../../../../db/schema'
import { open } from '../../../../vault/crypto'
import { effectiveStatus } from '../../../../../shared/cli'
import { idParam } from '../../../../../shared/vault'

/**
 * CLI ถามผลเป็นระยะ · อนุมัติแล้ว = ได้ค่าครั้งเดียว (approved → consumed ในคำสั่งเดียว)
 * ลำดับเดียวกับ Reveal: ถอดรหัส → audit (pull, cli) → commit → คืนค่า · อะไรล้ม = rollback สถานะยังเป็น approved
 */
export default defineEventHandler(async (event) => {
  const token = await requireCliToken(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  const master = masterKey()
  return withDb(db => db.transaction(async (tx) => {
    const now = new Date()
    const [claimed] = await tx.update(pullRequests).set({ status: 'consumed' })
      .where(and(eq(pullRequests.id, id), eq(pullRequests.tokenId, token.id), eq(pullRequests.status, 'approved'), gt(pullRequests.expiresAt, now)))
      .returning({ projectId: pullRequests.projectId, totpAt: pullRequests.totpAt })
    if (!claimed) {
      const [row] = await tx.select({ status: pullRequests.status, expiresAt: pullRequests.expiresAt }).from(pullRequests)
        .where(and(eq(pullRequests.id, id), eq(pullRequests.tokenId, token.id)))
      if (!row) throw createError({ statusCode: 404, statusMessage: 'ไม่พบคำขอ' })
      return { status: effectiveStatus(row, now) }
    }
    const rows = await tx.select().from(projectKeys).innerJoin(keys, eq(keys.id, projectKeys.keyId))
      .where(eq(projectKeys.projectId, claimed.projectId))
    const values = rows.map(r => ({ envVar: r.project_keys.envVar, value: open(r.keys, master) }))
    for (const r of rows) {
      await writeAudit(tx, event, { keyId: r.keys.id, keyLabel: r.keys.label, action: 'pull', via: 'cli', totpAt: claimed.totpAt ?? undefined })
    }
    return { status: 'consumed' as const, values }
  }))
})
