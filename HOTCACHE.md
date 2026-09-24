# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> Updated: **2026-09-24**

## โปรเจกต์นี้คืออะไร
คลัง API ส่วนตัว: Catalogue (1,873 รายการจาก `public-apis` + ที่เพิ่มเอง) ค้นไทยผ่าน Ranker + Vault เก็บ Key
เข้ารหัส · เจ้าของคนเดียว · repo public + เดโม · Nuxt 4/Supabase/Drizzle บน Vercel `sin1` · เพดาน 1 เดือน

## ตอนนี้อยู่ตรงไหน
- ✅ Kickoff เสร็จ: สแต็กลงครบ `npm run check` + `build` ผ่าน · ADR-0001…0006 · commit แรกแล้ว
- ⏳ ยังไม่มี: Supabase project · GitHub remote · Vercel project · ตารางใด ๆ
- 🔴 TypeSafe ปิดรับสมัคร (2026-09-23) → Jev รอ · ใช้ keyword ranker ไปก่อน (ADR-0003)

## กฎเหล็ก
ไม่มี gateway · Key envelope-encrypted, master key ใน env เท่านั้น, Reveal = re-auth + audit ·
Key ไม่ออกไปหา Ranker/บริการภายนอก · ค้นผ่าน `Ranker` เท่านั้น · เดโมไม่ยิงสด ไม่มี secret ·
`getDb()` ต่อ request · ห้าม service_role · RLS ทุกตาราง · drizzle-kit generate+migrate เท่านั้น
(ที่มาครบใน `CLAUDE.md`)

## งานถัดไป
1. **ผู้ใช้:** สร้าง Supabase project `api-vault` region `ap-southeast-1` (โควตาฟรีเหลือ 1) · ปิด sign-up ·
   เปิด TOTP · ใส่ค่าลง `.env` ตาม `.env.example` (ไม่วางในแชต)
2. **ผู้ใช้อนุญาตก่อน:** `gh repo create VoramethP/api-vault --public` + push (สแกน repo-hygiene ก่อน push แรก)
3. **v0.1.0:** ตาราง `entries` (+RLS: anon อ่านได้? — ตัดสินตอนทำ) · migration แรก · สคริปต์นำเข้า
   `spike/data/apis.json` · `Ranker` interface + keyword ranker · หน้าค้น · `db:verify` ในฐานะ `authenticated`
   · bump version + CHANGELOG + tag

## กับดักที่เคยเจอ
- **TypeScript 7 ใช้กับ `vue-tsc` ไม่ได้** (`ERR_PACKAGE_PATH_NOT_EXPORTED` ตอนหา tsc) → pin `typescript@5`
- **npm 11 บล็อก install scripts** (esbuild, fsevents, vue-demi) — build ผ่านโดยไม่ต้อง approve เพราะ binary มาจาก optional deps
- `nuxt typecheck` ต้องมี `@types/node` ถึงจะรู้จัก `process` ใน server/
- `@nuxtjs/supabase` เตือน `~/types/database.types.ts` ไม่มี → `Database = unknown` (ยังไม่ตัดสินว่าจะ gen จากไหน)
- build/typecheck ต้องมี `SUPABASE_URL` + `SUPABASE_KEY` — ใส่ placeholder ก็ผ่าน
- prerender route ที่ยังไม่มีหน้า = build ล้ม ("Exiting due to prerender errors")
- `supabase.redirect: false` อยู่ — **ต้องเปิดใน v0.2.0** ไม่งั้นทั้งแอปไม่ต้องล็อกอิน

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md`
