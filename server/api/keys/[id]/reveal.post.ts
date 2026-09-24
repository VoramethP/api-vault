import { eq } from 'drizzle-orm'
import { keys } from '../../../db/schema'
import { open } from '../../../vault/crypto'
import { reveal } from '../../../vault/reveal'
import { idParam } from '../../../../shared/vault'

// ADR-0002: Reveal = TOTP ใหม่ทุกครั้ง + audit ก่อนคืนค่า · ลำดับทั้งหมดอยู่ใน server/vault/reveal.ts (มีเทส)
export default defineEventHandler(async (event) => {
  const { claims } = await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  const master = masterKey()
  const result = await withDb(db => reveal({
    amr: claims.amr as Parameters<typeof reveal>[0]['amr'],
    nowS: Math.floor(Date.now() / 1000),
    load: async () => {
      const [row] = await db.select().from(keys).where(eq(keys.id, id))
      return row ? { label: row.label, decrypt: () => open(row, master) } : null
    },
    // กินรหัส + audit ต้องสำเร็จพร้อมกัน ไม่งั้นรหัสถูกเผาทิ้งโดยไม่มีบันทึก หรือมีบันทึกโดยรหัสยังใช้ซ้ำได้
    audit: ({ keyLabel, totpAt }) => db.transaction(async (tx) => {
      await consumeTotp(tx, totpAt)
      await writeAudit(tx, event, { keyId: id, keyLabel, action: 'reveal', totpAt })
    }),
  }))
  if (!result.ok) throw createError({ statusCode: result.status, statusMessage: result.message })
  return { value: result.value }
})
