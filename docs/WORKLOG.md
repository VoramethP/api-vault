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

## [2026-09-24] deploy Vercel production

**ทำอะไร:** `npx vercel link --project api-vault` → env 4 ตัว (SUPABASE_URL, SUPABASE_KEY, DATABASE_URL, OWNER_EMAIL)
ทั้ง production + preview โดย pipe จาก `.env` → `vercel deploy --prod` → https://api-vault-two.vercel.app (`sin1`)

**ทำไม:** ไม่ใส่ `MIGRATION_DATABASE_URL` / `TYPESAFE_API_KEY` — แอปไม่ใช้ตอนรัน ลด secret ที่อยู่บน host · `RANKER` ว่าง = keyword

**ผลทดสอบ:** `/about` `/login` 200 · `/` `/mfa` ไม่ล็อกอิน → 302 `/login` · `/api/*` 401 + `private, no-store`
· ผู้ใช้ตั้ง Supabase Authentication › URL Configuration (Site URL + Redirect URLs) แล้วล็อกอิน + TOTP บน production ได้

**กับดัก:** `vercel link` ต่อท้าย `.vercel` + `.env*` ใน `.gitignore` — คืนค่าไฟล์ เพราะ `.env.*` / `!.env.example` / `.vercel/` มีอยู่แล้ว

## [2026-09-24] v0.3.0 Vault + audit

**ผู้ใช้ตัดสิน (🟡 ใน spec):** Reveal = TOTP ใหม่ทุกครั้ง · Project/env_var ทำใน v0.3.0 · รายการแสดง 4 ตัวท้าย

**ทำอะไร:** ตาราง `keys` `projects` `project_keys` `audit_log` (migration 0001 generate + 0002 custom: trigger + REVOKE)
· `server/vault/crypto.ts` (seal/open/loadMasterKey) · `server/vault/reveal.ts` (ลำดับ Reveal แยกเป็นฟังก์ชันเทสได้)
· API `/api/keys` `/api/keys/[id]` `/api/keys/[id]/reveal` `/api/projects…` `/api/audit` · หน้า `/vault` `/vault/projects` `/vault/audit`
· `requireOwner()` คืน `{ user, claims }` · master key สร้างด้วย `openssl rand -base64 32` ลง `.env` + Vercel (ไม่เคยแสดงค่า)

**ทำไมถึงเลือกแบบนี้:**
- **TOTP สดตรวจจาก `amr`** ไม่ใช่ verify ที่ server: server client ของ `@nuxtjs/supabase` verify ได้ แต่จะออก refresh
  token ใหม่ใน Set-Cookie ขณะที่เบราว์เซอร์อาจยังถือตัวเก่า (เสี่ยง reuse detection) — ใช้ทางเดียวกับ `/mfa` ที่ทดสอบแล้วแทน
- **หนึ่งรหัสต่อหนึ่ง Reveal** ด้วย partial unique index `audit_log(totp_at) where action='reveal'` — ไม่ต้องมี state ที่อื่น และกัน race ได้ที่ DB
- **ตาราง Vault ไม่มี policy + REVOKE** — `entries` ใช้ policy `true` ของ authenticated ได้เพราะไม่ลับ แต่ถ้า Vault ทำแบบเดียวกัน
  session aal1 จะอ่าน label/last4/ciphertext ผ่าน Data API ได้โดยไม่ผ่าน TOTP
- **audit_log ไม่มี FK ไป keys** — `ON DELETE SET NULL` คือ UPDATE ที่ trigger ปฏิเสธ · เก็บ `key_label` ไว้อ่านหลัง Key ถูกลบ
- **trigger แบบ FOR EACH STATEMENT** ล้มแม้คำสั่งไม่โดนแถวไหน → `db:verify` ตรวจได้โดยไม่ต้องมีข้อมูล
- last4 เฉพาะ Key ≥ 16 ตัว · ค่า Key ถูก trim (ช่องว่างจากการคัดลอกทำให้ใช้กับ API ไม่ได้)

