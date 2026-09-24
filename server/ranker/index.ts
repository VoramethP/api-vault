import { claudeRanker } from './claude'
import { keywordRanker } from './keyword'
import { thaiDictRanker } from './thai-dict'
import type { Ranker } from './types'

export type { EntryForRanking, Ranker, RankResult } from './types'

/** เลือก Ranker จาก env RANKER — ตัวที่ยังไม่มีให้ล้มดัง ๆ แทนที่จะแอบใช้ keyword */
export function getRanker(name = process.env.RANKER || 'thai-dict'): Ranker {
  switch (name) {
    case 'keyword': return keywordRanker
    case 'thai-dict': return thaiDictRanker
    case 'claude': return claudeRanker
    case 'jev':
      throw new Error(`Ranker "${name}" is not implemented yet (v1.0.0)`)
    default:
      throw new Error(`Unknown RANKER "${name}"`)
  }
}
