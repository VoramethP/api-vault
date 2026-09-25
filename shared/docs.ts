// เอกสารฉบับให้ LLM อ่าน (มาตรฐาน llms.txt — https://llmstxt.org) — สร้างจาก docs/RUNBOOK.md ไฟล์เดียว
// เนื้อหาเป็นสาธารณะอยู่แล้ว (repo public) และต้องไม่มีค่า Key/token (runbook ห้ามอยู่แล้ว)

export const SITE_URL = 'https://api-vault-two.vercel.app'
const REPO_URL = 'https://github.com/VoramethP/api-vault'

const SUMMARY = 'api-vault คือคลัง API ส่วนตัวของเจ้าของคนเดียว: ค้น API สาธารณะเป็นภาษาไทยได้ · เก็บ API key แบบเข้ารหัส (envelope encryption) · ดึง Key ลง .env ด้วยคำสั่ง `vault pull` ที่ต้องอนุมัติด้วย TOTP ทุกครั้ง · ไม่ยิง API แทนผู้ใช้'

/** llms.txt — สารบัญสั้น ๆ ชี้ไปที่เอกสารเต็ม */
export function llmsIndex(): string {
  return `# api-vault

> ${SUMMARY}

## Docs

- [Runbook (ฉบับเต็มสำหรับ LLM)](${SITE_URL}/llms-full.txt): ขั้นตอนตั้งแต่เข้าเว็บ ค้น API ขอ Key เก็บลง Vault ผูกโปรเจกต์ \`vault pull\` จนใช้ในโค้ด + แก้ปัญหา CLI + ความปลอดภัย
- [Docs (หน้าเว็บ)](${SITE_URL}/docs): เนื้อหาเดียวกันในรูปหน้าเว็บ

## Optional

- [Source code](${REPO_URL}): Nuxt 4 · Supabase Postgres · Drizzle · Vercel
- [Changelog](${SITE_URL}/about): เวอร์ชันที่ปล่อยแล้ว
`
}

/** llms-full.txt — runbook ทั้งไฟล์ นำด้วยบริบทที่ LLM ต้องรู้ก่อนอ่าน */
export function llmsFull(runbook: string): string {
  return `# api-vault — เอกสารฉบับเต็มสำหรับ LLM

> ${SUMMARY}

เว็บ: ${SITE_URL} · ซอร์สโค้ด: ${REPO_URL}
ข้อควรรู้ก่อนช่วยผู้ใช้: api-vault ออก API key เองไม่ได้ (ต้องสมัครที่เว็บเจ้าของ API) · Key ไม่เคยถูกส่งให้ LLM หรือบริการภายนอก ·
อย่าขอให้ผู้ใช้วางค่า Key, token หรือรหัสผ่านในแชต

---

${runbook.trim()}
`
}
