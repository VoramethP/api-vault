import { describe, expect, it } from 'vitest'
import { getRanker } from '../server/ranker'
import { evaluate, loadEvalCatalogue, loadEvalQueries } from '../server/ranker/eval'

// เกณฑ์การค้นของ v1.0.0 (ADR-0007): แก้พจนานุกรมแล้วผลต้องไม่ถอยหลัง
// holdout3 ใช้ปรับไม่ได้แล้ว — ตัวเลขนี้คือพื้น ไม่ใช่ความแม่นจริง
describe('thai-dict regression', () => {
  it('passes at least 14/20 on spike/queries-holdout3.json', async () => {
    const rows = await evaluate(getRanker('thai-dict'), loadEvalCatalogue(), loadEvalQueries('spike/queries-holdout3.json'))
    expect(rows).toHaveLength(20)
    expect(rows.filter(r => r.ok).length).toBeGreaterThanOrEqual(14)
  })
})
