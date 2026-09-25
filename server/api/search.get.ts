import { entries } from '../db/schema'
import { getRanker } from '../ranker'
import { searchQuery, type SearchResponse } from '../../shared/entry'

// จัดอันดับทั้งคลังแล้วคืนแค่ id + คะแนน — ตัวกรองซ้ายทำในเบราว์เซอร์กับ Catalogue ที่โหลดไว้ (ไม่ตัด limit
// เพราะถ้าตัดก่อนกรอง ผลที่ตรงตัวกรองแต่อันดับต่ำจะหายไป)
export default defineEventHandler(async (event): Promise<SearchResponse> => {
  await requireOwner(event)
  const { q } = await getValidatedQuery(event, searchQuery.parse)
  const rows = await withDb(db => db.select({
    id: entries.id, name: entries.name, description: entries.description,
    categories: entries.categories, auth: entries.auth, https: entries.https, cors: entries.cors,
  }).from(entries))

  const ranker = getRanker()
  const result = await ranker.rank(q, rows, { limit: rows.length })
  return {
    kind: result.kind,
    ranker: ranker.name,
    confidence: result.confidence,
    candidates: rows.length,
    hits: result.kind === 'match' ? result.hits : [],
  }
})
