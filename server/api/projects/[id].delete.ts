import { eq } from 'drizzle-orm'
import { projects } from '../../db/schema'
import { idParam } from '../../../shared/vault'

// ลบโปรเจกต์ = ลบแค่การผูก (cascade) · Key ยังอยู่
export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  const [row] = await withDb(db => db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id }))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'ไม่พบโปรเจกต์' })
  return { id: row.id }
})
