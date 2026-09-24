import { z } from 'zod'

export const AUTH = ['none', 'api_key', 'oauth', 'x_mashape_key', 'user_agent'] as const
export const CORS = ['yes', 'no', 'unknown'] as const
export const SOURCE = ['public_apis', 'manual'] as const

export type Auth = typeof AUTH[number]
export type Cors = typeof CORS[number]

/** Entry ที่พร้อมลงตาราง — ทั้ง importer และฟอร์มเพิ่มเอง (v1.0.0) ใช้ตัวเดียวกัน */
export const entryInput = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.url({ protocol: /^https?$/ }),
  description: z.string().trim().min(1).max(500),
  categories: z.array(z.string().trim().min(1)).min(1),
  auth: z.enum(AUTH),
  https: z.boolean(),
  cors: z.enum(CORS),
  source: z.enum(SOURCE),
})
export type EntryInput = z.infer<typeof entryInput>

// query string มาเป็น string เสมอ — แปลงที่ boundary ตรงนี้ที่เดียว
export const searchQuery = z.object({
  q: z.string().trim().max(200).optional().default(''),
  category: z.string().trim().min(1).optional(),
  auth: z.enum(AUTH).optional(),
  https: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  cors: z.enum(CORS).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})
export type SearchQuery = z.infer<typeof searchQuery>

export interface SearchHit {
  entry: { id: number, name: string, url: string, description: string, categories: string[], auth: Auth, https: boolean, cors: Cors }
  score: number | null
}

export interface SearchResponse {
  /** browse = ไม่มีคำค้น แสดงตามตัวอักษร ไม่ผ่าน Ranker */
  kind: 'match' | 'no_match' | 'browse'
  ranker: string | null
  confidence: number | null
  candidates: number
  hits: SearchHit[]
}
