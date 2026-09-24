import { cliTokens } from '../../db/schema'
import { CLI_TOKEN_TTL_DAYS, tokenCreate } from '../../../shared/cli'

// token ตัวจริงออกจาก server ครั้งเดียวตรงนี้ — DB เก็บแค่ hash
export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const body = await readValidatedBody(event, tokenCreate.parse)
  const token = newCliToken()
  const expiresAt = new Date(Date.now() + CLI_TOKEN_TTL_DAYS * 86_400_000)
  await withDb(db => db.insert(cliTokens).values({ name: body.name, tokenHash: hashCliToken(token), expiresAt }))
  return { token, expiresAt: expiresAt.toISOString() }
})
