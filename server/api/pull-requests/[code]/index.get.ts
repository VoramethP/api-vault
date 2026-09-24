import { asc, desc, eq } from 'drizzle-orm'
import { cliTokens, projectKeys, projects, pullRequests } from '../../../db/schema'
import { effectiveStatus, normalizeUserCode, type PullRequestView } from '../../../../shared/cli'

// หน้าอนุมัติต้องบอกให้ครบว่าเครื่องไหน ขอโปรเจกต์ไหน ตัวแปรอะไร — กันการกดอนุมัติคำขอที่ไม่ได้ขอเอง
export default defineEventHandler(async (event): Promise<PullRequestView> => {
  await requireOwner(event)
  const code = normalizeUserCode(getRouterParam(event, 'code') ?? '')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'รหัสต้องเป็น 8 ตัว เช่น ABCD-2345' })
  return withDb(async (db) => {
    // รหัสซ้ำได้ข้ามเวลา (unique เฉพาะที่รออยู่) — เอาคำขอล่าสุด
    const [row] = await db.select({
      id: pullRequests.id, status: pullRequests.status, expiresAt: pullRequests.expiresAt, createdAt: pullRequests.createdAt,
      projectId: projects.id, project: projects.name, device: cliTokens.name,
    }).from(pullRequests)
      .innerJoin(projects, eq(projects.id, pullRequests.projectId))
      .innerJoin(cliTokens, eq(cliTokens.id, pullRequests.tokenId))
      .where(eq(pullRequests.userCode, code)).orderBy(desc(pullRequests.id)).limit(1)
    if (!row) throw createError({ statusCode: 404, statusMessage: `ไม่พบคำขอรหัส ${code}` })
    const vars = await db.select({ envVar: projectKeys.envVar }).from(projectKeys)
      .where(eq(projectKeys.projectId, row.projectId)).orderBy(asc(projectKeys.envVar))
    return {
      userCode: code,
      status: effectiveStatus(row, new Date()),
      project: row.project,
      device: row.device,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      envVars: vars.map(v => v.envVar),
    }
  })
})
