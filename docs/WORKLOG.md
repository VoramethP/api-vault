# WORKLOG

ความจำระยะยาวของโปรเจกต์ — **ต่อท้ายอย่างเดียว ห้ามแก้ของเก่า**
รายการใหม่ไปต่อท้าย **ก่อน** หัวข้อ "งานถัดไป" เสมอ

---

## [2026-09-23] ออกแบบด้วย grilling 16 ข้อ + spike (ในเซสชันของ Framework Skills)

**ทำอะไร:** ออกแบบ api-vault ทั้งหมดใน brain · เขียน `spike/run.mjs` (pipeline 2 จังหวะ fetch ล้วน) · แปลง README
ของ `public-apis` เป็น `spike/data/apis.json` (1,873 รายการ 51 หมวด) · ingest เอกสาร Jev ลง wiki ของ brain

**ทำไมถึงเลือกแบบนี้:** ค้นไทยต้องการ "การตัดสิน" ไม่ใช่ข้อความ → Jev (Choice/Nouls/Score) แบบ 2 request บน
confidence-gated-composition พร้อม "No match" ที่ซื่อสัตย์ · ความปลอดภัยของ Key → envelope encryption + TOTP

**ทางเลือกที่ไม่ได้เลือก:** gateway (SPOF → ADR-0001) · MongoDB (ออกนอก path ไม่มีเหตุผลทางเทคนิค → ADR-0005) ·
ยิงสดในเดโม (เผาโควตา + secret ใน build สาธารณะ → ADR-0004) · zero-knowledge ฝั่ง client (เลื่อนไป V2)

**ผลที่ตามมา:** TypeSafe ปิดรับสมัคร (`signups_disabled`) — spike รันไม่ได้

## [2026-09-24] เปลี่ยนลำดับงาน: ทำส่วนที่ไม่ใช้ Jev ก่อน

**ทำอะไร:** ผู้ใช้เลือกลำดับใหม่ kickoff → นำเข้า+ค้นอังกฤษ (v0.1.0) → auth+MFA (v0.2.0) → Vault+audit (v0.3.0)
→ CLI (v0.4.0) → เดโม (v0.5.0) → spike + Jev ranker ทันทีที่มี key → v1.0.0

**ทำไม:** ไม่รู้ว่า TypeSafe จะเปิดเมื่อไหร่ · Ranker เป็น seam (ADR-0003) งานอื่นจึงไม่ต้องรอ ·
ตัวสำรองคือ Claude structured output

**ผลที่ตามมา:** ลำดับเดิม (spike ก่อน, CLI ท้ายสุด) ถูกแทน · ถ้าชน 1 เดือน CLI ตัดไป V1.1 ก่อนอย่างอื่น ·
V1 done = นำเข้า 1,873 · ค้นไทย · เพิ่มเอง+แท็กอัตโนมัติ · Key เข้ารหัส+audit · auth+TOTP · CLI · เดโม ·
เทส (crypto round-trip, RLS ในฐานะ `authenticated`, build เดโมไม่มี secret) · semver+CHANGELOG+`/about`

## [2026-09-24] Kickoff

**ทำอะไร:** scaffold Nuxt 4 minimal + ลง `@nuxt/ui 4.11` `tailwindcss 4.3` `@nuxtjs/supabase 2.0.10` `drizzle-orm 0.45.2`
`postgres 3.4.9` `zod 4.5` `vitest 4.1` · `vercel.json` sin1 · `drizzle.config.ts` · `server/utils/db.ts` (`getDb()`) ·
เทสตรวจ `.env.example` · ย้ายการออกแบบจาก brain มาเป็น `CONTEXT.md` + ADR-0001…0006 · `git init`
`npm run check` และ `npm run build` ผ่าน

**ทำไมถึงเลือกแบบนี้:**
- `supabase.redirect: false` ชั่วคราว — ยังไม่มีหน้า `/login` ถ้าเปิด redirect ทุกหน้าจะเด้งไป 404 · เปิดใน v0.2.0
- ไม่ใส่ routeRules prerender ของ `/demo/**` `/about` — prerender หน้าที่ยังไม่มีทำ build ล้ม
- `getDb()` ไม่มี workspaceId (ADR-0005)

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:** ดูกับดักใน HOTCACHE (TypeScript 7, npm install-scripts, database.types)

## [2026-09-24] Spec + ดีไซน์ drawio + v0.1.0

**ทำอะไร:**
- `docs/spec.md` (สเปก V1 ทุกเวอร์ชัน) + `docs/design/api-vault.drawio` 10 หน้า (generator ไม่เก็บ — แก้ใน draw.io)
- v0.1.0: ตาราง `entries` + RLS (migration `0000_entries`) · `shared/import-public-apis.ts` + `scripts/import-entries.ts` ·
  `server/ranker/` (interface + keyword) · `/api/search` `/api/categories` · หน้า `/` และ `/about` · `scripts/db-verify.ts`
