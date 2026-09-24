# Changelog

เวอร์ชันของ**แอป** ตาม [semver](https://semver.org/) · หนึ่ง release ต่อหนึ่งก้อนที่จบ · หน้า `/about` แสดงไฟล์นี้

## [Unreleased]

## [1.0.0] - 2026-09-24

### Added
- เพิ่ม Entry เองได้ (ปุ่ม "เพิ่ม Entry" บนหน้าค้น) · แก้/ลบได้เฉพาะ Entry ที่เพิ่มเอง มีป้าย "เพิ่มเอง"
  · ชื่อ+URL ซ้ำจะบอกว่าซ้ำกับ Entry ไหน · Entry ที่มี Key ผูกอยู่ลบไม่ได้ · คำอธิบายต้องเป็นภาษาอังกฤษ (ให้ค้นไทยเจอ)
- เทสกันผลค้นไทยถอยหลัง (thai-dict ≥ 14/20)

### Changed
- V1 ปิดโดยไม่รอ Jev: การค้นไทยใช้ thai-dict · Jev และ Tag อัตโนมัติย้ายไป V1.1 (ADR-0007)

## [0.5.1] - 2026-09-24

### Changed
- ค้นไทยแม่นขึ้น: รับคำสะกดหลายแบบ (เเ/แ, ลิ้งค์/ลิงก์ …), ตอบ "ไม่เจอ" สำหรับของไทยที่คลังไม่มี (หวย, พร้อมเพย์, ปตท …),
  API ที่ตรงหลายความต้องการได้อันดับดีกว่าตัวที่ตรงแค่ชื่อ · วัดกับคำค้นใหม่ 20 ข้อได้ 14/20 (เดิม keyword 6/20)

## [0.5.0] - 2026-09-24

### Added
- ค้นด้วยภาษาไทยได้แล้ว (Ranker `thai-dict`: พจนานุกรมไทย→อังกฤษ 315 คำ ไม่มีค่าใช้จ่าย) · เข้าใจ "ไม่ต้องใช้ key", "เรียกจากเบราว์เซอร์"
- หน้าเดโมสาธารณะ `/demo` — ผลค้นไทย 8 คำค้นที่คำนวณไว้แล้ว บอกว่า Ranker เข้าใจคำค้นว่าอะไร
- build ล้มถ้ามีค่าความลับหลุดเข้าไป (`scripts/scan-build.ts`)
- `npm run eval:ranker` วัดความแม่นของ Ranker · Claude ranker เขียนไว้แต่ยังไม่เปิดใช้

## [0.4.0] - 2026-09-24

### Added
- CLI `vault` (`cli/`, ไม่มี dependency): `login` · `pull <project>` · `whoami` · `logout`
- ทุก Pull ต้องอนุมัติบนเว็บ (`/vault/approve`) ด้วย TOTP — เห็นเครื่อง โปรเจกต์ และตัวแปรก่อนกด · ได้ค่าครั้งเดียว
- จัดการ token ของ CLI (`/vault/cli`) — อายุ 30 วัน · แสดงครั้งเดียว · เพิกถอนได้
- `pull` ไม่ยอมเขียน `.env` ที่ git จะเก็บ · แก้เฉพาะบรรทัดที่ดึง · ไฟล์ chmod 600

### Changed
- รหัส TOTP หนึ่งรหัสใช้ได้ครั้งเดียวข้ามทั้ง Reveal และอนุมัติ Pull (`totp_uses`)

## [0.3.0] - 2026-09-24

### Added
- Vault: เพิ่ม / แก้ชื่อ / หมุน / ลบ Key (`/vault`) — envelope encryption AES-256-GCM, DEK ต่อ Key, master key ใน env
- Reveal ต้องใส่ TOTP ใหม่ทุกครั้ง · หนึ่งรหัสต่อหนึ่ง Reveal · ค่าซ่อนเองใน 60 วินาที
- โปรเจกต์ + ชื่อ env var ต่อ Key (`/vault/projects`) เตรียมให้ `vault pull` (v0.4.0)
- Audit log (`/vault/audit`) — ทุกการเพิ่ม/แก้/ลบ/Reveal · append-only ด้วย trigger
- ปุ่ม "เพิ่ม Key" บนการ์ด API ที่ต้องใช้ key
- `db:verify` ตรวจว่า Data API แตะตาราง Vault ไม่ได้ และ audit_log แก้/ลบไม่ได้

## [0.2.0] - 2026-09-24

### Added
- ล็อกอินเจ้าของคนเดียว (`/login`) — sign-up ปิด · อีเมลต้องตรง `OWNER_EMAIL`
- บังคับ TOTP: ครั้งแรกไป `/mfa/enroll` (QR) · ครั้งต่อไปไป `/mfa` · ปุ่มออกจากระบบ
- `requireOwner()` กันทุก `/api/*` — ไม่ล็อกอิน 401 · รหัสผ่านอย่างเดียว (aal1) 403 · ต้อง aal2
- `/api/**` ส่ง `cache-control: private, no-store`
- เทสที่ล้มถ้า route ใน `server/api` ไม่เรียก `requireOwner(event)` บรรทัดแรก

## [0.1.0] - 2026-09-24

### Added
- Catalogue: ตาราง `entries` (RLS เปิด ไม่มี policy ของ anon) + migration แรก
- นำเข้า `public-apis`: 1,873 แถวต้นทาง → 1,871 Entry (API ที่อยู่สองหมวดรวมเป็นหนึ่ง) รันซ้ำได้ผลเท่าเดิม
- ค้นด้วยคำอังกฤษผ่าน Ranker seam (keyword ranker) + filter หมวด / auth / HTTPS / CORS
- บอกตรง ๆ ว่า "ไม่เจอ API ที่ตรง" แทนการเดา
- หน้า `/about` แสดงเวอร์ชันและ changelog
- `db:verify` ตรวจ RLS ในฐานะ anon / authenticated
- โครงโปรเจกต์ Nuxt 4 + Nuxt UI + Supabase + Drizzle + Zod + Vitest, Vercel `sin1` · spec + ดีไซน์ drawio · ADR-0001…0006

<!-- แผน: v0.1.0 นำเข้า+ค้น · v0.2.0 auth+MFA · v0.3.0 Vault+audit · v0.4.0 CLI · v0.5.0 เดโม · v1.0.0 Jev ranker -->
