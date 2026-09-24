import { projectKeys } from '../../../db/schema'
import { idParam, projectKeyInput } from '../../../../shared/vault'

/** ผูก Key เข้าโปรเจกต์ หรือเปลี่ยนชื่อ env var ของ Key ที่ผูกอยู่แล้ว */
export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  const body = await readValidatedBody(event, projectKeyInput.parse)
  try {
    await withDb(db => db.insert(projectKeys).values({ projectId: id, keyId: body.keyId, envVar: body.envVar })
      .onConflictDoUpdate({ target: [projectKeys.projectId, projectKeys.keyId], set: { envVar: body.envVar } }))
  }
  catch (e) {
    if (isUniqueViolation(e, 'project_keys_env_var_key')) throw createError({ statusCode: 409, statusMessage: `${body.envVar} ถูกใช้ในโปรเจกต์นี้แล้ว` })
    // FK ล้ม = โปรเจกต์หรือ Key ไม่มีอยู่
    if ((e as { cause?: { code?: string } }).cause?.code === '23503') throw createError({ statusCode: 404, statusMessage: 'ไม่พบโปรเจกต์หรือ Key' })
    throw e
  }
  return { ok: true }
})
