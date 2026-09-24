# Changelog

เวอร์ชันของ**แอป** ตาม [semver](https://semver.org/) · หนึ่ง release ต่อหนึ่งก้อนที่จบ · หน้า `/about` แสดงไฟล์นี้

## [Unreleased]

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
