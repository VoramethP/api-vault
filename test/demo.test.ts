import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// ADR-0004 / spec §8: เดโมต้องโชว์ว่า Ranker กล้าตอบ "ไม่เจอ" — พจนานุกรมเปลี่ยนแล้วข้อนี้หายได้เงียบ ๆ (เคยเกิดแล้ว)
describe('app/demo/results.json', () => {
  const demo = JSON.parse(readFileSync('app/demo/results.json', 'utf8')) as {
    results: { q: string, kind: string, hits: Record<string, unknown>[] }[]
  }

  it('has 5–8 queries and exactly one No match', () => {
    expect(demo.results.length).toBeGreaterThanOrEqual(5)
    expect(demo.results.length).toBeLessThanOrEqual(8)
    expect(demo.results.filter(r => r.kind === 'no_match').map(r => r.q)).toHaveLength(1)
  })

  it('carries only public Entry fields', () => {
    const allowed = ['name', 'url', 'description', 'categories', 'auth', 'https', 'cors', 'score']
    for (const r of demo.results) for (const h of r.hits) expect(Object.keys(h).sort()).toEqual([...allowed].sort())
  })
})
