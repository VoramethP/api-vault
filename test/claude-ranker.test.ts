import { describe, expect, it } from 'vitest'
import { buildCatalogue, toRankResult } from '../server/ranker/claude'
import type { EntryForRanking } from '../server/ranker/types'

const e = (id: number, name: string): EntryForRanking => ({ id, name, description: `${name}  api\nx`, categories: ['Animals'], auth: 'none', https: true, cors: 'yes' })
const cands = [e(2, 'Dogs'), e(1, 'Cats')]

describe('claude ranker (offline parts)', () => {
  it('builds the same catalogue text regardless of input order — prompt cache depends on it', () => {
    expect(buildCatalogue(cands)).toBe(buildCatalogue([...cands].reverse()))
    expect(buildCatalogue(cands).split('\n')[0]).toBe('1 | Cats | Animals | none | https | yes | Cats api x')
  })

  it('drops unknown/duplicate ids, clamps scores, sorts, limits', () => {
    const r = toRankResult({ kind: 'match', confidence: 1.4, hits: [{ id: 99, score: 1 }, { id: 1, score: 0.4 }, { id: 2, score: 2 }, { id: 1, score: 0.9 }] }, cands, 5)
    expect(r).toEqual({ kind: 'match', confidence: 1, hits: [{ entryId: 2, score: 1 }, { entryId: 1, score: 0.4 }] })
  })

  it('turns a match with no valid ids into no_match', () => {
    expect(toRankResult({ kind: 'match', confidence: 0.8, hits: [{ id: 99, score: 1 }] }, cands, 5)).toEqual({ kind: 'no_match', confidence: 0.8 })
  })
})
