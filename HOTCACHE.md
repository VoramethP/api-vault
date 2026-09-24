# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> Updated: **2026-09-24**

## โปรเจกต์นี้คืออะไร
คลัง API ส่วนตัว: Catalogue (1,871 Entry จาก `public-apis` + ที่เพิ่มเอง) ค้นผ่าน Ranker + Vault เก็บ Key
เข้ารหัส · เจ้าของคนเดียว · repo public + เดโม · Nuxt 4/Supabase/Drizzle บน Vercel `sin1` · เพดานถึง 2026-10-24
สเปก: `docs/spec.md` · ภาพ: `docs/design/api-vault.drawio`

## ตอนนี้อยู่ตรงไหน
- ✅ **v0.1.0** (tag): entries + RLS · importer · keyword ranker · หน้าค้น + filter · `/about` · 15 เทส
- ✅ **Supabase จริง** (`ap-southeast-1`, 2026-09-24): migrate → import 1,871 → `db:verify` ผ่าน (anon เห็น 0) ·
  แอปผ่าน transaction pooler :6543 ได้ (~0.5 วิ/ค้น จากเครื่องในไทย)
- ⏳ ยังไม่มี: GitHub remote · Vercel project (ยังไม่ deploy — `/api/*` ยังไม่กันสิทธิ์จนกว่า v0.2.0)
- 🔴 TypeSafe ปิดรับสมัคร → Jev รอ (ADR-0003)

## กฎเหล็ก
ไม่มี gateway · Key envelope-encrypted, master key ใน env เท่านั้น, Reveal = re-auth + audit ·
Key ไม่ออกไปหา Ranker/บริการภายนอก · ค้นผ่าน `Ranker` เท่านั้น · เดโมไม่ยิงสด ไม่มี secret ·
`getDb()`/`withDb()` ต่อ request · ห้าม service_role · RLS ทุกตาราง · drizzle-kit generate+migrate เท่านั้น

## งานถัดไป
1. **ผู้ใช้ยืนยัน:** ปิด sign-up + เปิด TOTP ใน dashboard แล้วหรือยัง (ต้องมีก่อน v0.2.0)
2. **ผู้ใช้อนุญาตก่อน:** `gh repo create VoramethP/api-vault --public` + push (repo-hygiene ก่อน)
3. **v0.2.0 Auth + TOTP** (spec §5): `/login` `/confirm` · เปิด `supabase.redirect` · กัน `/api/*` ด้วย `getUser()`+aal2
   (มี `TODO(v0.2.0)` ใน `server/api/*.get.ts`)

## กับดักที่เคยเจอ
- **TypeScript 7 ใช้กับ `vue-tsc` ไม่ได้** → pin `typescript@5`
- npm 11 บล็อก install scripts (esbuild ฯลฯ) — build ผ่านได้โดยไม่ต้อง approve
- `@nuxtjs/supabase` เตือน `database.types.ts` ไม่มี → `Database = unknown` (ยังไม่ตัดสิน)
- build/typecheck ต้องมี `SUPABASE_URL` + `SUPABASE_KEY` — placeholder ก็ผ่าน
- prerender route ที่ยังไม่มีหน้า = build ล้ม
- `nuxt.config` อ่าน version จาก `package.json` ตอนเริ่ม — bump แล้วต้อง restart dev
- ห้าม deploy ก่อน v0.2.0 — `/api/search` เปิดโล่ง
- ข้อมูลต้นทางสกปรก: `\apiKey\` (\a กลายเป็น BEL → "piKey"), `` `Yes` `` — importer จัดการแล้ว
- keyword ranker: API ที่ชื่อมีคำค้นชนะ API ที่ตรงแค่หมวด ("weather" → Open-Meteo ไม่ติด top-5) — ข้อจำกัดที่รู้แล้ว
- Postgres ในเครื่อง (ทดสอบ): initdb/pg_ctl ต้อง `LC_ALL=C` · path ใน scratchpad ยาวเกิน socket → `-k ''` ใช้ TCP
  · ต้องสร้าง role `anon`/`authenticated` + default grants เองให้เหมือน Supabase

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md`
