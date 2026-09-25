# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> Updated: **2026-09-25**

## โปรเจกต์นี้คืออะไร
คลัง API ส่วนตัว: Catalogue (1,871 Entry จาก `public-apis` + ที่เพิ่มเอง) ค้นผ่าน Ranker + Vault เก็บ Key
เข้ารหัส · เจ้าของคนเดียว · repo public + เดโม · Nuxt 4/Supabase/Drizzle บน Vercel `sin1` · เพดานถึง 2026-10-24
สเปก: `docs/spec.md` · ภาพ: `docs/design/api-vault.drawio`

## ตอนนี้อยู่ตรงไหน
- ✅ v0.1–v0.5 (tag): Catalogue · ล็อกอิน+TOTP · Vault+audit (Reveal = TOTP ทุกครั้ง) · CLI `vault pull` (device flow, token 30 วัน) · `thai-dict` + `/demo`
- ✅ GitHub public: `VoramethP/api-vault` · ✅ Vercel prod: https://api-vault-two.vercel.app (`sin1`, ล็อกอินจริงผ่าน)
- ✅ **v1.0.0** (tag) เพิ่ม/แก้/ลบ Entry เอง (`manual` เท่านั้น) · เทสกัน thai-dict ถอยหลัง ≥ 14/20 (ADR-0007)
- ✅ **v1.0.1** (tag, prod แล้ว): ปุ่ม "ขอ Key" · Catalogue โหลดครั้งเดียว กรองในเบราว์เซอร์ + cache Vault · `Server-Timing` · `/docs` + `/llms*.txt` · `Referrer-Policy` · favicon กุญแจ SVG
- 🔴 TypeSafe ปิดรับสมัคร → Jev ย้ายไป V1.1

## กฎเหล็ก
ไม่มี gateway · Key envelope-encrypted, master key ใน env เท่านั้น, Reveal = re-auth + audit ·
Key ไม่ออกไปหา Ranker/บริการภายนอก · ค้นผ่าน `Ranker` เท่านั้น · เดโมไม่ยิงสด ไม่มี secret ·
`getDb()`/`withDb()` ต่อ request · ห้าม service_role · RLS ทุกตาราง · drizzle-kit generate+migrate เท่านั้น

## งานถัดไป
1. งานที่พักไว้: ช่อง "ลิงก์หน้าสมัคร" ต่อ Entry (ต้อง migration) · `database.types.ts`
2. V1.1: Jev + Tag อัตโนมัติ + ประวัติ Entry (เมื่อ TypeSafe เปิด)

## กับดักที่เคยเจอ
- **TypeScript 7 ใช้กับ `vue-tsc` ไม่ได้** → pin `typescript@5`
- `@nuxtjs/supabase` เตือน `database.types.ts` ไม่มี → `Database = unknown` (ยังไม่ตัดสิน)
- build/typecheck ต้องมี `SUPABASE_URL` + `SUPABASE_KEY` — placeholder ก็ผ่าน
- prerender route ที่ยังไม่มีหน้า = build ล้ม
- tag ใช้ `git tag -a` — `--follow-tags` ไม่ส่ง lightweight tag
- `nuxt.config` อ่าน version จาก `package.json` ตอนเริ่ม — bump แล้วต้อง restart dev
- **`vercel link` เพิ่ม `.env*` ลง `.gitignore`** → คืนค่าไฟล์ทุกครั้ง (กฎเดิมครอบแล้ว)
- env บน Vercel: 6 ตัว (SUPABASE_URL/KEY, DATABASE_URL, OWNER_EMAIL, VAULT_MASTER_KEY(_VERSION)) · Vercel ผูก GitHub แล้ว: **`git push` main = deploy production เอง** ห้าม `vercel deploy` ซ้ำ
  (deploy จาก CLI ใช้ build cache → `/about` เก่า) · หลัง deploy เช็ก `/about`
- ตาราง Vault: RLS **ไม่มี policy** + REVOKE (ห้ามเพิ่ม policy `true` แบบ entries — aal1 จะอ่านได้) · audit_log แก้/ลบไม่ได้แม้ postgres
- `/api/cli/*` ใช้ `requireCliToken` แทน `requireOwner` (เทสบังคับทั้งสองทาง) · TOTP ใช้ซ้ำกันด้วย `totp_uses`
- **ซ่อน input ด้วย `rl._writeToOutput`: ห้ามส่ง `s` ต่อ** — readline วาดบรรทัดใหม่เป็น prompt+ข้อความ (token เคยหลุดบนจอ v0.4.0)
- `OWNER_EMAIL` ว่าง = `/api/*` ตอบ 500 (ตั้งใจให้ล้มดัง ๆ) · แก้ `.env` แล้วต้อง restart dev
- `useSupabaseUser()` ของ `@nuxtjs/supabase` v2 คืน **JWT claims** ไม่ใช่ User · middleware ของโมดูลเช็กแค่มี session ไม่ดู aal
- `Server-Timing` ไม่มีใน response error (401) — มีเฉพาะที่ล็อกอินแล้ว
- `useFetch` key เดียวกันหลายที่: `dedupe` ค่าเริ่ม `'cancel'` ยกเลิกกันเอง → ใช้ `'defer'` (useCatalogue)
- `app.head.link` rel ต้องอยู่ใน type ของ unhead (`alternate icon` ไม่ผ่าน → ใช้ `shortcut icon`)
- `UPinInput type="number"` ให้ `number[]` — ใช้แบบไม่ใส่ type จะได้ `string[]`
- Postgres ในเครื่อง (ทดสอบ): initdb/pg_ctl ต้อง `LC_ALL=C` · path ใน scratchpad ยาวเกิน socket → `-k ''` ใช้ TCP
  · ต้องสร้าง role `anon`/`authenticated` + default grants เองให้เหมือน Supabase

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md`
