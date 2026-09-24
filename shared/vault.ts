import { z } from 'zod'

export const AUDIT_ACTION = ['create', 'update', 'delete', 'reveal', 'pull'] as const
export const AUDIT_VIA = ['web', 'cli'] as const
export type AuditAction = typeof AUDIT_ACTION[number]
export type AuditVia = typeof AUDIT_VIA[number]

// Key สั้นกว่านี้ → 4 ตัวท้ายคือสัดส่วนที่ใหญ่เกินไปของความลับ ไม่เก็บ
export const LAST4_MIN_LENGTH = 16

export function last4(value: string): string | null {
  return value.length >= LAST4_MIN_LENGTH ? value.slice(-4) : null
}

// Key จริงไม่มีช่องว่างหัวท้าย — ที่ติดมามักมาจากการคัดลอก และถ้าเก็บไว้จะใช้กับ API ไม่ได้
const keyValue = z.string().trim().min(1, 'ใส่ค่า Key').max(8192)
const label = z.string().trim().min(1, 'ใส่ชื่อ').max(100)

export const keyCreate = z.object({
  entryId: z.number().int().positive(),
  label,
  value: keyValue,
})

export const keyUpdate = z.object({
  label: label.optional(),
  /** มีค่า = หมุน Key (เข้ารหัสใหม่ทั้งชุด) */
  value: keyValue.optional(),
}).refine(v => v.label !== undefined || v.value !== undefined, 'ไม่มีอะไรให้แก้')

// ใช้เป็นชื่อบน command line (`vault pull <project>`) — ห้ามช่องว่างและตัวที่ shell ตีความ
export const projectName = z.string().trim().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/, 'ใช้ a-z 0-9 . _ - ขึ้นต้นด้วยตัวอักษรหรือตัวเลข')
export const projectCreate = z.object({ name: projectName })

// ชื่อตัวแปรที่ dotenv และ shell อ่านได้ทุกตัว
export const envVar = z.string().trim().regex(/^[A-Z_][A-Z0-9_]{0,127}$/, 'ใช้ A-Z 0-9 _ ขึ้นต้นด้วยตัวอักษรหรือ _')
export const projectKeyInput = z.object({ keyId: z.number().int().positive(), envVar })

export const idParam = z.object({ id: z.coerce.number().int().positive() })

/** ต้องยืนยัน TOTP มาไม่เกินกี่วินาทีก่อน Reveal — เผื่อเวลาเครื่อง Supabase กับ Vercel คลาดกัน */
export const REVEAL_TOTP_MAX_AGE_S = 120

type Amr = { method?: unknown, timestamp?: unknown }[] | undefined

export type FreshTotp = { ok: true, totpAt: number } | { ok: false, message: string }

/**
 * เวลาที่ยืนยัน TOTP ล่าสุดใน session นี้ ต้องเพิ่งเกิด — amr มาจาก JWT ที่ getClaims() ตรวจลายเซ็นแล้ว
 * การใช้ซ้ำกันด้วย unique index บน audit_log.totp_at ไม่ใช่ที่นี่
 */
export function checkFreshTotp(amr: Amr, nowS: number, maxAgeS = REVEAL_TOTP_MAX_AGE_S): FreshTotp {
  const ts = (amr ?? []).filter(a => a.method === 'totp' && typeof a.timestamp === 'number').map(a => a.timestamp as number)
  if (!ts.length) return { ok: false, message: 'ต้องยืนยัน TOTP ก่อน Reveal' }
  const totpAt = Math.max(...ts)
  if (nowS - totpAt > maxAgeS) return { ok: false, message: 'รหัส TOTP หมดเวลา ใส่รหัสใหม่' }
  // เวลาอนาคตไกล ๆ = claims ผิดปกติ ไม่ใช่เครื่องคลาดนิดหน่อย
  if (totpAt - nowS > maxAgeS) return { ok: false, message: 'เวลาใน TOTP ผิดปกติ' }
  return { ok: true, totpAt }
}

export interface KeyListItem {
  id: number
  label: string
  last4: string | null
  entry: { id: number, name: string, url: string }
  projects: { id: number, name: string, envVar: string }[]
  createdAt: string
  rotatedAt: string | null
}

export interface ProjectListItem {
  id: number
  name: string
  keys: { keyId: number, label: string, envVar: string }[]
}

export interface AuditItem {
  id: number
  keyId: number | null
  keyLabel: string
  action: AuditAction
  via: AuditVia
  at: string
  userAgent: string | null
}