**ทางเลือกที่ไม่ได้เลือก:** ช่วงผ่อน re-auth 5/15 นาที (ผู้ใช้เลือกทุกครั้ง) · policy ที่เช็ก `auth.jwt()->>'aal'` (ไม่ต้องมี —
Data API ไม่ต้องใช้ตาราง Vault เลย) · verify TOTP ที่ server

**ผลทดสอบ:** เทส 47 ข้อ (crypto round-trip, tamper 6 ฟิลด์, DEK/IV ไม่ซ้ำ, ลำดับ Reveal/audit, TOTP สด) · Postgres ในเครื่อง:
migrate + `db:verify` ผ่าน และจับได้เมื่อถอด trigger / grant คืน · Supabase จริง: migrate + verify ผ่าน · dev: CRUD/โปรเจกต์/409/400
ผ่าน, TOTP เก่า → 403 ไม่มี audit · **ผู้ใช้ Reveal จริงด้วย TOTP ได้ค่าและมีแถว audit** · ลบข้อมูลทดสอบแล้ว
(แถว audit ของ `TEST-claude` อยู่ถาวรตามออกแบบ)

**สิ่งที่ต้องระวังต่อไป:** master key หาย = Key ทั้งหมดอ่านไม่ได้ — ผู้ใช้ต้องเก็บสำเนาเอง · หมุน master key ยังไม่มีสคริปต์
(`open()` ปฏิเสธ version ไม่ตรง) · Pull (v0.4.0) ต้องใช้ `reveal` ลำดับเดียวกัน via `cli`

**deploy v0.3.0:** push แล้ว Vercel build จาก git เอง (ผูก repo ตอน `vercel link`) พร้อมกับที่ผมสั่ง `vercel deploy --prod`
· ตัวจาก CLI ขึ้นทีหลังเลยได้ alias ไป แต่ `/about` ที่ prerender กลับเป็น v0.1.0 (หน้า SSR ได้ 0.3.0 ถูก, build ในเครื่องได้ 0.3.0)
— สาเหตุน่าจะเป็น build cache ที่ restore มา ยังไม่ยืนยัน · แก้โดย `vercel promote` ตัวที่ build จาก git · ต่อไป deploy ด้วย `git push` อย่างเดียว

## [2026-09-24] v0.4.0 CLI

**ผู้ใช้ตัดสิน:** Pull = อนุมัติบนเว็บด้วย TOTP ทุกครั้ง · token 30 วัน · CLI เป็นโฟลเดอร์ `cli/` ใน repo

**ทำอะไร:** ตาราง `cli_tokens` `pull_requests` `totp_uses` (migration 0003 generate + 0004 custom: REVOKE + ย้าย totp_at เดิมเข้า totp_uses)
· ลบ unique index `audit_log_totp_at_key` · `requireCliToken()` สำหรับ `/api/cli/*` · API `/api/cli-tokens` `/api/cli/whoami`
`/api/cli/pull-requests` `/api/pull-requests/[code]` · หน้า `/vault/cli` `/vault/approve` · `cli/vault.mjs` + `cli/lib.mjs`

**ทำไมถึงเลือกแบบนี้:**
- **device flow** แทน token อย่างเดียว: ADR-0002 บอกว่า Pull ต้อง re-auth และผู้ใช้เลือก TOTP ทุกครั้งให้ Reveal แล้ว
  · ไม่ให้ CLI ถือ session ของ Supabase เพราะ refresh token บนดิสก์ร้ายแรงกว่า token ที่ดึงเองไม่ได้
- **`totp_uses` แทน unique index บน audit_log:** อนุมัติ Pull หนึ่งครั้งเขียน audit หลายแถว (หนึ่งแถวต่อ Key) ด้วย totp_at เดียวกัน
  และรหัสเดียวต้องใช้ข้าม Reveal/Pull ไม่ได้
- approved → consumed ด้วย `UPDATE … WHERE status='approved' RETURNING` ในคำสั่งเดียว — poll พร้อมกันสองครั้งได้ค่าแค่ครั้งเดียว
- CLI ไม่ใช่ TypeScript/ไม่มี build — ติดตั้งจากโฟลเดอร์ได้ทันที · ส่วนที่ไม่แตะเครือข่ายอยู่ใน `lib.mjs` ให้เทสได้
- เทสใหม่: `/api/cli/*` เท่านั้นที่ใช้ `requireCliToken` และไม่มี route ของเว็บใช้ token ได้

