import { z } from 'zod'

export const PULL_STATUS = ['pending', 'approved', 'denied', 'consumed'] as const
export type PullStatus = typeof PULL_STATUS[number]

export const CLI_TOKEN_TTL_DAYS = 30
/** คำขอ Pull ที่ไม่ถูกอนุมัติ/ดึงภายในเวลานี้ใช้ไม่ได้ */
export const PULL_REQUEST_TTL_S = 10 * 60
export const TOKEN_PREFIX = 'avc_'

// ไม่มีตัวที่อ่านสับสน (0/O, 1/I/L) — ผู้ใช้เทียบด้วยตาระหว่าง terminal กับหน้าเว็บ
export const USER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** รหัสจาก CLI ที่ผู้ใช้พิมพ์เอง — ไม่สนตัวเล็ก/ใหญ่ ขีด หรือช่องว่าง */
export function normalizeUserCode(input: string): string | null {
  const c = input.toUpperCase().replace(/[\s-]/g, '')
  if (c.length !== 8 || [...c].some(ch => !USER_CODE_ALPHABET.includes(ch))) return null
  return `${c.slice(0, 4)}-${c.slice(4)}`
}

/** pending/approved ที่เลยเวลาถือว่าหมดอายุ — ไม่ต้องมี job มาเปลี่ยนสถานะ */
export function effectiveStatus(row: { status: PullStatus, expiresAt: Date }, now: Date): PullStatus | 'expired' {
  if ((row.status === 'pending' || row.status === 'approved') && row.expiresAt <= now) return 'expired'
  return row.status
}

export const tokenCreate = z.object({ name: z.string().trim().min(1, 'ตั้งชื่อเครื่อง').max(60) })
export const pullCreate = z.object({ project: z.string().trim().min(1).max(64) })
export const pullDecision = z.object({ approve: z.boolean() })

export interface CliTokenItem {
  id: number
  name: string
  createdAt: string
  expiresAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export interface PullRequestView {
  userCode: string
  status: PullStatus | 'expired'
  project: string
  device: string
  createdAt: string
  expiresAt: string
  envVars: string[]
}
