// npm run eval:ranker [ranker] [queries.json] — วัด Ranker กับคำค้น (ข้อมูล Catalogue จาก spike/data/apis.json ไม่แตะ DB)
// เกณฑ์: Jev ≥ 15/20 (ADR-0003) · thai-dict กันถอยหลัง holdout3 ≥ 14/20 (ADR-0007, test/ranker-regression.test.ts)
import { getRanker } from '../server/ranker'
import { evaluate, loadEvalCatalogue, loadEvalQueries } from '../server/ranker/eval'

const ranker = getRanker(process.argv[2])
const rows = await evaluate(ranker, loadEvalCatalogue(), loadEvalQueries(process.argv[3] ?? 'spike/queries.json'))
for (const r of rows) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.q}\n   คาด: ${(Array.isArray(r.expect) ? r.expect.join(' / ') : r.expect) || '(no_match)'} · ได้: ${r.kind === 'match' ? r.names.join(', ') : 'no_match'} · มั่นใจ ${Math.round(r.confidence * 100)}%`)
}
console.log(`\n${ranker.name}: ${rows.filter(r => r.ok).length}/${rows.length} ผ่าน`)
