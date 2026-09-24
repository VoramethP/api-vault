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
- ✅ GitHub public: `VoramethP/api-vault` (main + tags) · ⏳ ยังไม่มี Vercel project
- 🔴 TypeSafe ปิดรับสมัคร → Jev รอ (ADR-0003)

## กฎเหล็ก
ไม่มี gateway · Key envelope-encrypted, master key ใน env เท่านั้น, Reveal = re-auth + audit ·
Key ไม่ออกไปหา Ranker/บริการภายนอก · ค้นผ่าน `Ranker` เท่านั้น · เดโมไม่ยิงสด ไม่มี secret ·
`getDb()`/`withDb()` ต่อ request · ห้าม service_role · RLS ทุกตาราง · drizzle-kit generate+migrate เท่านั้น

## งานถัดไป
1. deploy Vercel ได้แล้ว — ตั้ง Supabase URL Configuration ให้ตรงโดเมน
2. **v0.3.0 Vault + audit** (spec §6) — ยืนยันข้อ 🟡 (Project/env_var, เวลา re-auth) กับผู้ใช้ก่อนเริ่ม

## กับดักที่เคยเจอ
- **TypeScript 7 ใช้กับ `vue-tsc` ไม่ได้** → pin `typescript@5`
- npm 11 บล็อก install scripts (esbuild ฯลฯ) — build ผ่านได้โดยไม่ต้อง approve
- `@nuxtjs/supabase` เตือน `database.types.ts` ไม่มี → `Database = unknown` (ยังไม่ตัดสิน)
- build/typecheck ต้องมี `SUPABASE_URL` + `SUPABASE_KEY` — placeholder ก็ผ่าน
- prerender route ที่ยังไม่มีหน้า = build ล้ม
- `nuxt.config` อ่าน version จาก `package.json` ตอนเริ่ม — bump แล้วต้อง restart dev
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
