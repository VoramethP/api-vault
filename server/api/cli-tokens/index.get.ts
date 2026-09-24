import { desc } from 'drizzle-orm'
import { cliTokens } from '../../db/schema'
import type { CliTokenItem } from '../../../shared/cli'

export default defineEventHandler(async (event): Promise<CliTokenItem[]> => {
  await requireOwner(event)
  const rows = await withDb(db => db.select({
    id: cliTokens.id, name: cliTokens.name, createdAt: cliTokens.createdAt, expiresAt: cliTokens.expiresAt,
    lastUsedAt: cliTokens.lastUsedAt, revokedAt: cliTokens.revokedAt,
  }).from(cliTokens).orderBy(desc(cliTokens.createdAt)))
  const iso = (d: Date | null) => d?.toISOString() ?? null
  return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), expiresAt: r.expiresAt.toISOString(), lastUsedAt: iso(r.lastUsedAt), revokedAt: iso(r.revokedAt) }))
})
