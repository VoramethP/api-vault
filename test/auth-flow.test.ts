import { describe, expect, it } from 'vitest'
import { decideAccess, isPublic, nextStep } from '../shared/auth-flow'

describe('isPublic', () => {
  it('only login, confirm, about and demo are public', () => {
    for (const p of ['/login', '/confirm', '/about', '/demo', '/demo/thai-weather']) expect(isPublic(p), p).toBe(true)
    for (const p of ['/', '/keys', '/mfa', '/mfa/enroll', '/aboutx', '/demox']) expect(isPublic(p), p).toBe(false)
  })
})

describe('nextStep', () => {
  it('sends anonymous users to login', () => {
    expect(nextStep('/', null)).toBe('/login')
    expect(nextStep('/about', null)).toBeNull()
  })
  it('forces TOTP enrollment when no factor exists', () => {
    expect(nextStep('/', { current: 'aal1', next: 'aal1' })).toBe('/mfa/enroll')
    expect(nextStep('/mfa/enroll', { current: 'aal1', next: 'aal1' })).toBeNull()
    expect(nextStep('/mfa', { current: 'aal1', next: 'aal1' })).toBe('/mfa/enroll')
  })
  it('asks for a TOTP code when a factor exists but this session has not passed it', () => {
    expect(nextStep('/', { current: 'aal1', next: 'aal2' })).toBe('/mfa')
    // ห้ามลงทะเบียน factor ใหม่ด้วยรหัสผ่านอย่างเดียว
    expect(nextStep('/mfa/enroll', { current: 'aal1', next: 'aal2' })).toBe('/mfa')
    expect(nextStep('/mfa', { current: 'aal1', next: 'aal2' })).toBeNull()
  })
  it('lets aal2 through and moves it off the MFA pages', () => {
    expect(nextStep('/', { current: 'aal2', next: 'aal2' })).toBeNull()
    expect(nextStep('/mfa', { current: 'aal2', next: 'aal2' })).toBe('/')
  })
})

describe('decideAccess', () => {
  const owner = 'owner@example.com'
  it('401 without a user', () => {
    expect(decideAccess(null, owner)).toMatchObject({ ok: false, status: 401 })
  })
  it('403 for anyone who is not the owner, even with aal2', () => {
    expect(decideAccess({ email: 'other@example.com', aal: 'aal2' }, owner)).toMatchObject({ ok: false, status: 403 })
    expect(decideAccess({ email: undefined, aal: 'aal2' }, owner)).toMatchObject({ ok: false, status: 403 })
  })
  it('403 for the owner with password only (aal1)', () => {
    expect(decideAccess({ email: owner, aal: 'aal1' }, owner)).toMatchObject({ ok: false, status: 403 })
  })
  it('ok for the owner with TOTP, email case-insensitive', () => {
    expect(decideAccess({ email: 'Owner@Example.com', aal: 'aal2' }, owner)).toEqual({ ok: true })
  })
})
