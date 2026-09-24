// npm run demo:build — คำนวณผลเดโมล่วงหน้าลง app/demo/results.json (ADR-0004)
// รันในเครื่องเท่านั้น · หน้า /demo อ่านไฟล์นี้ตอน build ไม่ยิง Ranker สดและไม่มี secret ใน deployment
// ไฟล์ผลมีแค่ข้อมูลสาธารณะของ Entry (ชื่อ ลิงก์ คำอธิบาย หมวด auth/https/cors) — ไม่มี id ภายในหรืออะไรจาก Vault
import { readFileSync, writeFileSync } from 'node:fs'
import postgres from 'postgres'
import { getRanker, type EntryForRanking } from '../server/ranker'
import { parseQuery } from '../server/ranker/thai-dict'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')
const sql = postgres(url, { prepare: false, max: 1 })
const rows = await sql<(EntryForRanking & { url: string })[]>`
  select id, name, url, description, categories, auth, https, cors from entries order by id`
await sql.end()

const ranker = getRanker(process.env.DEMO_RANKER ?? 'thai-dict')
const queries = JSON.parse(readFileSync('app/demo/queries.json', 'utf8')) as string[]
const byId = new Map(rows.map(r => [r.id, r]))

const results = []
for (const q of queries) {
  const r = await ranker.rank(q, rows, { limit: 5 })
  results.push({
    q,
    kind: r.kind,
    confidence: r.confidence,
    // บอกผู้ชมว่า Ranker เข้าใจคำค้นว่าอะไร — ส่วนที่ทำให้ผลอธิบายได้
    understood: ranker.name === 'thai-dict' ? (({ concepts, filters }) => ({ terms: concepts.map(c => c.source), filters }))(parseQuery(q)) : null,
    hits: r.kind === 'match'
      ? r.hits.map((h) => {
          const e = byId.get(h.entryId)!
          return { name: e.name, url: e.url, description: e.description, categories: e.categories, auth: e.auth, https: e.https, cors: e.cors, score: h.score }
        })
      : [],
  })
}

writeFileSync('app/demo/results.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  ranker: ranker.name,
  catalogueSize: rows.length,
  results,
}, null, 2) + '\n')
console.log(`✅ app/demo/results.json · ${results.length} คำค้น · ${ranker.name} · ${results.filter(r => r.kind === 'no_match').length} ข้อ no_match`)
