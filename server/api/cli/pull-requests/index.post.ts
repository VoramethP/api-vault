import { eq } from 'drizzle-orm'
import { projects, pullRequests } from '../../../db/schema'
import { PULL_REQUEST_TTL_S, pullCreate } from '../../../../shared/cli'

export default defineEventHandler(async (event) => {
  const token = await requireCliToken(event)
  const body = await readValidatedBody(event, pullCreate.parse)
  return withDb(async (db) => {
    const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.name, body.project))
    if (!project) throw createError({ statusCode: 404, statusMessage: `ไม่พบโปรเจกต์ ${body.project}` })
    const expiresAt = new Date(Date.now() + PULL_REQUEST_TTL_S * 1000)
    // รหัสชนกับคำขอที่รออยู่ได้ (โอกาสน้อยมาก) — สุ่มใหม่สักสองสามครั้ง
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const userCode = newUserCode()
        const [row] = await db.insert(pullRequests).values({ tokenId: token.id, projectId: project.id, userCode, expiresAt })
          .returning({ id: pullRequests.id })
        return { id: row!.id, userCode, expiresAt: expiresAt.toISOString() }
      }
      catch (e) {
        if (!isUniqueViolation(e, 'pull_requests_pending_code_key')) throw e
      }
    }
    throw createError({ statusCode: 503, statusMessage: 'สร้างรหัสไม่สำเร็จ ลองใหม่' })
  })
})
