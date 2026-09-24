/**
 * error ของ auth-js ตอน verify TOTP → ข้อความที่บอกได้ว่าต้องทำอะไรต่อ
 * ข้อความรวม ๆ ข้อความเดียวทำให้แยกไม่ออกว่ารหัสผิด หมดรอบ หรือโดน rate limit
 */
export function totpErrorMessage(err: { code?: string, message?: string, status?: number }): string {
  switch (err.code) {
    case 'mfa_verification_failed': return 'รหัสไม่ถูกต้อง — รอรหัสรอบใหม่ในแอปแล้วพิมพ์ทันที (เช็กว่าเวลาในมือถือตั้งอัตโนมัติ)'
    case 'mfa_challenge_expired': return 'หมดเวลายืนยัน ลองใหม่อีกครั้ง'
    case 'over_request_rate_limit': return 'ลองบ่อยเกินไป รอสักครู่แล้วค่อยลองใหม่'
    case 'mfa_verification_rejected': return 'Supabase ปฏิเสธการยืนยัน ลองใหม่อีกครั้ง'
    default: return `ยืนยัน TOTP ไม่สำเร็จ: ${err.message || err.code || `HTTP ${err.status ?? '?'}`}`
  }
}
