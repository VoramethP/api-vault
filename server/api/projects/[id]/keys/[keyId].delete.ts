import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { projectKeys } from '../../../../db/schema'

const params = z.object({ id: z.coerce.number().int().positive(), keyId: z.coerce.number().int().positive() })

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id, keyId } = await getValidatedRouterParams(event, params.parse)
  const rows = await withDb(db => db.delete(projectKeys)
    .where(and(eq(projectKeys.projectId, id), eq(projectKeys.keyId, keyId))).returning({ keyId: projectKeys.keyId }))
  if (!rows.length) throw createError({ statusCode: 404, statusMessage: 'Key นี้ไม่ได้อยู่ในโปรเจกต์' })
  return { ok: true }
})
