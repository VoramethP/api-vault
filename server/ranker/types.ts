import type { Auth, Cors } from '../../shared/entry'

// Ranker เห็นได้แค่ข้อมูลสาธารณะของ Entry — ห้ามเพิ่ม field จาก Vault ที่นี่ (ADR-0002, ADR-0003)
export interface EntryForRanking {
  id: number
  name: string
  description: string
  categories: string[]
  auth: Auth
  https: boolean
  cors: Cors
}

export type RankResult =
  | { kind: 'match', hits: { entryId: number, score: number }[], confidence: number }
  | { kind: 'no_match', confidence: number }

export interface Ranker {
  readonly name: 'keyword' | 'jev' | 'claude'
  rank(query: string, candidates: EntryForRanking[], opts: { limit: number }): Promise<RankResult>
}
