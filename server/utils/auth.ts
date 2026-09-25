import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { decideAccess, type Aal } from '../../shared/auth-flow'

/**
 * กันทุก route ที่ไม่ใช่สาธารณะ — เรียกบรรทัดแรกของ handler
 * getUser() ถาม Auth server จริง (token ถูกเพิกถอน = ไม่ผ่าน) · aal อ่านจาก claims ที่ getClaims() ตรวจลายเซ็นแล้ว
 * ห้ามใช้ getSession() ตัดสินสิทธิ์ (ADR-0006)
 */
export async function requireOwner(event: H3Event) {
  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) throw createError({ statusCode: 500, statusMessage: 'OWNER_EMAIL is not set' })

  const started = performance.now()
  const client = await serverSupabaseClient(event)
  const { data: { user } } = await client.auth.getUser()
  let who: { email: string | undefined, aal: Aal } | null = null
  let claims: Record<string, unknown> | undefined
  if (user) {
    const { data } = await client.auth.getClaims()
    claims = data?.claims
    who = { email: user.email, aal: (claims?.aal as Aal) ?? null }
  }
  // เวลาถาม Auth server — ไปโผล่ใน Server-Timing (server/plugins/server-timing.ts)
  const timings: string[] = event.context.timings ??= []
  timings.push(`auth;dur=${(performance.now() - started).toFixed(1)}`)
  const decision = decideAccess(who, ownerEmail)
  if (!decision.ok) throw createError({ statusCode: decision.status, statusMessage: decision.message })
  // claims ตรวจลายเซ็นแล้ว — Reveal ใช้ amr ในนี้ดูว่าเพิ่งใส่ TOTP ไหม
  return { user: user!, claims: claims! }
}
