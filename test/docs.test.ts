import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SITE_URL, llmsFull, llmsIndex } from '../shared/docs'

const runbook = readFileSync('docs/RUNBOOK.md', 'utf8')

describe('llms.txt', () => {
  // โครงตามมาตรฐาน llmstxt.org: H1 → blockquote สรุป → หัวข้อ H2 ที่เป็นรายการลิงก์
  it('follows the llms.txt shape and links the full file', () => {
    const txt = llmsIndex()
    expect(txt).toMatch(/^# api-vault\n\n> /)
    expect(txt).toContain(`${SITE_URL}/llms-full.txt`)
    expect(txt).toMatch(/^## Docs$/m)
  })

  it('llms-full carries the whole runbook', () => {
    const full = llmsFull(runbook)
    for (const h of runbook.match(/^## .+$/gm)!) expect(full).toContain(h)
  })
})

// runbook ขึ้นเว็บสาธารณะ + ให้ LLM อ่าน — ต้องไม่มีอะไรหน้าตาเหมือนความลับ
describe('RUNBOOK.md', () => {
  it('contains no secret-looking values', () => {
    expect(runbook).not.toMatch(/postgres(ql)?:\/\/[^\s`]*:[^\s`]*@/)
    expect(runbook).not.toMatch(/\b(sk|pk|rk)[-_][A-Za-z0-9]{16,}/)
    expect(runbook).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\./)
    expect(runbook).not.toMatch(/VAULT_MASTER_KEY\s*=\s*\S/)
  })
})
