export default defineEventHandler(async (event) => {
  const token = await requireCliToken(event)
  return { name: token.name, expiresAt: token.expiresAt.toISOString() }
})
