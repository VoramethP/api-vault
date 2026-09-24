import { describe, expect, it } from 'vitest'
import dict from '../server/ranker/thai-dict.json'
import { tokenize } from '../server/ranker/keyword'
import { parseQuery, thaiDictRanker } from '../server/ranker/thai-dict'
import type { EntryForRanking } from '../server/ranker/types'

const e = (id: number, name: string, categories: string[], description = '', auth: EntryForRanking['auth'] = 'none', cors: EntryForRanking['cors'] = 'yes'): EntryForRanking =>
  ({ id, name, description, categories, auth, https: true, cors })

const catalogue = [
  e(1, 'Cats', ['Animals'], 'Pictures of cats from Tumblr', 'api_key'),
  e(2, 'RandomCat', ['Animals'], 'Random pictures of cats'),
  e(3, 'Frankfurter', ['Currency Exchange'], 'Exchange rates and currency conversion'),
  e(4, 'Fixer', ['Currency Exchange'], 'Current and historical foreign exchange rates', 'api_key'),
  e(5, 'Open-Meteo', ['Weather'], 'Global weather forecast API', 'none', 'no'),
]

describe('parseQuery', () => {
  it('matches the longest Thai phrase first', () => {
    expect(parseQuery('อัตราแลกเปลี่ยน').concepts.map(c => c.source)).toEqual(['อัตราแลกเปลี่ยน'])
  })

  it('drops stopwords, keeps unknown Thai words, passes English through', () => {
    const p = parseQuery('อยากได้ API สุ่มรูปแมว กระดาษทราย weather')
    expect(p.concepts.map(c => c.source)).toEqual(['สุ่มรูป', 'แมว', 'weather'])
    expect(p.unknown.length).toBeGreaterThan(0)
  })

  it('turns spoken conditions into filters and removes them from the terms', () => {
    const p = parseQuery('อัตราแลกเปลี่ยนแบบไม่ต้องใช้ key เรียกจากเบราว์เซอร์ได้')
    expect(p.filters).toEqual({ auth: 'none', cors: 'yes' })
    expect(p.concepts.map(c => c.source)).toEqual(['อัตราแลกเปลี่ยน'])
    expect(parseQuery('currency without api key').filters).toEqual({ auth: 'none' })
  })
})

describe('thaiDictRanker', () => {
  it('finds Thai queries in English data', async () => {
    const r = await thaiDictRanker.rank('อยากได้รูปแมว', catalogue, { limit: 5 })
    expect(r.kind).toBe('match')
    if (r.kind === 'match') expect(r.hits.map(h => h.entryId).slice(0, 2).sort()).toEqual([1, 2])
  })

  it('applies filters before ranking', async () => {
    const r = await thaiDictRanker.rank('อัตราแลกเปลี่ยนไม่ต้องใช้ key', catalogue, { limit: 5 })
    expect(r.kind === 'match' && r.hits.map(h => h.entryId)).toEqual([3])
    const noCors = await thaiDictRanker.rank('พยากรณ์อากาศ เรียกจากเบราว์เซอร์', catalogue, { limit: 5 })
    expect(noCors.kind).toBe('no_match')
  })

  it('says no_match when nothing is understood, and lowers confidence for unknown words', async () => {
    expect(await thaiDictRanker.rank('หาเพื่อนคุยตอนดึก', catalogue, { limit: 5 })).toEqual({ kind: 'no_match', confidence: 0 })
    const partial = await thaiDictRanker.rank('แมว กระดาษทราย', catalogue, { limit: 5 })
    expect(partial.confidence).toBeLessThan(1)
    expect(partial.confidence).toBeGreaterThan(0)
  })
})

describe('thai-dict.json', () => {
  it('has keys without spaces and values that tokenize to something', () => {
    for (const [k, v] of Object.entries(dict.phrases as Record<string, string[]>)) {
      expect(k, k).not.toMatch(/\s/)
      expect(v.length, k).toBeGreaterThan(0)
      for (const term of v) expect(tokenize(term).length, `${k} → ${term}`).toBeGreaterThan(0)
    }
  })

  it('never lists a phrase as a stopword too', () => {
    for (const s of dict.stopwords) expect(Object.hasOwn(dict.phrases, s), s).toBe(false)
  })
})
