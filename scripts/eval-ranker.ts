// npm run eval:ranker [ranker] — วัด Ranker กับคำค้นใน spike/queries.json (ข้อมูล Catalogue จาก spike/data/apis.json ไม่แตะ DB)
// เกณฑ์ ADR-0003: คำตอบที่คาดไว้ติด top-5 อย่างน้อย 15/20 · ข้อที่ expect ว่าง = คาดว่า no_match
import { readFileSync } from 'node:fs'
import { getRanker, type EntryForRanking } from '../server/ranker'
import { toEntries } from '../shared/import-public-apis'

// ใช้ importer ตัวเดียวกับ db:import → รวมแถวซ้ำ/ทำความสะอาดเหมือนข้อมูลจริงใน DB
const entries: EntryForRanking[] = toEntries(JSON.parse(readFileSync('spike/data/apis.json', 'utf8')))
  .map((e, i) => ({ id: i + 1, name: e.name, description: e.description, categories: e.categories, auth: e.auth, https: e.https, cors: e.cors }))

const queries = (JSON.parse(readFileSync(process.argv[3] ?? 'spike/queries.json', 'utf8')) as { q: string, expect: string }[]).filter(q => q.q)
const ranker = getRanker(process.argv[2])
let pass = 0
for (const { q, expect } of queries) {
  const r = await ranker.rank(q, entries, { limit: 5 })
  const names = r.kind === 'match' ? r.hits.map(h => entries.find(e => e.id === h.entryId)!.name) : []
  const ok = expect ? names.some(n => n.toLowerCase().includes(expect.toLowerCase())) : r.kind === 'no_match'
  if (ok) pass++
  console.log(`${ok ? '✅' : '❌'} ${q}\n   คาด: ${expect || '(no_match)'} · ได้: ${r.kind === 'match' ? names.join(', ') : 'no_match'} · มั่นใจ ${Math.round(r.confidence * 100)}%`)
}
console.log(`\n${ranker.name}: ${pass}/${queries.length} ผ่าน`)
