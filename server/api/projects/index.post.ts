import { projects } from '../../db/schema'
import { projectCreate } from '../../../shared/vault'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const body = await readValidatedBody(event, projectCreate.parse)
  try {
    const [row] = await withDb(db => db.insert(projects).values(body).returning({ id: projects.id }))
    return { id: row!.id }
  }
  catch (e) {
    if (isUniqueViolation(e)) throw createError({ statusCode: 409, statusMessage: `มีโปรเจกต์ชื่อ ${body.name} แล้ว` })
    throw e
  }
})
