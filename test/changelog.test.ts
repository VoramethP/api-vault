import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseChangelog } from '../shared/changelog'

describe('parseChangelog', () => {
  it('reads releases, groups and items as plain text', () => {
    const r = parseChangelog(`# Changelog\n\nintro\n\n## [0.1.0] - 2026-09-30\n\n### Added\n- search \`q\` on **entries** ([spec](docs/spec.md))\n- import\n\n### Fixed\n- x\n\n## [Unreleased]\n<!-- plan -->\n- loose item\n`)
    expect(r).toEqual([
      { version: '0.1.0', date: '2026-09-30', groups: [{ title: 'Added', items: ['search q on entries (spec)', 'import'] }, { title: 'Fixed', items: ['x'] }] },
      { version: 'Unreleased', date: null, groups: [{ title: '', items: ['loose item'] }] },
    ])
  })

  it('the top release in CHANGELOG.md matches package.json version', () => {
    const [top] = parseChangelog(readFileSync('CHANGELOG.md', 'utf8')).filter(r => r.version !== 'Unreleased')
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
    // ยังไม่เคยปล่อย = ไม่มี release และ version ยังเป็น 0.0.0
    expect(top?.version ?? '0.0.0').toBe(version)
  })
})
