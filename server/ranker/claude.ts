import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import type { EntryForRanking, Ranker, RankResult } from './types'

// ADR-0003 ตัวสำรองเมื่อ Jev ยังไม่มา · ส่งแค่ข้อมูลสาธารณะของ Entry (EntryForRanking) — ไม่มีอะไรจาก Vault (ADR-0002)
export const CLAUDE_RANKER_MODEL = 'claude-opus-5'

const SYSTEM = `คุณคือ Ranker ของคลัง API สาธารณะ รับคำค้น (ไทยหรืออังกฤษ) แล้วเลือก API จากแคตตาล็อกด้านล่างที่ตอบสิ่งที่ผู้ใช้ต้องการได้จริง

- เลือกเฉพาะ id ที่อยู่ในแคตตาล็อก เรียงจากตรงที่สุด ไม่เกินจำนวนที่ขอ
- score (0–1) = โอกาสที่ API นั้นตอบความต้องการได้ · confidence (0–1) = ความมั่นใจว่าชุดผลนี้ถูกต้อง
- เงื่อนไขในคำค้นสำคัญ เช่น "ไม่ต้องใช้ key" = auth ต้องเป็น none, "เรียกจากเบราว์เซอร์" = cors ต้องเป็น yes
- ถ้าไม่มี API ไหนตอบได้จริง ให้ตอบ kind = "no_match" และ hits ว่าง — อย่าเดาเอาตัวที่ใกล้เคียงแบบผิวเผินมาใส่

แคตตาล็อก (id | ชื่อ | หมวด | auth | https | cors | คำอธิบาย):`

const Output = z.object({
  kind: z.enum(['match', 'no_match']),
  confidence: z.number(),
  hits: z.array(z.object({ id: z.number(), score: z.number() })),
})
export type ClaudeRankOutput = z.infer<typeof Output>

/**
 * แคตตาล็อกเป็นข้อความชุดเดียวกันทุกครั้งที่ candidates เหมือนเดิม → prompt cache ใช้ซ้ำได้
 * เรียงตาม id เสมอ ห้ามมีอะไรที่เปลี่ยนต่อ request (เวลา, คำค้น) ในนี้
 */
export function buildCatalogue(candidates: EntryForRanking[]): string {
  return [...candidates].sort((a, b) => a.id - b.id)
    .map(e => [e.id, e.name, e.categories.join(', '), e.auth, e.https ? 'https' : 'http', e.cors, e.description.replace(/\s+/g, ' ')].join(' | '))
    .join('\n')
}

const clamp = (n: number) => Math.min(1, Math.max(0, n))

/** โมเดลอาจตอบ id ที่ไม่มีจริงหรือซ้ำ — ตัดทิ้งตรงนี้ ไม่ให้ Entry ปลอมหลุดไปถึง UI */
export function toRankResult(out: ClaudeRankOutput, candidates: EntryForRanking[], limit: number): RankResult {
  const known = new Set(candidates.map(c => c.id))
  const seen = new Set<number>()
  const hits = out.hits
    .filter(h => known.has(h.id) && !seen.has(h.id) && seen.add(h.id))
    .map(h => ({ entryId: h.id, score: clamp(h.score) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
  const confidence = clamp(out.confidence)
  if (out.kind === 'no_match' || !hits.length) return { kind: 'no_match', confidence }
  return { kind: 'match', hits, confidence }
}

export const claudeRanker: Ranker = {
  name: 'claude',
  async rank(query, candidates, { limit }) {
    // สร้าง client ต่อการเรียก — ไม่มี client ระดับ module (ADR-0005) · credential มาจาก env ของ SDK
    const client = new Anthropic()
    const res = await client.beta.messages.parse({
      model: CLAUDE_RANKER_MODEL,
      max_tokens: 4000,
      // เลือก API จากรายการไม่ต้องคิดลึก · effort ต่ำ = เร็วและถูก
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low', format: betaZodOutputFormat(Output) },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: `${SYSTEM}\n${buildCatalogue(candidates)}`, cache_control: { type: 'ephemeral', ttl: '1h' } }],
      messages: [{ role: 'user', content: `คำค้น: ${query}\nขอไม่เกิน ${limit} รายการ` }],
    })
    if (res.stop_reason === 'refusal') throw new Error('Claude ranker declined the query')
    if (!res.parsed_output) throw new Error(`Claude ranker returned no structured output (stop_reason: ${res.stop_reason})`)
    return toRankResult(res.parsed_output, candidates, limit)
  },
}
