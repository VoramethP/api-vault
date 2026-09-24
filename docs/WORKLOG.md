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

---

## งานถัดไป

ดู `HOTCACHE.md` › งานถัดไป