**ผลทดสอบ:** เทส 56 ข้อ · Postgres ในเครื่อง + Supabase: migrate + `db:verify` ผ่าน (ตาราง CLI ปิดจาก Data API) · CLI จริงกับ dev:
`.env` ไม่อยู่ใน .gitignore → ปฏิเสธ · โปรเจกต์ไม่มี → 404 · **ผู้ใช้อนุมัติด้วย TOTP → .env ได้ค่าถูก (อ่านได้ทั้ง dotenv และ `source`),
`PORT=3000` เดิมยังอยู่, chmod 600, audit `pull`/`cli` ครบ** · ตัดสินซ้ำ → 409 · ปฏิเสธ → denied · เพิกถอน token → 401
· token ทดสอบสร้างใน shell (เขียน hash ลง DB ตรง) ไม่ผ่านแชต · ลบข้อมูลทดสอบแล้ว (token ถูกเพิกถอน แถวยังอยู่)

**สิ่งที่ต้องระวังต่อไป:** หน้า `/vault/approve` หลังล็อกอินใหม่จะเสีย `?code=` (โมดูล redirect ไม่เก็บ query) — พิมพ์รหัสเองได้
· CLI ถ้าพลาด poll ตอน consumed จะเห็น "สถานะไม่คาดคิด" (ค่าไม่ถูกส่งซ้ำ ต้อง pull ใหม่)

**บั๊กหลังปล่อย v0.4.0:** `vault login` แสดง token บนจอ — `_writeToOutput` ปล่อยทุกก้อนที่มี prompt แต่ readline วาดบรรทัดใหม่เป็น
`prompt + ข้อความที่พิมพ์` ทุกครั้งที่วาง/ลบ · token ของผู้ใช้หลุดลง scrollback และ transcript ของแชต → ให้ผู้ใช้เพิกถอนและสร้างใหม่
· แก้: ปล่อยแค่ prompt ครั้งแรก ไม่ปล่อยเนื้อหาเลย · ผลกระทบจำกัดเพราะ token อย่างเดียวดึง Key ไม่ได้ (ต้องอนุมัติด้วย TOTP)

**ใช้จริงครั้งแรก (ผู้ใช้):** `vault pull weather-bot` ลง `~/vault-test/.env` สำเร็จ · ระหว่างทางเจอสองเรื่อง:
1. หน้าอนุมัติบอกแค่ "รหัสไม่ถูกต้องหรือหมดเวลา" ทุกกรณี → แยกเหตุผลจาก `err.code` ของ auth-js (`app/utils/totp-error.ts`)
2. ผู้ใช้กด Ctrl+C แล้วรันใหม่ แต่ไปอนุมัติรหัส**รอบเก่า** — คำขอเก่ายัง pending ค้างอยู่ให้อนุมัติได้ (ค่าไม่รั่วเพราะไม่มีใครมารับ แต่ทำให้งง)
   → CLI ดัก SIGINT แล้วเรียก `/api/cli/pull-requests/[id]/cancel` (→ denied) · หน้าอนุมัติเน้นว่าต้องเป็นรหัสที่ terminal **กำลังรอ**
   · ทดสอบกับ dev ด้วย token ชั่วคราว (สร้าง/เพิกถอนใน shell): Ctrl+C → สถานะ denied

## [2026-09-24] v0.5.0 ค้นไทยด้วยพจนานุกรม + เดโม

**ผู้ใช้ตัดสิน:** เดิมเลือก Claude ranker แล้วเปลี่ยนเป็นพจนานุกรม "จะได้ไม่ต้องเสียค่าใช้จ่าย" · Claude ranker commit เก็บไว้ (`74f585b`)

