import { describe, expect, it, vi } from 'vitest'
import { checkFreshTotp, envVar, last4, projectName } from '../shared/vault'
import { reveal, type RevealDeps } from '../server/vault/reveal'

const NOW = 1_800_000_000

describe('checkFreshTotp', () => {
  it('accepts a TOTP verified within 120 s, using the latest one', () => {
    const r = checkFreshTotp([{ method: 'password', timestamp: NOW - 5 }, { method: 'totp', timestamp: NOW - 900 }, { method: 'totp', timestamp: NOW - 30 }], NOW)
    expect(r).toEqual({ ok: true, totpAt: NOW - 30 })
  })

  it('rejects stale, missing, password-only and far-future', () => {
    expect(checkFreshTotp([{ method: 'totp', timestamp: NOW - 121 }], NOW).ok).toBe(false)
    expect(checkFreshTotp(undefined, NOW).ok).toBe(false)
    expect(checkFreshTotp([{ method: 'password', timestamp: NOW }], NOW).ok).toBe(false)
    expect(checkFreshTotp([{ method: 'totp', timestamp: NOW + 3600 }], NOW).ok).toBe(false)
    expect(checkFreshTotp([{ method: 'totp', timestamp: String(NOW) }], NOW).ok).toBe(false)
  })
})

describe('reveal', () => {
  const deps = (over: Partial<RevealDeps> = {}): RevealDeps => ({
    amr: [{ method: 'totp', timestamp: NOW - 10 }],
    nowS: NOW,
    load: async () => ({ label: 'OpenWeather', decrypt: () => 'sk-value' }),
    audit: async () => {},
    ...over,
  })

  it('writes audit with the TOTP time before returning the value', async () => {
    const order: string[] = []
    const audit = vi.fn(async () => { order.push('audit') })
    const r = await reveal(deps({ audit, load: async () => ({ label: 'OW', decrypt: () => { order.push('decrypt'); return 'v' } }) }))
    expect(r).toEqual({ ok: true, value: 'v' })
    expect(order).toEqual(['decrypt', 'audit'])
    expect(audit).toHaveBeenCalledWith({ keyLabel: 'OW', totpAt: new Date((NOW - 10) * 1000) })
  })

  it('returns no value when audit fails (e.g. TOTP already used)', async () => {
    await expect(reveal(deps({ audit: async () => { throw new Error('duplicate key') } }))).rejects.toThrow()
  })

  it('does not load or decrypt without a fresh TOTP', async () => {
    const load = vi.fn()
    const r = await reveal(deps({ amr: [{ method: 'totp', timestamp: NOW - 600 }], load }))
    expect(r).toMatchObject({ ok: false, status: 403 })
    expect(load).not.toHaveBeenCalled()
  })

  it('404s a missing key without audit', async () => {
    const audit = vi.fn()
    expect(await reveal(deps({ load: async () => null, audit }))).toMatchObject({ ok: false, status: 404 })
    expect(audit).not.toHaveBeenCalled()
  })
})

describe('input rules', () => {
  it('last4 only for long keys', () => {
    expect(last4('0123456789abcdef')).toBe('cdef')
    expect(last4('short-key-15chr')).toBeNull()
  })

  it('env var and project names are shell-safe', () => {
    expect(envVar.safeParse('OPENWEATHER_API_KEY').success).toBe(true)
    for (const bad of ['openweather', '1KEY', 'A-B', 'A B', '']) expect(envVar.safeParse(bad).success, bad).toBe(false)
    expect(projectName.safeParse('my-app.v2').success).toBe(true)
    for (const bad of ['My App', '-x', 'a;rm', '']) expect(projectName.safeParse(bad).success, bad).toBe(false)
  })
})
