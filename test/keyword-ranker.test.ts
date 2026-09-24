import { describe, expect, it } from 'vitest'
import { keywordRanker, tokenize } from '../server/ranker/keyword'
import type { EntryForRanking } from '../server/ranker/types'

const e = (id: number, name: string, description: string, categories: string[]): EntryForRanking =>
  ({ id, name, description, categories, auth: 'none', https: true, cors: 'unknown' })

const catalogue = [
  e(1, 'Open-Meteo', 'Global weather forecast API for non-commercial use', ['Weather']),
  e(2, 'Weatherbit', 'Current and forecast data', ['Weather']),
  e(3, 'Cataas', 'Cat as a service (cats pictures and gifs)', ['Animals']),
  e(4, 'Frankfurter', 'Exchange rates, currency conversion and time series', ['Currency Exchange']),
  e(5, 'Google Books', 'Books', ['Books']),
]
const rank = (q: string) => keywordRanker.rank(q, catalogue, { limit: 5 })

describe('keyword ranker', () => {
  it('ranks name match above category match above description match', async () => {
    const r = await rank('weatherbit')
    expect(r.kind).toBe('match')
    if (r.kind !== 'match') return
    expect(r.hits[0]!.entryId).toBe(2)

    const byCategory = await rank('weather')
    if (byCategory.kind !== 'match') throw new Error('expected match')
    // Weatherbit ตรงที่ชื่อ (prefix) · Open-Meteo ตรงที่หมวด
    expect(byCategory.hits.map(h => h.entryId)).toEqual([2, 1])
    expect(byCategory.hits[0]!.score).toBeGreaterThan(byCategory.hits[1]!.score)
  })

  it('scores are between 0 and 1', async () => {
    const r = await rank('currency exchange rates')
    if (r.kind !== 'match') throw new Error('expected match')
    for (const h of r.hits) {
      expect(h.score).toBeGreaterThan(0)
      expect(h.score).toBeLessThanOrEqual(1)
    }
    expect(r.hits[0]!.entryId).toBe(4)
    expect(r.confidence).toBe(1)
  })

  it('reports partial confidence when only some words are found', async () => {
    const r = await rank('cat zebra')
    if (r.kind !== 'match') throw new Error('expected match')
    expect(r.confidence).toBe(0.5)
  })

  it('returns no_match instead of guessing', async () => {
    expect((await rank('blockchain')).kind).toBe('no_match')
    expect((await rank('อยากได้อัตราแลกเปลี่ยน')).kind).toBe('no_match')
    expect((await rank('the api for')).kind).toBe('no_match')
  })

  it('short tokens match plurals (cat → Cats)', async () => {
    const r = await keywordRanker.rank('cat', [e(9, 'Cats', 'Pictures', ['Animals'])], { limit: 5 })
    expect(r.kind).toBe('match')
  })

  it('short tokens do not prefix-match (go ≠ google)', async () => {
    expect((await rank('go')).kind).toBe('no_match')
  })

  it('respects limit', async () => {
    const r = await keywordRanker.rank('weather', catalogue, { limit: 1 })
    if (r.kind !== 'match') throw new Error('expected match')
    expect(r.hits).toHaveLength(1)
  })

  it('tokenize drops stopwords and punctuation', () => {
    expect(tokenize('The Weather-API, for free!')).toEqual(['weather'])
  })
})
