import type { H3Event } from 'h3'
import { auditLog } from '../db/schema'
import { loadMasterKey } from '../vault/crypto'
import type { AuditAction, AuditVia } from '../../shared/vault'

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

/** master key หาย/ผิดรูป = ตั้งค่าผิด ต้องล้มดัง ๆ · ข้อความจาก loadMasterKey ไม่มีค่าของ key อยู่แล้ว */
export function masterKey() {
  try {
    return loadMasterKey()
  }
  catch (e) {
    throw createError({ statusCode: 500, statusMessage: (e as Error).message })
  }
}

export async function writeAudit(db: Db | Tx, event: H3Event, row: {
  keyId: number | null, keyLabel: string, action: AuditAction, via?: AuditVia, totpAt?: Date
}) {
  await db.insert(auditLog).values({
    ...row,
    via: row.via ?? 'web',
    userAgent: getRequestHeader(event, 'user-agent')?.slice(0, 300) ?? null,
  })
}

/** Postgres 23505 — drizzle ห่อ error ของ driver ไว้ใน cause */
export function isUniqueViolation(e: unknown, constraint?: string): boolean {
  const err = (e as { cause?: { code?: string, constraint_name?: string } })?.cause ?? (e as { code?: string, constraint_name?: string })
  return err?.code === '23505' && (!constraint || err.constraint_name === constraint)
}
