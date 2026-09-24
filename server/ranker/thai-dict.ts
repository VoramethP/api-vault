import dict from './thai-dict.json'
import { MAX_WEIGHT, entryWords, tokenWeight, tokenize, type EntryWords } from './keyword'
import type { EntryForRanking, Ranker, RankResult } from './types'

// ค้นไทยแบบไม่มีค่าใช้จ่าย (ผู้ใช้เลือก 2026-09-24): ตัดคำด้วย Intl.Segmenter → แปลงวลีไทยด้วยพจนานุกรม
// → ให้คะแนนแบบเดียวกับ keyword ranker · ไม่พึ่งบริการภายนอก (ADR-0003) · คำอังกฤษในคำค้นใช้ได้ตามเดิม

/** วลีไทยยาวสุดที่ลองจับ (นับเป็นท่อนที่ Segmenter ตัด) — "อัตรา/แลก/เปลี่ยน" = 3 ท่อน */
const MAX_PHRASE_SEGMENTS = 6

export interface Filters { auth?: 'none', cors?: 'yes', https?: true }

/** หนึ่งความต้องการในคำค้น — ตรงแค่ทางเลือกใดทางเลือกหนึ่งก็พอ · ทางเลือกหนึ่งอาจมีหลายคำ ("currency exchange") */
export interface Concept { source: string, alternatives: string[][], soft?: boolean }

/** thaiOnly = ความต้องการเฉพาะของไทยที่ Catalogue ไม่มีบริการรองรับ (หวย, พร้อมเพย์, ปตท…) */
/** exclude = ชื่อที่ผู้ใช้บอกว่าไม่เอา ("ที่ไม่ใช่ google map") */
export interface ParsedQuery { concepts: Concept[], unknown: string[], filters: Filters, thaiOnly: string[], prefersFree: boolean, exclude: string[] }

// เงื่อนไขที่พูดเป็นประโยค → ตัวกรอง · จับจากข้อความดิบก่อนตัดคำ แล้วลบทิ้ง ไม่ให้ไปนับเป็นคำค้น
const CONDITIONS: { re: RegExp, filter: Filters }[] = [
  { re: /ไม่\s*(?:ต้อง)?\s*(?:ใช้|มี|สมัคร(?:ขอ)?)\s*(?:api\s*)?(?:key|คีย์|token|โทเค็น|โทเคน)|ไม่ต้องสมัคร(?:สมาชิก)?|no\s*(?:api\s*)?key|without\s+(?:an?\s+)?(?:api\s+)?key/giu, filter: { auth: 'none' } },
  { re: /(?:เรียก|ใช้)?\s*(?:จาก|บน|ใน)?\s*(?:เบราว์เซอร์|บราวเซอร์|browser|ฝั่ง\s*(?:client|ไคลเอนต์|หน้าบ้าน)|frontend|ฟรอนต์เอนด์)|เรียก\s*(?:จาก|บน|ใน)\s*(?:หน้า)?เว็บ|cors/giu, filter: { cors: 'yes' } },
  { re: /https/giu, filter: { https: true } },
]

// "ไม่ใช่ google map" / "alternative to firebase" → ตัดตัวนั้นออก ไม่ใช่เอามาเป็นคำค้น (เดิม Google Maps ขึ้นอันดับหนึ่ง)
// จับเฉพาะชื่ออังกฤษที่ตามหลัง — ชื่อบริการที่คนพิมพ์มักเป็นอังกฤษ และตัดขอบเขตได้ชัดกว่าคำไทย
const NEGATION = /(?:ที่)?(?:ไม่ใช่|ไม่เอา|นอกจาก|แทน)\s*([a-z0-9][a-z0-9.\-]*(?:\s+[a-z0-9][a-z0-9.\-]*)?)|\b(?:not|other than|except|alternatives? to|instead of)\s+([a-z0-9][a-z0-9.\-]*(?:\s+[a-z0-9][a-z0-9.\-]*)?)/giu

const phrases = dict.phrases as Record<string, string[]>
const stopwords = new Set(dict.stopwords)
const englishStopwords = new Set(dict.englishStopwords)
// คำระบุประเทศ/ภาษา — Catalogue แทบไม่มี API เฉพาะประเทศ ถ้านับเต็มน้ำหนัก API ที่แค่ชื่อมี "Thai" จะชนะตัวที่ตรงความต้องการจริง
const soft = new Set(dict.soft)
const THAI = /\p{Script=Thai}/u
// ยาวก่อน — "ย่อลิ้งค์" ต้องถูกแทนทั้งคำก่อนที่ "ลิ้งค์" จะไปแทนแค่ครึ่งหลัง
const variants = Object.entries(dict.variants as Record<string, string>).sort((a, b) => b[0].length - a[0].length)
const thaiOnlyWords = dict.thaiOnly as string[]
const englishAliases = dict.englishAliases as Record<string, string[]>
const phraseKeys = Object.keys(phrases)