- ทดสอบครบวงจรกับ Postgres 15 ในเครื่อง (role anon/authenticated แบบ Supabase): migrate → import สองรอบ (1,871 → +0) →
  verify ผ่าน · ใส่ policy ของ anon + ตารางไม่เปิด RLS แล้ว verify ล้มถูกต้อง · ลองค้นในเบราว์เซอร์จริง

**ทำไมถึงเลือกแบบนี้:**
- **Entry = unique (name, url), `categories text[]`** — ต้นทางมี TasteDive, Open-Meteo อยู่สองหมวด ถ้าแยกแถวจะได้ผลค้นซ้ำ
  → 1,873 แถว = 1,871 Entry (เกณฑ์ "นำเข้า 1,873" ใน HANDOFF เดิมหมายถึงแถวต้นทาง)
- **entries ไม่มี policy ของ anon** — Data API ของ Supabase ไม่เปิดให้คนนอก · server อ่านผ่าน Drizzle (role postgres) และ
  กันสิทธิ์ที่ route (v0.2.0) · policy ของ authenticated เป็น `true` เพราะปิด sign-up = มีผู้ใช้คนเดียว
- **importer แถวผิด = หยุดทั้งก้อน** ไม่ข้ามเงียบ ๆ · ไม่ทับ Entry ที่ `source = manual`
- **Ranker อยู่ใน JS รับ candidates** แทน Postgres FTS — Jev ต้องการ candidate list อยู่แล้ว (≤ 255 ต่อ Choice) และทำให้เทสได้โดยไม่ต้องมี DB
- **`withDb()` ปิด connection ทุกครั้ง** — serverless ที่ไม่ปิดจะกิน connection ของ pooler
- ฟิลเตอร์: HTTPS 3 ค่า / CORS 4 ค่า = `URadioGroup` · หมวด 51 / auth 6 = `USelect` (ui-decision)

**ทางเลือกที่ไม่ได้เลือก:** Postgres FTS (ผูกการค้นกับ SQL ข้าม seam) · แยก Entry ต่อหมวด (ผลซ้ำ) ·
`drizzle-kit push` (ห้ามตาม FDR-0009)

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- เกณฑ์ v0.1.0 เดิม "weather → Open-Meteo ใน top-5" **ไม่ผ่านจริง** — keyword ranker ให้ชื่อชนะหมวด และมี ~20 API ที่ชื่อมี
  "Weather" · เปลี่ยนเกณฑ์เป็น "top-5 เป็นหมวด Weather ทั้งหมด" และจดเป็นข้อจำกัดใน spec — เป็นหลักฐานว่าทำไมต้องมี Jev
- เจอบั๊ก "cat" ไม่เจอ "Cats" (คำสั้นไม่ match พหูพจน์) → แก้แล้ว + เทส
- ยังไม่เคยรันกับ Supabase จริง: pooler, `prepare:false`, role/grant ของ Supabase อาจต่างจากที่จำลอง

## [2026-09-24] v0.1.0 ขึ้น Supabase จริง

**ทำอะไร:** ผู้ใช้สร้าง Supabase `api-vault` (`ap-southeast-1`) + กรอก `.env` เอง (ไม่ผ่านแชต) · ตรวจรูปแบบ `.env` แบบปิดค่า:
pooler ถูก region, :6543/:5432 ถูกช่อง, `SUPABASE_KEY` เป็น `sb_publishable_` · `db:migrate` ✓ · `db:import` 1,871 (~2 วิ) ·
`db:verify` ผ่าน (authenticated 1,871 · anon 0) · `nuxt dev` ค้นผ่าน :6543 + `prepare:false` ได้ ~0.5 วิ/ครั้ง

**ทำไม:** ยืนยันว่าสิ่งที่จำลองในเครื่อง (role/grant ของ Supabase, pooler) ตรงกับของจริงก่อนต่อ auth

**ผลที่ตามมา:** 0.5 วิ/ค้นรวมเปิด connection ใหม่ + ดึง 1,871 แถวทุกครั้ง + ไป-กลับสิงคโปร์ — พอสำหรับตอนนี้
ถ้าช้าบน Vercel `sin1` ค่อยดู (ยังไม่ได้วัดบน Vercel)

## [2026-09-24] v0.2.0 Auth + TOTP — โค้ดเสร็จ รอทดสอบล็อกอินจริง

