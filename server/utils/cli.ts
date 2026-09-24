import { createHash, randomBytes, randomInt } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { cliTokens } from '../db/schema'
import { TOKEN_PREFIX, USER_CODE_ALPHABET } from '../../shared/cli'

export function hashCliToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newCliToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString('base64url')
}

export function newUserCode(): string {
  const c = Array.from({ length: 8 }, () => USER_CODE_ALPHABET[randomInt(USER_CODE_ALPHABET.length)]).join('')
  return `${c.slice(0, 4)}-${c.slice(4)}`
}

/**
 * ด่านของ route /api/cli/* — เรียกบรรทัดแรกแทน requireOwner เพราะ CLI ไม่มี session ของ Supabase
 * token ผ่าน ≠ ได้ Key — แค่ยื่นคำขอ/รอผลได้ การอนุมัติอยู่ที่เว็บ (aal2 + TOTP สด)
 */
export async function requireCliToken(event: H3Event) {
  const header = getRequestHeader(event, 'authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  // ข้อความ error ไม่สะท้อน token กลับไป
  if (!token.startsWith(TOKEN_PREFIX)) throw createError({ statusCode: 401, statusMessage: 'ต้องมี token ของ CLI (vault login)' })
  const row = await withDb(async (db) => {
    const now = new Date()
    const [r] = await db.update(cliTokens).set({ lastUsedAt: now })
      .where(and(eq(cliTokens.tokenHash, hashCliToken(token)), isNull(cliTokens.revokedAt), gt(cliTokens.expiresAt, now)))
      .returning({ id: cliTokens.id, name: cliTokens.name, expiresAt: cliTokens.expiresAt })
    return r
  })
  if (!row) throw createError({ statusCode: 401, statusMessage: 'token ไม่ถูกต้อง หมดอายุ หรือถูกเพิกถอน — สร้างใหม่ที่ /vault/cli แล้ว vault login' })
  return row
}
