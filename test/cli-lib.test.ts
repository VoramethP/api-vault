import { describe, expect, it } from 'vitest'
// @ts-expect-error — .mjs ไม่มี d.ts · CLI ต้องไม่มี build step
import { formatValue, mergeEnv, parseArgs } from '../cli/lib.mjs'
import { normalizeUserCode, effectiveStatus } from '../shared/cli'

describe('mergeEnv', () => {
  it('replaces only pulled vars and keeps everything else', () => {
    const before = '# app\nPORT=3000\nexport OW_KEY=old\n\nOTHER="x y"\n'
    const r = mergeEnv(before, [{ envVar: 'OW_KEY', value: 'new-1' }, { envVar: 'NEW_KEY', value: 'n2' }], 'app')
    expect(r.content).toBe('# app\nPORT=3000\nOW_KEY=new-1\n\nOTHER="x y"\n\n# vault pull app\nNEW_KEY=n2\n')
    expect(r.updated).toEqual(['OW_KEY'])
    expect(r.added).toEqual(['NEW_KEY'])
  })

  it('creates a new file and does not match on prefixes', () => {
    expect(mergeEnv('', [{ envVar: 'A', value: '1' }], 'p').content).toBe('# vault pull p\nA=1\n')
    expect(mergeEnv('AB=1\n', [{ envVar: 'A', value: '2' }], 'p').content).toBe('AB=1\n\n# vault pull p\nA=2\n')
  })

  it('updates every duplicate line so no stale value survives', () => {
    expect(mergeEnv('A=1\nA=2\n', [{ envVar: 'A', value: '3' }], 'p').content).toBe('A=3\nA=3\n')
  })
})

describe('formatValue', () => {
  it('leaves safe keys bare and single-quotes the rest', () => {
    expect(formatValue('sk-live_ABC.123/+=')).toBe('sk-live_ABC.123/+=')
    expect(formatValue('a b$c#"d')).toBe(`'a b$c#"d'`)
  })

  it('refuses values it cannot round-trip', () => {
    expect(() => formatValue("it's")).toThrow()
    expect(() => formatValue('a\nb')).toThrow()
  })
})

describe('parseArgs', () => {
  it('reads positionals and --flag value / --flag=value / bare flags', () => {
    expect(parseArgs(['pull', 'app', '--file', '.env.local', '--no-open'])).toEqual({ command: 'pull', positional: ['app'], flags: { 'file': '.env.local', 'no-open': true } })
    expect(parseArgs(['login', '--url=http://x'])).toEqual({ command: 'login', positional: [], flags: { url: 'http://x' } })
  })
})

describe('user code + status', () => {
  it('normalizes what people type', () => {
    expect(normalizeUserCode('abcd efgh')).toBe('ABCD-EFGH')
    expect(normalizeUserCode('ABCD-2345')).toBe('ABCD-2345')
    for (const bad of ['ABCD-EFG', 'ABCD-EFG0', 'ABCD-EFGI', '']) expect(normalizeUserCode(bad), bad).toBeNull()
  })

  it('treats pending/approved past expiry as expired', () => {
    const now = new Date('2026-09-24T00:00:00Z')
    const past = new Date(now.getTime() - 1)
    expect(effectiveStatus({ status: 'pending', expiresAt: past }, now)).toBe('expired')
    expect(effectiveStatus({ status: 'approved', expiresAt: past }, now)).toBe('expired')
    expect(effectiveStatus({ status: 'consumed', expiresAt: past }, now)).toBe('consumed')
    expect(effectiveStatus({ status: 'pending', expiresAt: new Date(now.getTime() + 1) }, now)).toBe('pending')
  })
})
