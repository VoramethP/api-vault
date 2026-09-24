import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PUBLIC_PATHS } from '../shared/auth-flow'

// route ใหม่ที่ลืม requireOwner() = ข้อมูลเปิดโล่ง และไม่มีอะไรพังให้เห็น — ให้เทสนี้พังแทน
const PUBLIC_API: string[] = []

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('server/api', () => {
  it('every route calls requireOwner(event) first', () => {
    const files = walk('server/api').filter(f => f.endsWith('.ts') && !PUBLIC_API.includes(f))
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      const body = readFileSync(f, 'utf8')
      expect(body, f).toMatch(/defineEventHandler\(async \(event\)[^{]*\{\s*(const [^=]+= )?await requireOwner\(event\)/)
    }
  })

  it('redirect exclusions in nuxt.config match PUBLIC_PATHS', () => {
    const config = readFileSync('nuxt.config.ts', 'utf8')
    const exclude = config.match(/exclude:\s*\[([^\]]*)\]/)![1]!.match(/'[^']+'/g)!.map(s => s.slice(1, -1))
    expect(['/login', '/confirm', ...exclude].sort()).toEqual([...PUBLIC_PATHS].sort())
  })
})