/** ระยะแก้คำ (Levenshtein) หยุดทันทีเมื่อเกิน max — ใช้กับคำสะกดผิดเล็กน้อย */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
      rowMin = Math.min(rowMin, cur[j]!)
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]!
}

// คำสั้นแก้ตัวเดียวก็กลายเป็นคำอื่นได้ง่าย — ยอมให้ผิดได้เฉพาะคำที่ยาวพอ
const allowedTypos = (len: number) => (len >= 9 ? 2 : len >= 5 ? 1 : 0)

/** คำไทยที่ไม่อยู่ในพจนานุกรม → คำในพจนานุกรมที่ใกล้ที่สุด ถ้าต่างกันไม่เกินที่ยอมได้ */
function fuzzyPhrase(text: string): string | null {
  let best: { key: string, d: number } | null = null
  for (const key of phraseKeys) {
    const max = allowedTypos(Math.min(key.length, text.length))
    if (!max) continue
    const d = editDistance(text, key, max)
    if (d <= max && (!best || d < best.d || (d === best.d && key.length > best.key.length))) best = { key, d }
  }
  return best?.key ?? null
}

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
  // "ฟรี" = อยากได้ตัวที่ไม่ต้องสมัคร แต่ไม่ใช่เงื่อนไขบังคับ (หลาย API มี key ฟรี) → เอียงอันดับ ไม่กรองทิ้ง
  const prefersFree = /ฟรี|\bfree\b/u.test(rest)
  const filters: Filters = {}
  const exclude: string[] = []
  rest = rest.replace(NEGATION, (_, th?: string, en?: string) => {
    // ชื่อแรกพอ ("google map" → google) — ตัด Google Maps, Google Earth ฯลฯ ออกทั้งตระกูล
    const first = tokenize(th ?? en ?? '')[0]
    if (first) exclude.push(first)
    return ' '
  })
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
      for (const t of tokenize(seg)) {
        if (englishStopwords.has(t)) continue
        concepts.push({ source: t, alternatives: (englishAliases[t] ?? [t]).map(tokenize).filter(a => a.length) })
      }
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
    if (stopwords.has(seg)) { i++; continue }
    // สะกดผิด: ลองต่อท่อนที่ติดกัน (ยาวก่อน) แล้วเทียบกับคำในพจนานุกรมแบบยอมผิดเล็กน้อย
    for (let j = Math.min(segments.length, i + MAX_PHRASE_SEGMENTS); j > i; j--) {
      const text = segments.slice(i, j).join('')
      if (!THAI.test(text)) continue
      const key = fuzzyPhrase(text)
      if (key) {
        concepts.push({ source: key, alternatives: phrases[key]!.map(tokenize).filter(t => t.length), soft: soft.has(key) })
        i = j
        matched = true
        break
      }
    }
    if (matched) continue
    unknown.push(seg)
    i++
  }
  // "แมว" สองครั้งในคำค้นเดียวไม่ควรนับน้ำหนักสองเท่า · "ตัดคำ nlp" = พูดเรื่องเดียวกันสองภาษา นับครั้งเดียว
  const seen = new Set<string>()
  const unique = concepts.filter(c => !seen.has(c.source) && seen.add(c.source))
  const key = (alt: string[]) => alt.join(' ')
  const thaiTerms = new Set(unique.filter(c => THAI.test(c.source)).flatMap(c => c.alternatives.map(key)))
  const merged = unique.filter(c => THAI.test(c.source) || !c.alternatives.some(a => thaiTerms.has(key(a))))
  return { concepts: merged, unknown, filters, thaiOnly, prefersFree, exclude }
}

/**
 * ตัวตัดสินเมื่อคะแนนเท่ากัน: ความต้องการที่เจอในหลายช่อง (ชื่อ + หมวด + คำอธิบาย) น่าจะตรงกว่าเจอช่องเดียว
 * ให้แค่ +0.1 ต่อช่อง (น้อยกว่าช่องว่างระหว่างน้ำหนักชื่อ/หมวด/คำอธิบาย) และเฉพาะเมื่อตรงอยู่แล้ว
 */
function fieldBonus(words: EntryWords, c: Concept): number {
  let best = 0
  for (const alt of c.alternatives) {
    const fields = [words.name, words.cats, words.desc]
      .filter(f => alt.every(t => tokenWeight({ name: f, cats: [], desc: [] }, t) > 0)).length
    best = Math.max(best, fields)
  }
  return best > 1 ? 0.1 * (best - 1) : 0
}

