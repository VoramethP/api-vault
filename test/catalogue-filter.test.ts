import { describe, expect, it } from 'vitest'
import { categoryCounts, visibleHits, type CatalogueEntry, type SearchResponse } from '../shared/entry'

const e = (id: number, over: Partial<CatalogueEntry> = {}): CatalogueEntry => ({
  id, name: `E${id}`, url: 'https://x', description: 'd', categories: ['Weather'], auth: 'none', https: true, cors: 'yes', source: 'public_apis', ...over,
})
const catalogue = [e(1), e(2, { auth: 'api_key', categories: ['Weather', 'Science'] }), e(3, { https: false, categories: ['Animals'] })]
const search = (ids: number[]): SearchResponse => ({ kind: 'match', ranker: 'thai-dict', confidence: 1, candidates: 3, hits: ids.map((entryId, i) => ({ entryId, score: 1 - i / 10 })) })

describe('visibleHits', () => {
  it('without a query lists the catalogue with the filters applied', () => {
    expect(visibleHits(catalogue, null, {}).map(h => h.entry.id)).toEqual([1, 2, 3])
    expect(visibleHits(catalogue, null, { category: 'Weather', auth: 'none' }).map(h => h.entry.id)).toEqual([1])
    expect(visibleHits(catalogue, null, { https: false }).map(h => h.entry.id)).toEqual([3])
    expect(visibleHits(catalogue, null, {}).every(h => h.score === null)).toBe(true)
  })

  // Ranker จัดอันดับทั้งคลังก่อน แล้วค่อยกรอง — ลำดับต้องเป็นของ Ranker ไม่ใช่ตามตัวอักษร
  it('with a query keeps the ranker order and scores, then filters', () => {
    const r = visibleHits(catalogue, search([3, 2, 1]), {})
    expect(r.map(h => h.entry.id)).toEqual([3, 2, 1])
    expect(r[0]!.score).toBe(1)
    expect(visibleHits(catalogue, search([3, 2, 1]), { category: 'Weather' }).map(h => h.entry.id)).toEqual([2, 1])
  })

  it('skips ids that are no longer in the catalogue (just deleted)', () => {
    expect(visibleHits(catalogue, search([99, 1]), {}).map(h => h.entry.id)).toEqual([1])
  })

  it('no_match yields nothing', () => {
    expect(visibleHits(catalogue, { kind: 'no_match', ranker: 'thai-dict', confidence: 0, candidates: 3, hits: [] }, {})).toEqual([])
  })
})

describe('categoryCounts', () => {
  it('counts every category an entry belongs to, sorted by name', () => {
    expect(categoryCounts(catalogue)).toEqual([{ name: 'Animals', count: 1 }, { name: 'Science', count: 1 }, { name: 'Weather', count: 2 }])
  })
})