**ทำอะไร:** `server/ranker/thai-dict.ts` + `thai-dict.json` (315 วลี, 74 stopword, ครอบ 51 หมวด) · แยก `entryWords`/`tokenWeight` ออกจาก keyword ranker
ให้ใช้ร่วม · ค่าเริ่ม `RANKER` = `thai-dict` (`.env` ในเครื่องเปลี่ยนจาก keyword ด้วย) · `scripts/eval-ranker.ts` (ข้อมูลจาก apis.json ผ่าน importer ตัวเดียวกับ DB)
· `app/demo/queries.json` → `scripts/build-demo.ts` (อ่าน DB) → `app/demo/results.json` → `/demo` prerender · `postbuild` สแกนความลับ

**ทำไมถึงเลือกแบบนี้:**
- index อย่างเดียว (FTS/trigram) ใช้ไม่ได้ เพราะคำค้นไทยแต่ข้อมูลอังกฤษ — ต้องมีตัวเชื่อมสองภาษา · พจนานุกรมคือตัวที่ฟรีและรู้ผลแน่นอน
- `Intl.Segmenter` ตัดละเอียด ("อัตรา/แลก/เปลี่ยน") → จับวลียาวสุดก่อนโดยต่อท่อนติดกัน
- หนึ่งวลีไทย = หนึ่ง "ความต้องการ" ที่มีหลายทางเลือกอังกฤษ — ถ้านับทุกคำอังกฤษแยก คำพ้องที่ไม่เจอจะกดความมั่นใจโดยไม่สมควร
- เงื่อนไขพูดเป็นประโยค → ตัวกรอง (ไม่ใช่คำค้น) · คำไทยที่ไม่รู้จักลดความมั่นใจ แทนที่จะถูกทิ้งเงียบ ๆ
- scan-build อยู่ใน `postbuild` จึงรันบน Vercel ด้วย (env ของ build) — ไม่ใช่แค่เทสในเครื่อง

**ผลทดสอบ:** เทส 67 ข้อ · build + scan ผ่าน และจับได้เมื่อใส่ OWNER_EMAIL ลง `.output` · `/demo` ไม่ล็อกอินได้ 200 และไม่เรียก `/api`
· ตัวอย่างเดโม: 7/8 ข้อได้ผลที่เกี่ยว, "หาเพื่อนคุยตอนดึก" = no_match · **ยังไม่ได้วัดเกณฑ์ 15/20** — รอผู้ใช้เขียนคำค้น 20 ข้อใน `spike/queries.json`

**สิ่งที่ต้องระวังต่อไป:** ผลเสมอกันเรียงตามชื่อ (AccuWeather ขึ้นก่อน Open-Meteo) — ข้อจำกัดเดิมของ keyword · คำนอกพจนานุกรม = ไม่เจอ
· แก้ `queries.json` หรือพจนานุกรมแล้วต้อง `npm run demo:build` ใหม่ · BMC (แผนทำเงิน) อยู่ใน artifact private ไม่อยู่ใน repo

## [2026-09-24] วัด thai-dict กับคำค้นจริง: ชุด test 6/15 — ยังไม่ผ่านเกณฑ์

**ทำอะไร:** ผู้ใช้ขอให้ Claude เขียนคำค้นเองจากสิ่งที่คนค้นจริง → ให้ subagent ที่**ห้ามเปิด** `server/ranker/` เขียน 30 ข้อจากแหล่งไทยจริง
(mindphp, thaicreate, Medium ไทย, GitHub, Pantip ฯลฯ — ไม่มีสถิติจำนวนการค้นจริง) → `spike/queries-dev.json` (15, ใช้จูน) +
`spike/queries-test.json` (15, ห้ามจูน) · 5/30 เป็น no_match ที่ถูกต้อง · `eval-ranker` รับ `expect` เป็น array ชื่อตรงเป๊ะ

**ผล:** ก่อนจูน dev 10/15 · test 4/15 → จูนจาก dev เท่านั้น (coordination factor, คำระบุประเทศเป็นตัวเสริม, json/xml ไม่นับ,
เติมคำทั่วไป) → dev 11/15 · **test 6/15 (40%) ต่ำกว่าเกณฑ์ 75% ของ ADR-0003**
· ⚠️ Claude เห็นข้อความคำค้นชุด test จากรายงานของ subagent แล้ว (ไม่ได้ใช้จูน) — ถ้าจะวัดใหม่หลังจูนเพิ่ม ต้องเขียนชุด test ใหม่

