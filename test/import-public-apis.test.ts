import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { clean, ImportError, toEntries } from '../shared/import-public-apis'

const row = (over: Record<string, unknown> = {}) => ({
  id: 1, name: 'Cataas', url: 'https://cataas.com/', description: 'Cat as a service',
  auth: 'No', https: 'Yes', cors: 'Unknown', category: 'Animals', ...over,
})

describe('import public-apis', () => {
  it('cleans markdown leftovers from the source README', () => {
    expect(clean('`Yes`')).toBe('Yes')
    expect(clean('\\\u0007piKey\\')).toBe('piKey')
    const [e] = toEntries([row({ auth: '\\\u0007piKey\\', https: '`Yes`', cors: '`Unknown`' })])
    expect(e).toMatchObject({ auth: 'api_key', https: true, cors: 'unknown', source: 'public_apis' })
  })

  it('merges rows with the same name + url into one Entry with both categories', () => {
    const list = toEntries([row({ category: 'Animals' }), row({ category: 'Entertainment' }), row({ name: 'Other', url: 'https://x.dev/' })])
    expect(list).toHaveLength(2)
    expect(list[0]!.categories).toEqual(['Animals', 'Entertainment'])
  })

  it('stops the whole import on a bad row instead of skipping it', () => {
    expect(() => toEntries([row(), row({ auth: 'Magic' })])).toThrow(ImportError)
    expect(() => toEntries([row({ url: 'not a url' })])).toThrow(/row 0/)
    expect(() => toEntries([{ name: 'x' }])).toThrow(ImportError)
  })

  it('imports the real snapshot: 1,873 source rows → 1,871 Entries', () => {
    const rows = JSON.parse(readFileSync('spike/data/apis.json', 'utf8'))
    expect(rows).toHaveLength(1873)
    const list = toEntries(rows)
    expect(list).toHaveLength(1871)
    const meteo = list.find(e => e.name === 'Open-Meteo')!
    expect(meteo.categories.sort()).toEqual(['Environment', 'Weather'])
  })
})