**ทำอะไร:** `shared/auth-flow.ts` (`nextStep`, `decideAccess` เป็นฟังก์ชันล้วน เทสได้) · `server/utils/auth.ts`
`requireOwner()` · `app/middleware/mfa.global.ts` · หน้า `/login` `/mfa` `/mfa/enroll` `/confirm` · ปุ่มออกจากระบบ ·
เปิด redirect ของโมดูล · `/api/**` `cache-control: private, no-store` · env ใหม่ `OWNER_EMAIL` ·
เทสที่ล้มถ้ามี route ใน `server/api` ไม่เรียก `requireOwner(event)` บรรทัดแรก และถ้า exclude ใน config ไม่ตรง `PUBLIC_PATHS`

**ทำไมถึงเลือกแบบนี้:**
- **ตรวจสามชั้นที่ server:** `getUser()` (ถาม Auth server — token ที่ถูกเพิกถอนไม่ผ่าน) → `aal` จาก `getClaims()`
  (ตรวจลายเซ็นแล้ว) → อีเมลต้องตรง `OWNER_EMAIL` แม้จะปิด sign-up แล้ว (กันบัญชีที่ถูกเพิ่มผ่าน dashboard พลาด ๆ)
- **บังคับลงทะเบียน TOTP ก่อนใช้แอป** — ไม่มี factor = ไป `/mfa/enroll` · มี factor แต่ session ยัง aal1 = ไป `/mfa`
  และห้ามเข้า `/mfa/enroll` (ไม่งั้นรหัสผ่านอย่างเดียวลงทะเบียน factor ใหม่ทับได้)
- ล้าง factor ที่ค้างสถานะ unverified ก่อน enroll ใหม่ — ไม่งั้นชื่อชน · QR สร้างใน `onMounted` ไม่ให้ secret ไปอยู่ใน SSR payload
- หน้า login ไม่บอกว่าผิดที่อีเมลหรือรหัส
- `OWNER_EMAIL` ว่าง → 500 แทนการปล่อยผ่าน

**ทางเลือกที่ไม่ได้เลือก:** ใช้แค่ middleware ของโมดูล (ไม่ดู aal) · ใช้ `getSession()` (ปลอมได้) ·
`serverSupabaseUser` อย่างเดียว (ใช้ `getClaims` ไม่ถาม Auth server ว่า token ถูกเพิกถอนไหม)

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- ทดสอบแล้วเฉพาะกรณีไม่ล็อกอิน (401 ทั้งไม่มี cookie และ cookie ปลอม · หน้าเด้งไป `/login`)
- ยังไม่ได้ทดสอบ: ล็อกอินจริง, aal1 ต้องได้ 403, enroll + verify, ล็อกอินรอบสองต้องไป `/mfa`
- ผู้ใช้ปิด sign-up (ตรวจแล้ว `disable_signup: true`) + เปิด TOTP ใน dashboard (Authentication › Multi-Factor) แล้ว

## [2026-09-24] v0.2.0 ทดสอบล็อกอินจริงผ่าน → tag

**ทำอะไร:** ผู้ใช้กรอก `OWNER_EMAIL` + สร้างบัญชีเจ้าของผ่าน dashboard (Add user · Auto Confirm) แล้วล็อกอินเองใน browser pane

**ผลทดสอบ (dev :3100, Supabase จริง):**
- ไม่ล็อกอิน → `/api/search` 401
- ล็อกอินครั้งแรก → ไป `/mfa/enroll` · สแกน QR + verify → `/` ค้นได้ `/api/search` 200
- ออกจากระบบ → ล็อกอินใหม่ → ไป **`/mfa`** (ไม่ใช่ enroll) · ที่ aal1 `/api/search` และ `/api/categories` ได้ **403**
- ใส่รหัส → aal2 → ทั้งสอง route 200

**สิ่งที่ต้องระวังต่อไป:** เช็ก 403 ที่ aal1 ตอน enroll ครั้งแรกหลุดไป (ผู้ใช้สแกนต่อเลย) แต่ได้เช็กแทนในรอบ `/mfa` ซึ่งเป็น aal1 เหมือนกัน
· ทำ TOTP หาย → ลบ factor ใน dashboard › Users แล้ว enroll ใหม่ (ยังไม่มี recovery codes)
· deploy ต้องตั้ง Authentication › URL Configuration ให้ตรงโดเมน

## [2026-09-24] push ขึ้น GitHub (public)

**ทำอะไร:** `gh repo create VoramethP/api-vault --public` + push `main` และ tag `v0.1.0` `v0.2.0`

**ตรวจก่อน push (repo-hygiene):** ไฟล์ env ที่ track มีแค่ `.env.example` · สแกนทุก git object ด้วย regex
(postgres URL มีรหัส, `sb_secret_`, JWT, `sk-`) = 0 · ค่าจริงทุกตัวใน `.env` ไม่อยู่ใน object ไหนเลย
· อีเมลเจ้าของอยู่แค่ใน author ของ commit/tag (git identity ปกติ) ไม่อยู่ในไฟล์

---

## งานถัดไป

ดู `HOTCACHE.md` › งานถัดไป
