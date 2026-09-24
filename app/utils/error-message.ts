/** ข้อความจาก createError ของ server — ไม่โชว์ stack หรือ URL (ไม่มีอะไรลับใน statusMessage ของเรา) */
export function errorMessage(e: unknown, fallback = 'ไม่สำเร็จ ลองใหม่'): string {
  const err = e as { data?: { statusMessage?: string, message?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || err?.data?.message || fallback
}