**ข้อจำกัดที่เห็นจากข้อที่ล้ม (เป็นเชิงโครงสร้าง ไม่ใช่แค่คำขาด):**
- สะกดหลายแบบ/พิมพ์ผิด: `เเ` (เอสองตัว) แทน `แ`, "ลิ้งค์" แทน "ลิงก์" → ไม่รู้จักทั้งวลี
- ความต้องการ "เฉพาะของไทย" (วันพระ, ราคาน้ำมัน ปตท, ทองตามสมาคม, หวย) → พจนานุกรมจับคำกว้าง ๆ ได้แล้วคืน API ต่างประเทศ
  แทนที่จะตอบ no_match — ต้องเข้าใจความหมาย ไม่ใช่แค่แปลคำ
- ชื่อ API ชนะเสมอ (ตรงชื่อ ×3) → "สุ่มข้อมูลผู้ใช้พร้อมรูปโปรไฟล์" ได้ API รูปภาพแทน RandomUser

## [2026-09-24] v0.5.1 thai-dict รอบสอง — ชุด holdout ใหม่ 14/20 (70%)

**ผู้ใช้ตัดสิน:** ทำข้อ 1 (ใช้พจนานุกรมต่อ ปรับเพิ่ม) · "สายงาน dev คนส่วนใหญ่ก็น่าจะ search เป็น Eng" → ชุดวัดผลใหม่มีคำค้นอังกฤษด้วย

**ทำอะไร (กฎทั่วไป ไม่ใช่คำเฉพาะข้อสอบ):** `normalizeThai` (เเ→แ, อักขระล่องหน, นิคหิต+า→ำ) · `variants` คำสะกดแบบอื่น 40 คำ แทนระดับข้อความก่อนตัดคำ
· `thaiOnly` 18 คำ (หวย พร้อมเพย์ ปตท วันพระ สลิป…) = ของไทยที่ Catalogue ไม่มี → no_match มั่นใจ 0.8 · เติมคำ (ปลอม ฝึก ผู้ใช้ โปรไฟล์ แจ้งเตือน ฯลฯ)
· ปรับจาก dev + ชุด test เดิม (ชุดเดิมใช้ไปแล้ว: dev 13/15, test เดิม 14/15 — **ตัวเลขนี้ไม่ใช่ผลวัด**)

**วัดผล:** subagent ตัวใหม่ (ห้ามเห็นพจนานุกรมและชุดเก่า) เขียน `spike/queries-holdout.json` 20 ข้อ (ไทย 12 · อังกฤษ 8 · no_match 3) → วัดครั้งเดียว:

| | thai-dict | keyword (เดิม) |
|---|---|---|
| ไทย | 8/12 | 1/12 |
| อังกฤษ | 6/8 | 5/8 |
| **รวม** | **14/20 (70%)** | 6/20 |

ยังขาด 1 ข้อจากเกณฑ์ 15/20 · ข้อที่ล้ม: สะกดผิดที่ไม่อยู่ใน variants (แผ่นดิไหว, นักขัติฤกษ์), คำค้นอังกฤษที่ Catalogue ไม่มี (real estate) ได้ผลมั่ว,
"free weather api no key" ได้ Pirate Weather (Catalogue บอกไม่ต้องใช้ key แต่ของจริงต้องใช้แล้ว) และ Open-Meteo ไม่ติดเพราะเสมอกันเรียงตามชื่อ
· ชุด holdout นี้ถูกใช้แล้ว — วัดรอบหน้าต้องเขียนชุดใหม่อีกครั้ง

## [2026-09-24] พยายามดัน thai-dict ให้ถึง 18/20 — ชุดวัดใหม่ได้ 14/20 เท่าเดิม (ไม่ถึงเป้า)

**ผู้ใช้ขอ:** "ปรับเพิ่มให้ผ่าน 18/20" · อธิบายก่อนเริ่มว่าจูนชุดเดิมจนได้ 18 = ตัวเลขไม่มีความหมาย → จูนจากชุดที่ใช้แล้ว แล้ววัดด้วยชุดใหม่ที่ไม่เคยเห็น

