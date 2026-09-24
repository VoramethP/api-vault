import dict from './thai-dict.json'
import { MAX_WEIGHT, entryWords, tokenWeight, tokenize } from './keyword'
import type { EntryForRanking, Ranker, RankResult } from './types'

// ค้นไทยแบบไม่มีค่าใช้จ่าย (ผู้ใช้เลือก 2026-09-24): ตัดคำด้วย Intl.Segmenter → แปลงวลีไทยด้วยพจนานุกรม
// → ให้คะแนนแบบเดียวกับ keyword ranker · ไม่พึ่งบริการภายนอก (ADR-0003) · คำอังกฤษในคำค้นใช้ได้ตามเดิม

/** วลีไทยยาวสุดที่ลองจับ (นับเป็นท่อนที่ Segmenter ตัด) — "อัตรา/แลก/เปลี่ยน" = 3 ท่อน */
const MAX_PHRASE_SEGMENTS = 6

export interface Filters { auth?: 'none', cors?: 'yes', https?: true }

/** หนึ่งความต้องการในคำค้น — ตรงแค่ทางเลือกใดทางเลือกหนึ่งก็พอ · ทางเลือกหนึ่งอาจมีหลายคำ ("currency exchange") */
export interface Concept { source: string, alternatives: string[][] }

export interface ParsedQuery { concepts: Concept[], unknown: string[], filters: Filters }

// เงื่อนไขที่พูดเป็นประโยค → ตัวกรอง · จับจากข้อความดิบก่อนตัดคำ แล้วลบทิ้ง ไม่ให้ไปนับเป็นคำค้น
const CONDITIONS: { re: RegExp, filter: Filters }[] = [
  { re: /ไม่\s*(?:ต้อง)?\s*(?:ใช้|มี|สมัคร(?:ขอ)?)\s*(?:api\s*)?(?:key|คีย์|token|โทเค็น|โทเคน)|ไม่ต้องสมัคร(?:สมาชิก)?|no\s*(?:api\s*)?key|without\s+(?:an?\s+)?(?:api\s+)?key/giu, filter: { auth: 'none' } },
  { re: /(?:เรียก|ใช้)?\s*(?:จาก|บน|ใน)?\s*(?:เบราว์เซอร์|บราวเซอร์|browser|ฝั่ง\s*(?:client|ไคลเอนต์|หน้าบ้าน)|frontend|ฟรอนต์เอนด์)|cors/giu, filter: { cors: 'yes' } },
  { re: /https/giu, filter: { https: true } },
]

const phrases = dict.phrases as Record<string, string[]>
const stopwords = new Set(dict.stopwords)
const THAI = /\p{Script=Thai}/u

export function parseQuery(query: string): ParsedQuery {
  let rest = query.toLowerCase()
  const filters: Filters = {}
  for (const c of CONDITIONS) {
    if (c.re.test(rest)) Object.assign(filters, c.filter)
    c.re.lastIndex = 0
    rest = rest.replace(c.re, ' ')
  }

  // สร้าง Segmenter ต่อการเรียก — ไม่มี state ระดับ module (ADR-0005)
  const segments = [...new Intl.Segmenter('th', { granularity: 'word' }).segment(rest)]
    .filter(s => s.isWordLike).map(s => s.segment)

  const concepts: Concept[] = []
  const unknown: string[] = []
  for (let i = 0; i < segments.length;) {
    const seg = segments[i]!
    if (!THAI.test(seg)) {
      // คำอังกฤษ/ตัวเลข → หนึ่งความต้องการต่อคำ เหมือน keyword ranker
      for (const t of tokenize(seg)) concepts.push({ source: t, alternatives: [[t]] })
      i++
      continue
    }
    // จับวลียาวที่สุดก่อน — "อัตราแลกเปลี่ยน" ต้องชนะ "อัตรา" + "แลก" + "เปลี่ยน"
    let matched = false
    for (let j = Math.min(segments.length, i + MAX_PHRASE_SEGMENTS); j > i; j--) {
      const phrase = segments.slice(i, j).join('')
      const terms = phrases[phrase]
      if (terms) {
        concepts.push({ source: phrase, alternatives: terms.map(tokenize).filter(t => t.length) })
        i = j
        matched = true
        break
      }
    }
    if (matched) continue
    if (!stopwords.has(seg)) unknown.push(seg)
    i++
  }
  // "แมว" สองครั้งในคำค้นเดียวไม่ควรนับน้ำหนักสองเท่า
  const seen = new Set<string>()
  return { concepts: concepts.filter(c => !seen.has(c.source) && seen.add(c.source)), unknown, filters }
}

function passes(e: EntryForRanking, f: Filters): boolean {
  return (!f.auth || e.auth === f.auth) && (!f.cors || e.cors === f.cors) && (!f.https || e.https)
}

export const thaiDictRanker: Ranker = {
  name: 'thai-dict',
  async rank(query, candidates, { limit }): Promise<RankResult> {
    const { concepts, unknown, filters } = parseQuery(query)
    // ไม่รู้จักสักคำ = ไม่รู้ว่าผู้ใช้อยากได้อะไร → ตอบตรง ๆ ว่าไม่เจอ ดีกว่าโชว์ทุกอย่างที่แค่ผ่านตัวกรอง
    if (!concepts.length) return { kind: 'no_match', confidence: 0 }

    const found = new Set<string>()
    const scored = candidates.filter(e => passes(e, filters)).map((e) => {
      const words = entryWords(e)
      let score = 0
      for (const c of concepts) {
        // วลีหลายคำนับเท่าคำที่อ่อนที่สุดในวลี — "currency exchange" ต้องเจอทั้งสองคำ
        const best = Math.max(0, ...c.alternatives.map(alt => Math.min(...alt.map(t => tokenWeight(words, t)))))
        if (best) found.add(c.source)
        score += best
      }
      return { entryId: e.id, score: score / (concepts.length * MAX_WEIGHT), name: e.name }
    }).filter(s => s.score > 0)
    if (!scored.length) return { kind: 'no_match', confidence: 0 }

    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    // คำไทยที่พจนานุกรมไม่รู้จักคือส่วนของความต้องการที่ไม่ได้ถูกค้นเลย → ลดความมั่นใจตามสัดส่วน
    return {
      kind: 'match',
      hits: scored.slice(0, limit).map(({ entryId, score }) => ({ entryId, score })),
      confidence: found.size / (concepts.length + unknown.length),
    }
  },
}
