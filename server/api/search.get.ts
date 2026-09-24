import { and, arrayContains, asc, eq, type SQL } from 'drizzle-orm'
import { entries } from '../db/schema'
import { getRanker } from '../ranker'
import { searchQuery, type SearchResponse } from '../../shared/entry'

export default defineEventHandler(async (event): Promise<SearchResponse> => {
  await requireOwner(event)
  const query = await getValidatedQuery(event, searchQuery.parse)
  const rows = await withDb(async (db) => {
    const where: SQL[] = []
    if (query.category) where.push(arrayContains(entries.categories, [query.category]))
    if (query.auth) where.push(eq(entries.auth, query.auth))
    if (query.https !== undefined) where.push(eq(entries.https, query.https))
    if (query.cors) where.push(eq(entries.cors, query.cors))
    return db.select({
      id: entries.id, name: entries.name, url: entries.url, description: entries.description,
      categories: entries.categories, auth: entries.auth, https: entries.https, cors: entries.cors, source: entries.source,
    }).from(entries).where(and(...where)).orderBy(asc(entries.name))
  })

  if (!query.q) {
    return { kind: 'browse', ranker: null, confidence: null, candidates: rows.length, hits: rows.slice(0, query.limit).map(entry => ({ entry, score: null })) }
  }

  const ranker = getRanker()
  const result = await ranker.rank(query.q, rows, { limit: query.limit })
  if (result.kind === 'no_match') {
    return { kind: 'no_match', ranker: ranker.name, confidence: result.confidence, candidates: rows.length, hits: [] }
  }
  const byId = new Map(rows.map(r => [r.id, r]))
  return {
    kind: 'match',
    ranker: ranker.name,
    confidence: result.confidence,
    candidates: rows.length,
    hits: result.hits.map(h => ({ entry: byId.get(h.entryId)!, score: h.score })),
  }
})
