import { asc, eq } from 'drizzle-orm'
import { entries, keys, projectKeys, projects } from '../../db/schema'
import type { KeyListItem } from '../../../shared/vault'

// ไม่ select คอลัมน์เข้ารหัสเลย — การ list ไม่ใช่ Reveal และไม่ต้องใช้ master key
export default defineEventHandler(async (event): Promise<KeyListItem[]> => {
  await requireOwner(event)
  return withDb(async (db) => {
    // สอง query ไม่ขึ้นต่อกัน — ยิงพร้อมกัน postgres.js ส่งต่อกันบน connection เดียวโดยไม่รอผลตัวแรก (pipelining)
    const [rows, links] = await Promise.all([db.select({
      id: keys.id, label: keys.label, last4: keys.last4, createdAt: keys.createdAt, rotatedAt: keys.rotatedAt,
      entry: { id: entries.id, name: entries.name, url: entries.url },
    }).from(keys).innerJoin(entries, eq(entries.id, keys.entryId)).orderBy(asc(keys.label)),
    db.select({ keyId: projectKeys.keyId, id: projects.id, name: projects.name, envVar: projectKeys.envVar })
      .from(projectKeys).innerJoin(projects, eq(projects.id, projectKeys.projectId)).orderBy(asc(projects.name))])
    return rows.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      rotatedAt: r.rotatedAt?.toISOString() ?? null,
      projects: links.filter(l => l.keyId === r.id).map(({ id, name, envVar }) => ({ id, name, envVar })),
    }))
  })
})
