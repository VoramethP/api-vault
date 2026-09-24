import dict from './thai-dict.json'
import { MAX_WEIGHT, entryWords, tokenWeight, tokenize } from './keyword'
import type { EntryForRanking, Ranker, RankResult } from './types'

// ค้นไทยแบบไม่มีค่าใช้จ่าย (ผู้ใช้เลือก 2026-09-24): ตัดคำด้วย Intl.Segmenter → แปลงวลีไทยด้วยพจนานุกรม
// → ให้คะแนนแบบเดียวกับ keyword ranker · ไม่พึ่งบริการภายนอก (ADR-0003) · คำอังกฤษในคำค้นใช้ได้ตามเดิม

/** วลีไทยยาวสุดที่ลองจับ (นับเป็นท่อนที่ Segmenter ตัด) — "อัตรา/แลก/เปลี่ยน" = 3 ท่อน */
const MAX_PHRASE_SEGMENTS = 6

export interface Filters { auth?: 'none', cors?: 'yes', https?: true }

/** หนึ่งความต้องการในคำค้น — ตรงแค่ทางเลือกใดทางเลือกหนึ่งก็พอ · ทางเลือกหนึ่งอาจมีหลายคำ ("currency exchange") */
export interface Concept { source: string, alternatives: string[][], soft?: boolean }

/** thaiOnly = ความต้องการเฉพาะของไทยที่ Catalogue ไม่มีบริการรองรับ (หวย, พร้อมเพย์, ปตท…) */
export interface ParsedQuery { concepts: Concept[], unknown: string[], filters: Filters, thaiOnly: string[] }

// เงื่อนไขที่พูดเป็นประโยค → ตัวกรอง · จับจากข้อความดิบก่อนตัดคำ แล้วลบทิ้ง ไม่ให้ไปนับเป็นคำค้น
const CONDITIONS: { re: RegExp, filter: Filters }[] = [
  { re: /ไม่\s*(?:ต้อง)?\s*(?:ใช้|มี|สมัคร(?:ขอ)?)\s*(?:api\s*)?(?:key|คีย์|token|โทเค็น|โทเคน)|ไม่ต้องสมัคร(?:สมาชิก)?|no\s*(?:api\s*)?key|without\s+(?:an?\s+)?(?:api\s+)?key/giu, filter: { auth: 'none' } },
  { re: /(?:เรียก|ใช้)?\s*(?:จาก|บน|ใน)?\s*(?:เบราว์เซอร์|บราวเซอร์|browser|ฝั่ง\s*(?:client|ไคลเอนต์|หน้าบ้าน)|frontend|ฟรอนต์เอนด์)|cors/giu, filter: { cors: 'yes' } },
  { re: /https/giu, filter: { https: true } },
]

const phrases = dict.phrases as Record<string, string[]>
const stopwords = new Set(dict.stopwords)
const englishStopwords = new Set(dict.englishStopwords)
// คำระบุประเทศ/ภาษา — Catalogue แทบไม่มี API เฉพาะประเทศ ถ้านับเต็มน้ำหนัก API ที่แค่ชื่อมี "Thai" จะชนะตัวที่ตรงความต้องการจริง
const soft = new Set(dict.soft)
const THAI = /\p{Script=Thai}/u
// ยาวก่อน — "ย่อลิ้งค์" ต้องถูกแทนทั้งคำก่อนที่ "ลิ้งค์" จะไปแทนแค่ครึ่งหลัง
const variants = Object.entries(dict.variants as Record<string, string>).sort((a, b) => b[0].length - a[0].length)
const thaiOnlyWords = dict.thaiOnly as string[]

/** ทำให้คำที่พิมพ์ต่างกันแต่หมายถึงคำเดียวกันกลายเป็นแบบเดียว ก่อนตัดคำ */
export function normalizeThai(text: string): string {
  let t = text.normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // อักขระล่องหนที่ติดมากับการคัดลอก
    .replace(/เเ/g, 'แ') // พิมพ์ เ สองตัวแทน แ — เห็นเหมือนกันแต่คนละอักขระ
    .replace(/\u0E4D\u0E32/g, 'ำ') // นิคหิต + สระอา แทน สระอำ
  for (const [from, to] of variants) t = t.split(from).join(to)
  return t
}

