import { describe, expect, it } from 'vitest'
import dict from '../server/ranker/thai-dict.json'
import { tokenize } from '../server/ranker/keyword'
import { editDistance, parseQuery, thaiDictRanker } from '../server/ranker/thai-dict'
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

describe('normalizeThai', () => {
  it('folds look-alike spellings into one', async () => {
    const { normalizeThai } = await import('../server/ranker/thai-dict')
    expect(normalizeThai('อัตราเเลกเปลี่ยน')).toBe('อัตราแลกเปลี่ยน')
    expect(normalizeThai('ย่อลิ้งค์')).toBe('ย่อลิงก์')
    expect(normalizeThai('แมว\u200Bน่ารัก')).toBe('แมวน่ารัก')
  })
})

describe('thaiDictRanker', () => {
  it('answers no_match with high confidence for Thai-only needs the catalogue cannot serve', async () => {
    expect(await thaiDictRanker.rank('api ตรวจหวยงวดล่าสุด', catalogue, { limit: 5 })).toEqual({ kind: 'no_match', confidence: 0.8 })
  })

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

describe('typos, merging and ranking rules', () => {
  it('tolerates a one-letter typo only in long enough words', () => {
    expect(parseQuery('แผ่นดิไหว').concepts.map(c => c.source)).toEqual(['แผ่นดินไหว'])
    expect(editDistance('แมว', 'แมง', 1)).toBe(1)
    // คำสั้นห้ามเดา — "แมง" ต้องไม่กลายเป็น "แมว"
    expect(parseQuery('แมง').concepts).toEqual([])
  })

  it('counts a Thai word and its English restatement once', () => {
    expect(parseQuery('ตัดคำ nlp').concepts.map(c => c.source)).toEqual(['ตัดคำ'])
  })

  it('ranks an entry whose whole category is the need as high as a name match', async () => {
    const cats = [e(1, 'US Weather', ['Government'], 'weather', 'api_key'), e(2, 'Open-Meteo', ['Weather'], 'forecast', 'none')]
    const r = await thaiDictRanker.rank('สภาพอากาศ', cats, { limit: 5 })
    expect(r.kind === 'match' && r.hits[0]!.entryId).toBe(2)
  })

  it('drops what the user says they do not want', async () => {
    const maps = [e(1, 'Google Maps', ['Geocoding'], 'maps'), e(2, 'Longdo Map', ['Geocoding'], 'Thai map')]
    for (const q of ['แผนที่ ที่ไม่ใช่ google map', 'map api alternative to google maps']) {
      const r = await thaiDictRanker.rank(q, maps, { limit: 5 })
      expect(r.kind === 'match' && r.hits.map(h => h.entryId), q).toEqual([2])
    }
  })

  it('prefers keyless APIs when the query says free, without filtering keyed ones out', async () => {
    const two = [e(1, 'Aaa Cats', ['Animals'], '', 'api_key', 'no'), e(2, 'Zzz Cats', ['Animals'], '', 'none', 'no')]
    const r = await thaiDictRanker.rank('แมว ฟรี', two, { limit: 5 })
    expect(r.kind === 'match' && r.hits.map(h => h.entryId)).toEqual([2, 1])
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

  it('points every variant at a known phrase or stopword', () => {
    for (const [from, to] of Object.entries(dict.variants as Record<string, string>)) {
      expect(Object.hasOwn(dict.phrases, to) || dict.stopwords.includes(to), `${from} → ${to}`).toBe(true)
    }
  })

  it('keeps ambiguous everyday words out of the phrase list — "ตอน" usually means "when"', async () => {
    expect(parseQuery('หาเพื่อนคุยตอนดึก').concepts).toEqual([])
  })

  it('never lists a phrase as a stopword too', () => {
    for (const s of dict.stopwords) expect(Object.hasOwn(dict.phrases, s), s).toBe(false)
  })
})
