import { z } from 'zod'
import { entryInput, type Auth, type Cors, type EntryInput } from './entry'

// แถวใน spike/data/apis.json (แปลงจาก README ของ public-apis)
export const sourceRow = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  description: z.string(),
  auth: z.string(),
  https: z.string(),
  cors: z.string(),
  category: z.string(),
})
export type SourceRow = z.infer<typeof sourceRow>

// README ต้นทางมี markdown หลุดมา: `Yes`, \apiKey\ (ซึ่ง \a กลายเป็น control char ตอนแปลง)
export function clean(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[`\\\u0000-\u001f]/g, '').trim()
}

const AUTH_MAP: Record<string, Auth> = {
  'no': 'none',
  'apikey': 'api_key',
  'piKey': 'api_key', // \apiKey\ → \a ถูกกินเป็น BEL → เหลือ "piKey"
  'oauth': 'oauth',
  'x-mashape-key': 'x_mashape_key',
  'user-agent': 'user_agent',
}

function mapAuth(raw: string): Auth | undefined {
  const v = clean(raw)
  return AUTH_MAP[v] ?? AUTH_MAP[v.toLowerCase()]
}

function mapYesNo(raw: string): boolean | undefined {
  const v = clean(raw).toLowerCase()
  return v === 'yes' ? true : v === 'no' ? false : undefined
}

function mapCors(raw: string): Cors | undefined {
  const v = clean(raw).toLowerCase()
  return (['yes', 'no', 'unknown'] as const).find(c => c === v)
}

export class ImportError extends Error {}

/** แปลงแถวต้นทางเป็น Entry — แถวไหนผิด throw ทั้งก้อน ไม่ข้ามเงียบ ๆ */
export function toEntries(rows: unknown[]): EntryInput[] {
  const byKey = new Map<string, EntryInput>()
  rows.forEach((raw, i) => {
    const row = sourceRow.safeParse(raw)
    if (!row.success) throw new ImportError(`row ${i}: ${row.error.message}`)
    const r = row.data
    const parsed = entryInput.safeParse({
      name: clean(r.name),
      url: r.url.trim(),
      description: clean(r.description),
      categories: [clean(r.category)],
      auth: mapAuth(r.auth),
      https: mapYesNo(r.https),
      cors: mapCors(r.cors),
      source: 'public_apis',
    })
    if (!parsed.success) throw new ImportError(`row ${i} (${r.name}): ${parsed.error.message}`)
    const e = parsed.data
    // unique (name, url) ในตาราง — แถวซ้ำคือ API เดียวกันที่อยู่หลายหมวด
    const key = `${e.name.toLowerCase()}\n${e.url}`
    const seen = byKey.get(key)
    if (seen) seen.categories = [...new Set([...seen.categories, ...e.categories])]
    else byKey.set(key, e)
  })
  return [...byKey.values()]
}
