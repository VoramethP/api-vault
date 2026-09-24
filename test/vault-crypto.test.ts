import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { loadMasterKey, open, seal, type Sealed } from '../server/vault/crypto'

const master = { key: randomBytes(32), version: 1 }
const flip = (b: Buffer) => { const c = Buffer.from(b); c[0]! ^= 1; return c }

describe('envelope crypto (ADR-0002)', () => {
  it('round-trips, including non-ASCII', () => {
    for (const v of ['sk-live-abc123', 'คีย์ภาษาไทย 🔑', 'x'.repeat(8192)]) expect(open(seal(v, master), master)).toBe(v)
  })

  it('uses a fresh DEK and IVs every time', () => {
    const a = seal('same', master)
    const b = seal('same', master)
    expect(a.wrappedDek.equals(b.wrappedDek)).toBe(false)
    expect(a.iv.equals(b.iv)).toBe(false)
    expect(a.dekIv.equals(b.dekIv)).toBe(false)
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false)
  })

  it('never stores the plaintext or a raw DEK', () => {
    const s = seal('sk-live-abc123', master)
    for (const f of [s.ciphertext, s.wrappedDek]) expect(f.includes(Buffer.from('sk-live'))).toBe(false)
    expect(s.wrappedDek.length).toBe(32)
  })

  it.each(['ciphertext', 'iv', 'authTag', 'wrappedDek', 'dekIv', 'dekTag'] as const)('fails when %s is tampered', (field) => {
    const s = seal('secret', master)
    const bad: Sealed = { ...s, [field]: flip(s[field]) }
    expect(() => open(bad, master)).toThrow()
  })

  it('fails with the wrong master key or version', () => {
    const s = seal('secret', master)
    expect(() => open(s, { key: randomBytes(32), version: 1 })).toThrow()
    expect(() => open(s, { ...master, version: 2 })).toThrow(/v1.*v2/)
  })
})

describe('loadMasterKey', () => {
  it('reads base64 32 bytes and defaults version to 1', () => {
    const k = randomBytes(32)
    expect(loadMasterKey({ VAULT_MASTER_KEY: k.toString('base64') })).toEqual({ key: k, version: 1 })
  })

  it('rejects missing, short, or bad version', () => {
    expect(() => loadMasterKey({})).toThrow(/not set/)
    expect(() => loadMasterKey({ VAULT_MASTER_KEY: randomBytes(16).toString('base64') })).toThrow(/32 bytes/)
    expect(() => loadMasterKey({ VAULT_MASTER_KEY: randomBytes(32).toString('base64'), VAULT_MASTER_KEY_VERSION: '0' })).toThrow(/positive/)
  })

  it('error messages never contain the key', () => {
    const raw = randomBytes(20).toString('base64')
    try { loadMasterKey({ VAULT_MASTER_KEY: raw }) }
    catch (e) { expect(String(e)).not.toContain(raw) }
  })
})
