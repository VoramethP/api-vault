import { desc } from 'drizzle-orm'
import { auditLog } from '../db/schema'
import type { AuditItem } from '../../shared/vault'

export default defineEventHandler(async (event): Promise<AuditItem[]> => {
  await requireOwner(event)
  const rows = await withDb(db => db.select({
    id: auditLog.id, keyId: auditLog.keyId, keyLabel: auditLog.keyLabel, action: auditLog.action,
    via: auditLog.via, at: auditLog.at, userAgent: auditLog.userAgent,
  }).from(auditLog).orderBy(desc(auditLog.at), desc(auditLog.id)).limit(200))
  return rows.map(r => ({ ...r, at: r.at.toISOString() }))
})
