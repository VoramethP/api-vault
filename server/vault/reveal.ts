import { checkFreshTotp } from '../../shared/vault'

type Amr = Parameters<typeof checkFreshTotp>[0]

export interface RevealDeps {
  /** amr จาก claims ที่ตรวจลายเซ็นแล้ว */
  amr: Amr
  nowS: number
  load: () => Promise<{ label: string, decrypt: () => string } | null>
  /** ต้องล้ม (throw) ถ้า TOTP ครั้งนี้เคยใช้ Reveal ไปแล้ว — unique index ใน DB เป็นคนบังคับ */
  audit: (entry: { keyLabel: string, totpAt: Date }) => Promise<void>
}

export type RevealResult =
  | { ok: true, value: string }
  | { ok: false, status: 403 | 404, message: string }

/**
 * ลำดับสำคัญ (ADR-0002): TOTP สด → ถอดรหัส → เขียน audit → แล้วค่อยคืนค่า
 * audit ล้ม = ไม่คืนค่า · Reveal ที่ไม่มีบันทึกต้องไม่เกิดขึ้น
 */
export async function reveal(deps: RevealDeps): Promise<RevealResult> {
  const fresh = checkFreshTotp(deps.amr, deps.nowS)
  if (!fresh.ok) return { ok: false, status: 403, message: fresh.message }
  const key = await deps.load()
  if (!key) return { ok: false, status: 404, message: 'ไม่พบ Key' }
  const value = key.decrypt()
  await deps.audit({ keyLabel: key.label, totpAt: new Date(fresh.totpAt * 1000) })
  return { ok: true, value }
}
