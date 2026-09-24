import { describe, expect, it } from 'vitest'
import { manualEntryInput, manualEntryUpdate } from '../shared/entry'
import { deleteBlocked, duplicateError, manualOnly } from '../server/entries/rules'

const valid = {
  name: 'Thai Weather', url: 'https://example.com', description: 'Weather forecast for Thailand',
  categories: ['Weather'], auth: 'api_key', https: true, cors: 'unknown',
}

describe('manualEntryInput', () => {
  it('accepts an English entry and never lets the caller pick source', () => {
    const r = manualEntryInput.parse({ ...valid, source: 'public_apis' })
    expect(r).not.toHaveProperty('source')
  })

  // thai-dict จับคำค้นกับข้อความอังกฤษเท่านั้น (ADR-0007)
  it('rejects a Thai or non-English description with the reason', () => {
    const thai = manualEntryInput.safeParse({ ...valid, description: 'พยากรณ์อากาศ' })
    expect(thai.success).toBe(false)
    expect(thai.error!.issues.map(i => i.message).join()).toMatch(/ภาษาอังกฤษ/)
    expect(manualEntryInput.safeParse({ ...valid, description: 'Weather พยากรณ์' }).success).toBe(false)
    expect(manualEntryInput.safeParse({ ...valid, description: '123 !!' }).success).toBe(false)
  })

  it('rejects non-http urls and empty categories', () => {
    expect(manualEntryInput.safeParse({ ...valid, url: 'javascript:alert(1)' }).success).toBe(false)
    expect(manualEntryInput.safeParse({ ...valid, categories: [] }).success).toBe(false)
  })
})

describe('manualEntryUpdate', () => {
  it('accepts a partial update and still checks the description', () => {
    expect(manualEntryUpdate.parse({ name: 'X' })).toEqual({ name: 'X' })
    expect(manualEntryUpdate.safeParse({ description: 'อากาศ' }).success).toBe(false)
  })

  it('rejects an empty update', () => {
    expect(manualEntryUpdate.safeParse({}).success).toBe(false)
  })
})

describe('rules', () => {
  it('only manual entries can be edited or deleted', () => {
    expect(manualOnly(undefined)?.statusCode).toBe(404)
    expect(manualOnly({ source: 'public_apis' })?.statusCode).toBe(403)
    expect(manualOnly({ source: 'manual' })).toBeNull()
  })

  it('an entry with keys cannot be deleted', () => {
    expect(deleteBlocked(0)).toBeNull()
    expect(deleteBlocked(2)).toMatchObject({ statusCode: 409, statusMessage: expect.stringContaining('2') })
  })

  it('duplicate points at the existing entry', () => {
    expect(duplicateError(42)).toMatchObject({ statusCode: 409, data: { id: 42 } })
  })
})