function passes(e: EntryForRanking, f: Filters): boolean {
  return (!f.auth || e.auth === f.auth) && (!f.cors || e.cors === f.cors) && (!f.https || e.https)
}

export const thaiDictRanker: Ranker = {
  name: 'thai-dict',
  async rank(query, candidates, { limit }): Promise<RankResult> {
    const { concepts, unknown, filters, thaiOnly, prefersFree, exclude } = parseQuery(query)
    // รู้แน่ว่า Catalogue ไม่มี → ตอบว่าไม่เจอด้วยความมั่นใจสูง ดีกว่าคืน API ต่างประเทศที่ใกล้เคียงผิวเผิน
    if (thaiOnly.length) return { kind: 'no_match', confidence: 0.8 }
    let core = concepts.filter(c => !c.soft)
    let extra = concepts.filter(c => c.soft)
    // ประโยคที่มีแต่คำเสริม ("ไลน์บอท") — คำเสริมคือสิ่งที่ผู้ใช้อยากได้จริง
    if (!core.length) [core, extra] = [extra, []]
    // ไม่รู้จักความต้องการสักคำ = ไม่รู้ว่าผู้ใช้อยากได้อะไร → ตอบตรง ๆ ว่าไม่เจอ ดีกว่าโชว์ทุกอย่างที่แค่ผ่านตัวกรอง
    if (!core.length) return { kind: 'no_match', confidence: 0 }

    const conceptWeight = (words: EntryWords, cats: string[], c: Concept) => Math.max(0, ...c.alternatives.map((alt) => {
      // ความต้องการตรงกับชื่อหมวดทั้งหมวด ("weather" = หมวด Weather) มีน้ำหนักเท่าตรงชื่อ
      // ไม่งั้น API ในหมวดที่ถูกต้องแพ้ตัวที่แค่ชื่อมีคำนั้น (Open-Meteo แพ้ "US Weather")
      if (cats.includes(alt.join(' '))) return MAX_WEIGHT
      // วลีหลายคำนับเท่าคำที่อ่อนที่สุดในวลี — "currency exchange" ต้องเจอทั้งสองคำ
      return Math.min(...alt.map(t => tokenWeight(words, t)))
    })) + fieldBonus(words, c)

    const found = new Set<string>()
    const scored = candidates.filter(e => passes(e, filters) && !exclude.some(x => tokenize(e.name).includes(x))).map((e) => {
      const words = entryWords(e)
      const cats = e.categories.map(c => tokenize(c).join(' '))
      let sum = 0
      let hits = 0
      for (const c of core) {
        const w = conceptWeight(words, cats, c)
        if (w) { found.add(c.source); hits++ }
        sum += w
      }
      // coordination: ตรงหลายความต้องการ > ตรงชื่อแค่คำเดียว — ไม่งั้น "Contentful Images" ชนะ Pexels เพราะชื่อมีคำว่า image
      let score = (sum / (core.length * MAX_WEIGHT)) * (hits / core.length)
      // คำเสริมเพิ่มได้ไม่เกิน 10% และไม่ช่วยตัวที่ไม่ตรงความต้องการหลักเลย
      if (hits && extra.some(c => conceptWeight(words, cats, c))) score *= 1.1
      // คะแนนใกล้กัน → ตัวที่ใช้ง่ายกว่าขึ้นก่อน (ไม่ต้องใช้ key, เรียกจากเบราว์เซอร์ได้, HTTPS) · สูงสุด +8%
      score *= 1 + 0.02 * ((e.auth === 'none' ? 2 : 0) + (e.cors === 'yes' ? 1 : 0) + (e.https ? 1 : 0))
      if (prefersFree && e.auth === 'none') score *= 1.1
      // เรียงด้วยคะแนนดิบ (ตัวตัดสินข้างบนดันเกิน 1 ได้) · ตัดไว้ที่ 1 เฉพาะตอนส่งออก
      return { entryId: e.id, score, name: e.name }
    }).filter(s => s.score > 0)
    if (!scored.length) return { kind: 'no_match', confidence: 0 }

    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    // คำไทยที่พจนานุกรมไม่รู้จักคือส่วนของความต้องการที่ไม่ได้ถูกค้นเลย → ลดความมั่นใจตามสัดส่วน
    return {
      kind: 'match',
      hits: scored.slice(0, limit).map(({ entryId, score }) => ({ entryId, score: Math.min(1, score) })),
      confidence: found.size / (core.length + unknown.length),
    }
  },
}
