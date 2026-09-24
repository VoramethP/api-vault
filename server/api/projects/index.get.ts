import { asc, eq } from 'drizzle-orm'
import { keys, projectKeys, projects } from '../../db/schema'
import type { ProjectListItem } from '../../../shared/vault'

export default defineEventHandler(async (event): Promise<ProjectListItem[]> => {
  await requireOwner(event)
  return withDb(async (db) => {
    const rows = await db.select({ id: projects.id, name: projects.name }).from(projects).orderBy(asc(projects.name))
    const links = await db.select({ projectId: projectKeys.projectId, keyId: projectKeys.keyId, label: keys.label, envVar: projectKeys.envVar })
      .from(projectKeys).innerJoin(keys, eq(keys.id, projectKeys.keyId)).orderBy(asc(projectKeys.envVar))
    return rows.map(p => ({ ...p, keys: links.filter(l => l.projectId === p.id).map(({ keyId, label, envVar }) => ({ keyId, label, envVar })) }))
  })
})
