// auth-js มีชนิด AuthenticatorAssuranceLevels กว้างกว่านี้ — รับเป็น string แล้วเทียบค่าเอา
export type Aal = string | null

// หน้าที่เข้าได้โดยไม่ล็อกอิน (ADR-0004: เดโมและ /about เป็นสาธารณะ · /docs = runbook ซึ่งอยู่ใน repo public อยู่แล้ว)
export const PUBLIC_PATHS = ['/login', '/confirm', '/about', '/docs', '/demo', '/demo/*']

export function isPublic(path: string): boolean {
  return PUBLIC_PATHS.some(p => p.endsWith('/*') ? path.startsWith(p.slice(0, -1)) : path === p)
}

/**
 * หน้าไหนต้องพาไปก่อน — ใช้ใน middleware ฝั่ง client ซึ่งเป็นแค่การแสดงผล
 * การกันจริงอยู่ที่ server (requireOwner) เพราะ session ใน cookie ปลอมได้
 */
export function nextStep(path: string, session: { current: Aal, next: Aal } | null): string | null {
  if (isPublic(path)) return null
  if (!session) return '/login'
  if (session.current === 'aal2') return path.startsWith('/mfa') ? '/' : null
  // มี factor แล้วแต่ session นี้ยังไม่ผ่าน TOTP
  if (session.next === 'aal2') return path === '/mfa' ? null : '/mfa'
  // ยังไม่เคยลงทะเบียน TOTP — บังคับลงทะเบียนก่อนใช้แอป (ADR-0006)
  return path === '/mfa/enroll' ? null : '/mfa/enroll'
}

export type AccessDecision = { ok: true } | { ok: false, status: 401 | 403, message: string }

/** เจ้าของคนเดียว + ต้องผ่าน TOTP ใน session นี้ */
export function decideAccess(who: { email: string | undefined, aal: Aal } | null, ownerEmail: string): AccessDecision {
  if (!who) return { ok: false, status: 401, message: 'ต้องเข้าสู่ระบบ' }
  // ปิด sign-up แล้วก็จริง แต่ถ้ามีคนถูกเพิ่มผ่าน dashboard พลาด ๆ ต้องยังเข้าไม่ได้
  if (!who.email || who.email.toLowerCase() !== ownerEmail.toLowerCase()) return { ok: false, status: 403, message: 'ไม่ใช่บัญชีเจ้าของ' }
  if (who.aal !== 'aal2') return { ok: false, status: 403, message: 'ต้องยืนยัน TOTP ก่อน' }
  return { ok: true }
}
