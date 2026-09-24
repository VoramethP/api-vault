import { readFileSync } from 'node:fs'
import { toEntries } from '../../shared/import-public-apis'
import type { EntryForRanking, Ranker } from './types'

// expect: string = ชื่อที่มีข้อความนี้ (แบบเดิม) · string[] = ชื่อใดชื่อหนึ่งตรงเป๊ะ · '' หรือ [] = คาดว่า no_match
export interface EvalQuery { q: string, expect: string | string[] }
export interface EvalRow { q: string, expect: string | string[], ok: boolean, names: string[], kind: 'match' | 'no_match', confidence: number }

/** Catalogue จาก spike/data/apis.json ผ่าน importer ตัวเดียวกับ db:import → รวมแถวซ้ำ/ทำความสะอาดเหมือนข้อมูลจริงใน DB */
export function loadEvalCatalogue(path = 'spike/data/apis.json'): EntryForRanking[] {
  return toEntries(JSON.parse(readFileSync(path, 'utf8')))
    .map((e, i) => ({ id: i + 1, name: e.name, description: e.description, categories: e.categories, auth: e.auth, https: e.https, cors: e.cors }))
}

export function loadEvalQueries(path: string): EvalQuery[] {
  return (JSON.parse(readFileSync(path, 'utf8')) as EvalQuery[]).filter(q => q.q)
}

/** ผ่าน = คำตอบที่คาดไว้ติด top-5 (ADR-0003) */
export async function evaluate(ranker: Ranker, entries: EntryForRanking[], queries: EvalQuery[]): Promise<EvalRow[]> {
  const rows: EvalRow[] = []
  for (const { q, expect } of queries) {
    const r = await ranker.rank(q, entries, { limit: 5 })
    const names = r.kind === 'match' ? r.hits.map(h => entries.find(e => e.id === h.entryId)!.name) : []
    const wanted = Array.isArray(expect) ? expect : expect ? [expect] : []
    const ok = !wanted.length
      ? r.kind === 'no_match'
      : Array.isArray(expect)
        ? names.some(n => wanted.some(w => n.toLowerCase() === w.toLowerCase()))
        : names.some(n => n.toLowerCase().includes(wanted[0]!.toLowerCase()))
    rows.push({ q, expect, ok, names, kind: r.kind, confidence: r.confidence })
  }
  return rows
}