**เพิ่มอะไร (กฎทั่วไป):** fuzzy match คำไทยสะกดผิด (Levenshtein ≤1 เมื่อคำยาว ≥5, ≤2 เมื่อ ≥9) · หมวดตรงทั้งหมวด = น้ำหนักเท่าชื่อ ·
ตรงหลายช่อง (ชื่อ/หมวด/คำอธิบาย) +0.1 · ใช้ง่าย (ไม่ใช้ key/CORS/HTTPS) +สูงสุด 8% · "ฟรี/free" เอียงไปทางไม่ใช้ key +10% ·
ไม่นับซ้ำเมื่อพูดสองภาษา ("ตัดคำ nlp") · คำจุดประสงค์ (บอท/แจ้งเตือน) เป็นตัวเสริม · คำปฏิเสธ ("ที่ไม่ใช่ google map", "alternative to X") ตัดออก ·
englishAliases / englishStopwords · ตัดวรรณยุกต์ละติน (Pokémon) ใน tokenize · เติมเกม/เติมเงิน ใน thaiOnly · แก้บั๊ก: เรียงด้วยคะแนนดิบ (เดิมตัดที่ 1 ก่อนเรียง)

**ผิดพลาดระหว่างทาง:** กฎ "ตรงไม่ถึงครึ่ง = no_match" (เพิ่มเพื่อแก้ real estate ข้อเดียว) ทำให้ holdout2 ตกจาก 16 เหลือ 13 —
คำค้นอังกฤษทั่วไปกลายเป็น no_match · ชุดปรับมีคำค้นอังกฤษน้อยเกินจะเห็น · **เอาออกแล้ว** (ตัดสินจาก holdout2 → holdout2 กลายเป็นชุดปรับ)

**ผลวัด (วัดครั้งเดียวต่อชุด · เทียบกับ v0.5.1 ที่ใช้งานอยู่):**

| ชุด | สถานะ | ใหม่ | v0.5.1 | keyword |
|---|---|---|---|---|
| ชุดปรับ 70 ข้อ (dev+test+holdout+holdout2) | ใช้จูนแล้ว | 65/70 | — | — |
| holdout2 (20) | ใช้ตัดสินเอากฎออก | 16/20 | 16/20 | 11/20 |
| **holdout3 (20) — ชุดสุดท้าย ไม่เคยเห็น** | **ตัวเลขจริง** | **14/20** (ไทย 10/12 · อังกฤษ 4/8) | 14/20 | 8/20 |

**ข้อสรุป:** พจนานุกรมตันที่ ~70% กับคำค้นที่ไม่เคยเห็น · กฎที่เพิ่มถูกต้องเชิงพฤติกรรม (มีเทส) แต่ไม่ได้เพิ่มตัวเลข ·
ข้อที่ล้มเป็นเรื่อง**ความหมาย** ไม่ใช่คำขาด: "free llm api" (ต้องรู้ว่า Groq/Gemini คือ LLM), "live flight tracking" (ชื่อที่มี tracking ชนะ),
"nutrition from barcode", "leetcode" (ควร no_match), คำสะกดผิดที่ต่างเกิน 1 ตัว (บิทคอย) · **ฝั่งอังกฤษอ่อนกว่าไทย** (4/8) เพราะไม่มีตัวช่วยความหมายเลย
· 18/20 กับชุดที่ไม่เคยเห็นน่าจะต้องใช้ Ranker ที่เข้าใจความหมาย (Claude/Jev) — ยังไม่ได้วัด
· **บั๊กที่หลุดไปใน commit ก่อน:** เพิ่ม "ตอน" → episode ทำให้ "หาเพื่อนคุยตอนดึก" ไม่เป็น no_match → เดโมไม่มีข้อ No match (ผิด spec §8)
  แก้: "ตอน" เป็น stopword (ปกติแปลว่า "เวลา") + `test/demo.test.ts` บังคับ No match หนึ่งข้อ และ hits มีแค่ฟิลด์สาธารณะ · holdout3 ยัง 14/20

---

## งานถัดไป

ดู `HOTCACHE.md` › งานถัดไป
