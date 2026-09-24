import { claudeRanker } from './claude'
import { keywordRanker } from './keyword'
import type { Ranker } from './types'

export type { EntryForRanking, Ranker, RankResult } from './types'

/** เลือก Ranker จาก env RANKER — ตัวที่ยังไม่มีให้ล้มดัง ๆ แทนที่จะแอบใช้ keyword */
export function getRanker(name = process.env.RANKER || 'keyword'): Ranker {
  switch (name) {
    case 'keyword': return keywordRanker
    case 'claude': return claudeRanker
    case 'jev':
      throw new Error(`Ranker "${name}" is not implemented yet (v1.0.0)`)
    default:
      throw new Error(`Unknown RANKER "${name}"`)
  }
}
