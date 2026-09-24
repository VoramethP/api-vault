import type { SOURCE } from '../../shared/entry'

type Source = typeof SOURCE[number]
export interface HttpError { statusCode: number, statusMessage: string }

/**
 * แก้/ลบได้เฉพาะ Entry ที่เจ้าของเพิ่มเอง — Entry จาก public-apis ถูก `db:import` upsert ทับทุกครั้ง
 * ถ้าแก้ได้ การแก้จะหายเงียบ ๆ ตอนนำเข้ารอบหน้า (ADR-0007)
 */
export function manualOnly(row: { source: Source } | undefined): HttpError | null {
  if (!row) return { statusCode: 404, statusMessage: 'ไม่พบ Entry' }
  if (row.source !== 'manual') return { statusCode: 403, statusMessage: 'Entry จาก public-apis แก้หรือลบไม่ได้ — แก้ได้เฉพาะที่เพิ่มเอง' }
  return null
}

/** Key ผูกกับ Entry ด้วย FK restrict — บอกเหตุผลก่อนให้ DB ปฏิเสธ จะได้รู้ว่าต้องทำอะไรต่อ */
export function deleteBlocked(keyCount: number): HttpError | null {
  return keyCount > 0 ? { statusCode: 409, statusMessage: `มี Key ผูกอยู่ ${keyCount} ตัว — ลบ Key ใน Vault ก่อน` } : null
}

export function duplicateError(existingId: number): HttpError & { data: { id: number } } {
  return { statusCode: 409, statusMessage: `มี Entry ชื่อและ URL นี้แล้ว (#${existingId})`, data: { id: existingId } }
}
