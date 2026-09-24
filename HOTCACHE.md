# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> Updated: **2026-09-24**

## โปรเจกต์นี้คืออะไร
คลัง API ส่วนตัว: Catalogue (1,871 Entry จาก `public-apis` + ที่เพิ่มเอง) ค้นผ่าน Ranker + Vault เก็บ Key
เข้ารหัส · เจ้าของคนเดียว · repo public + เดโม · Nuxt 4/Supabase/Drizzle บน Vercel `sin1` · เพดานถึง 2026-10-24
สเปก: `docs/spec.md` · ภาพ: `docs/design/api-vault.drawio`

## ตอนนี้อยู่ตรงไหน
- ✅ **v0.1.0** (tag) บน Supabase จริง: 1,871 Entry · `db:verify` ผ่าน · ค้น ~0.5 วิ ผ่าน :6543
- ✅ **v0.2.0** (tag) ล็อกอิน + บังคับ TOTP ทดสอบจริงผ่าน: ไม่ล็อกอิน 401 · aal1 403 · aal2 200
- ✅ **v0.3.0** (tag) Vault + audit: `/vault` · Reveal = TOTP ใหม่ทุกครั้ง · Project/env_var · audit append-only
- ✅ GitHub public: `VoramethP/api-vault` · ✅ Vercel prod: https://api-vault-two.vercel.app (`sin1`, ล็อกอินจริงผ่าน)
- 🔴 TypeSafe ปิดรับสมัคร → Jev รอ (ADR-0003)

## กฎเหล็ก
ไม่มี gateway · Key envelope-encrypted, master key ใน env เท่านั้น, Reveal = re-auth + audit ·
Key ไม่ออกไปหา Ranker/บริการภายนอก · ค้นผ่าน `Ranker` เท่านั้น · เดโมไม่ยิงสด ไม่มี secret ·
`getDb()`/`withDb()` ต่อ request · ห้าม service_role · RLS ทุกตาราง · drizzle-kit generate+migrate เท่านั้น

## งานถัดไป
1. **v0.4.0 CLI** (spec §7) — ยืนยันรูปแบบ token กับผู้ใช้ก่อนเริ่ม · Pull ใช้ `server/vault/reveal.ts` ลำดับเดียวกัน

## กับดักที่เคยเจอ
- **TypeScript 7 ใช้กับ `vue-tsc` ไม่ได้** → pin `typescript@5`
- npm 11 บล็อก install scripts (esbuild ฯลฯ) — build ผ่านได้โดยไม่ต้อง approve
- `@nuxtjs/supabase` เตือน `database.types.ts` ไม่มี → `Database = unknown` (ยังไม่ตัดสิน)
- build/typecheck ต้องมี `SUPABASE_URL` + `SUPABASE_KEY` — placeholder ก็ผ่าน
- prerender route ที่ยังไม่มีหน้า = build ล้ม
- `nuxt.config` อ่าน version จาก `package.json` ตอนเริ่ม — bump แล้วต้อง restart dev
- **`vercel link` เพิ่ม `.env*` ลง `.gitignore`** → คืนค่าไฟล์ทุกครั้ง (กฎเดิมครอบแล้ว)
- env บน Vercel: 6 ตัว (SUPABASE_URL/KEY, DATABASE_URL, OWNER_EMAIL, VAULT_MASTER_KEY(_VERSION)) · Vercel ผูก GitHub แล้ว: **`git push` main = deploy production เอง** ห้าม `vercel deploy` ซ้ำ
  (ครั้งที่ deploy จาก CLI ใช้ build cache แล้ว `/about` ที่ prerender ออกมาเป็นของเก่า v0.1.0 — ต้อง `vercel promote` ตัวที่ build จาก git) · หลัง deploy เช็ก `/about`
- ตาราง Vault: RLS **ไม่มี policy** + REVOKE (ห้ามเพิ่ม policy `true` แบบ entries — aal1 จะอ่านได้) · audit_log แก้/ลบไม่ได้แม้ postgres
- zsh ไม่แยกคำในตัวแปร (`$P "sql"` พัง) — ใช้ function
- ทำ TOTP หาย → ลบ factor ใน dashboard › Users แล้ว enroll ใหม่
- `OWNER_EMAIL` ว่าง = `/api/*` ตอบ 500 (ตั้งใจให้ล้มดัง ๆ) · แก้ `.env` แล้วต้อง restart dev
- `useSupabaseUser()` ของ `@nuxtjs/supabase` v2 คืน **JWT claims** ไม่ใช่ User · middleware ของโมดูลเช็กแค่มี session ไม่ดู aal
- `UPinInput type="number"` ให้ `number[]` — ใช้แบบไม่ใส่ type จะได้ `string[]`
- สร้างบัญชีเจ้าของผ่าน dashboard (Users › Add user · Auto Confirm) เพราะ sign-up ปิด
- ข้อมูลต้นทางสกปรก: `\apiKey\` (\a กลายเป็น BEL → "piKey"), `` `Yes` `` — importer จัดการแล้ว
- keyword ranker: API ที่ชื่อมีคำค้นชนะ API ที่ตรงแค่หมวด ("weather" → Open-Meteo ไม่ติด top-5) — ข้อจำกัดที่รู้แล้ว
- Postgres ในเครื่อง (ทดสอบ): initdb/pg_ctl ต้อง `LC_ALL=C` · path ใน scratchpad ยาวเกิน socket → `-k ''` ใช้ TCP
  · ต้องสร้าง role `anon`/`authenticated` + default grants เองให้เหมือน Supabase

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md`