export function parseQuery(query: string): ParsedQuery {
  let rest = normalizeThai(query.toLowerCase())
  const thaiOnly = thaiOnlyWords.filter(w => rest.includes(w))
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
      for (const t of tokenize(seg)) if (!englishStopwords.has(t)) concepts.push({ source: t, alternatives: [[t]] })
      i++
      continue
    }
    // จับวลียาวที่สุดก่อน — "อัตราแลกเปลี่ยน" ต้องชนะ "อัตรา" + "แลก" + "เปลี่ยน"
    let matched = false
    for (let j = Math.min(segments.length, i + MAX_PHRASE_SEGMENTS); j > i; j--) {
      const phrase = segments.slice(i, j).join('')
      const terms = phrases[phrase]
      if (terms) {
        concepts.push({ source: phrase, alternatives: terms.map(tokenize).filter(t => t.length), soft: soft.has(phrase) })
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
  return { concepts: concepts.filter(c => !seen.has(c.source) && seen.add(c.source)), unknown, filters, thaiOnly }
}

function passes(e: EntryForRanking, f: Filters): boolean {
  return (!f.auth || e.auth === f.auth) && (!f.cors || e.cors === f.cors) && (!f.https || e.https)
}

export const thaiDictRanker: Ranker = {
  name: 'thai-dict',
  async rank(query, candidates, { limit }): Promise<RankResult> {
    const { concepts, unknown, filters, thaiOnly } = parseQuery(query)
    // รู้แน่ว่า Catalogue ไม่มี → ตอบว่าไม่เจอด้วยความมั่นใจสูง ดีกว่าคืน API ต่างประเทศที่ใกล้เคียงผิวเผิน
    if (thaiOnly.length) return { kind: 'no_match', confidence: 0.8 }
    const core = concepts.filter(c => !c.soft)
    const extra = concepts.filter(c => c.soft)
    // ไม่รู้จักความต้องการหลักสักคำ = ไม่รู้ว่าผู้ใช้อยากได้อะไร → ตอบตรง ๆ ว่าไม่เจอ ดีกว่าโชว์ทุกอย่างที่แค่ผ่านตัวกรอง
    if (!core.length) return { kind: 'no_match', confidence: 0 }

    const conceptWeight = (words: ReturnType<typeof entryWords>, c: Concept) =>
      // วลีหลายคำนับเท่าคำที่อ่อนที่สุดในวลี — "currency exchange" ต้องเจอทั้งสองคำ
      Math.max(0, ...c.alternatives.map(alt => Math.min(...alt.map(t => tokenWeight(words, t)))))

    const found = new Set<string>()
    const scored = candidates.filter(e => passes(e, filters)).map((e) => {
      const words = entryWords(e)
      let sum = 0
      let hits = 0
      for (const c of core) {
        const w = conceptWeight(words, c)
        if (w) { found.add(c.source); hits++ }
        sum += w
      }
      // coordination: ตรงหลายความต้องการ > ตรงชื่อแค่คำเดียว — ไม่งั้น "Contentful Images" ชนะ Pexels เพราะชื่อมีคำว่า image
      let score = (sum / (core.length * MAX_WEIGHT)) * (hits / core.length)
      // คำเสริมเพิ่มได้ไม่เกิน 10% และไม่ช่วยตัวที่ไม่ตรงความต้องการหลักเลย
      if (hits && extra.some(c => conceptWeight(words, c))) score = Math.min(1, score * 1.1)
      return { entryId: e.id, score, name: e.name }
    }).filter(s => s.score > 0)
    if (!scored.length) return { kind: 'no_match', confidence: 0 }

    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    // คำไทยที่พจนานุกรมไม่รู้จักคือส่วนของความต้องการที่ไม่ได้ถูกค้นเลย → ลดความมั่นใจตามสัดส่วน
    return {
      kind: 'match',
      hits: scored.slice(0, limit).map(({ entryId, score }) => ({ entryId, score })),
      confidence: found.size / (core.length + unknown.length),
    }
  },
}
