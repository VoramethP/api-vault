import type { EntryForRanking, Ranker, RankResult } from './types'

// คำที่อยู่แทบทุก Entry — นับไปก็ไม่ช่วยแยกอะไร
const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'with', 'by', 'api', 'apis', 'get', 'free', 'i', 'want', 'need'])

const W_NAME = 3
const W_CATEGORY = 2
const W_DESCRIPTION = 1

export function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(t => t.length >= 2 && !STOPWORDS.has(t))
}

// "cat" ต้องเจอ "cats" · "weather" ต้องเจอ "weathering" · แต่คำสั้นอย่าง "go" ห้ามไปเจอ "google"
function hit(words: string[], token: string): boolean {
  return words.some(w => w === token || w === `${token}s` || w === `${token}es`
    || (token.length >= 4 && w.startsWith(token)))
}

export function scoreEntry(tokens: string[], e: EntryForRanking): { score: number, matched: Set<string> } {
  const name = tokenize(e.name)
  const cats = e.categories.flatMap(tokenize)
  const desc = tokenize(e.description)
  let score = 0
  const matched = new Set<string>()
  for (const t of tokens) {
    const w = hit(name, t) ? W_NAME : hit(cats, t) ? W_CATEGORY : hit(desc, t) ? W_DESCRIPTION : 0
    if (w) matched.add(t)
    score += w
  }
  return { score: score / (tokens.length * W_NAME), matched }
}

/** ค้นคำอังกฤษธรรมดา ไม่พึ่งบริการภายนอก — Ranker ตัวแรกของ v0.1.0 (ADR-0003) */
export const keywordRanker: Ranker = {
  name: 'keyword',
  async rank(query, candidates, { limit }): Promise<RankResult> {
    // คำไทยไม่ตรงกับข้อมูลอังกฤษอยู่แล้ว → ได้ no_match ซึ่งซื่อสัตย์กว่าเดา
    const tokens = [...new Set(tokenize(query))]
    if (!tokens.length) return { kind: 'no_match', confidence: 0 }
    const found = new Set<string>()
    const scored = candidates.map((e) => {
      const { score, matched } = scoreEntry(tokens, e)
      matched.forEach(t => found.add(t))
      return { entryId: e.id, score, name: e.name }
    }).filter(s => s.score > 0)
    if (!scored.length) return { kind: 'no_match', confidence: 0 }
    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    return {
      kind: 'match',
      hits: scored.slice(0, limit).map(({ entryId, score }) => ({ entryId, score })),
      confidence: found.size / tokens.length,
    }
  },
}
