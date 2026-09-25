import { z } from 'zod'

export const AUTH = ['none', 'api_key', 'oauth', 'x_mashape_key', 'user_agent'] as const
export const CORS = ['yes', 'no', 'unknown'] as const
export const SOURCE = ['public_apis', 'manual'] as const

export type Auth = typeof AUTH[number]
export type Cors = typeof CORS[number]

/** Entry ที่พร้อมลงตาราง — ทั้ง importer และฟอร์มเพิ่มเอง (v1.0.0) ใช้ตัวเดียวกัน */
export const entryInput = z.object({
  name: z.string().trim().min(1, 'ใส่ชื่อ').max(200),
  url: z.url({ protocol: /^https?$/, error: 'URL ต้องขึ้นต้นด้วย http:// หรือ https://' }),
  description: z.string().trim().min(1, 'ใส่คำอธิบาย').max(500),
  categories: z.array(z.string().trim().min(1)).min(1, 'เลือกอย่างน้อย 1 หมวด'),
  auth: z.enum(AUTH),
  https: z.boolean(),
  cors: z.enum(CORS),
  source: z.enum(SOURCE),
})
export type EntryInput = z.infer<typeof entryInput>

// thai-dict แปลคำค้นไทยเป็นอังกฤษแล้วจับกับข้อความอังกฤษ — คำอธิบายไทยจะค้นไม่เจอเลย (ADR-0007)
const englishDescription = entryInput.shape.description
  .refine(d => !/[\u0E00-\u0E7F]/.test(d), 'เขียนคำอธิบายเป็นภาษาอังกฤษ — การค้นไทยแปลคำค้นเป็นอังกฤษก่อนจับคู่')
  .refine(d => /[A-Za-z]{2,}/.test(d), 'คำอธิบายต้องมีคำภาษาอังกฤษ')

/** Entry ที่เจ้าของเพิ่มเอง — source เป็น manual เสมอ ผู้ใช้เลือกไม่ได้ */
export const manualEntryInput = entryInput.omit({ source: true }).extend({ description: englishDescription })
export type ManualEntryInput = z.infer<typeof manualEntryInput>

export const manualEntryUpdate = manualEntryInput.partial()
  .refine(v => Object.values(v).some(x => x !== undefined), 'ไม่มีอะไรให้แก้')

export const entryIdParam = z.object({ id: z.coerce.number().int().positive() })

// query string มาเป็น string เสมอ — แปลงที่ boundary ตรงนี้ที่เดียว
// ตัวกรองซ้าย (หมวด/auth/HTTPS/CORS) ทำในเบราว์เซอร์กับ Catalogue ที่โหลดไว้แล้ว — server รับแค่คำค้น
export const searchQuery = z.object({
  q: z.string().trim().min(1).max(200),
})
export type SearchQuery = z.infer<typeof searchQuery>

/** Entry ฉบับที่ส่งให้เบราว์เซอร์ — ข้อมูลสาธารณะล้วน ไม่มี tags / เวลา */
export interface CatalogueEntry { id: number, name: string, url: string, description: string, categories: string[], auth: Auth, https: boolean, cors: Cors, source: typeof SOURCE[number] }

export interface SearchHit {
  entry: CatalogueEntry
  /** null = ไม่ได้ผ่าน Ranker (ไล่ดูทั้งคลัง) */
  score: number | null
}

/** ผลของ Ranker เป็น id + คะแนนเท่านั้น — ข้อมูล Entry อยู่ใน Catalogue ฝั่งเบราว์เซอร์แล้ว ไม่ส่งซ้ำ */
export interface SearchResponse {
  kind: 'match' | 'no_match'
  ranker: string
  confidence: number
  candidates: number
  hits: { entryId: number, score: number }[]
}

export interface CatalogueFilters {
  category?: string
  auth?: Auth
  https?: boolean
  cors?: Cors
}

export function matchesFilters(e: CatalogueEntry, f: CatalogueFilters): boolean {
  return (!f.category || e.categories.includes(f.category))
    && (!f.auth || e.auth === f.auth)
    && (f.https === undefined || e.https === f.https)
    && (!f.cors || e.cors === f.cors)
}

/**
 * ไม่มีคำค้น = ทั้งคลังตามตัวอักษร · มีคำค้น = ลำดับของ Ranker แล้วกรองทีหลัง
 * Ranker จัดอันดับทั้งคลัง (ไม่ตัด limit) การกรองทีหลังจึงได้ชุดเดียวกับกรองก่อน
 * id ที่ไม่อยู่ใน Catalogue แล้ว (เพิ่งลบ) ถูกข้ามไป
 */
export function visibleHits(catalogue: CatalogueEntry[], search: SearchResponse | null, f: CatalogueFilters): SearchHit[] {
  if (!search) return catalogue.filter(e => matchesFilters(e, f)).map(entry => ({ entry, score: null }))
  const byId = new Map(catalogue.map(e => [e.id, e]))
  const out: SearchHit[] = []
  for (const h of search.hits) {
    const entry = byId.get(h.entryId)
    if (entry && matchesFilters(entry, f)) out.push({ entry, score: h.score })
  }
  return out
}

/** หมวดทั้งหมด + จำนวน เรียงตามชื่อ — คำนวณจาก Catalogue ในเบราว์เซอร์ */
export function categoryCounts(catalogue: CatalogueEntry[]): { name: string, count: number }[] {
  const counts = new Map<string, number>()
  for (const e of catalogue) for (const c of e.categories) counts.set(c, (counts.get(c) ?? 0) + 1)
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
}
