import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// กันค่าจริงหลุดเข้า .env.example (repo-hygiene) — ทุกตัวแปรต้องว่างหรือเป็น placeholder
describe('.env.example', () => {
  it('holds no real values', () => {
    const lines = readFileSync('.env.example', 'utf8').split('\n')
      .filter(l => l.trim() && !l.trim().startsWith('#'))
    for (const line of lines) {
      const value = line.slice(line.indexOf('=') + 1).trim()
      expect(value === '' || /^<.*>$/.test(value), line.split('=')[0]).toBe(true)
    }
  })
})
