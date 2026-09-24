# HANDOFF

> **เขียนทับทั้งไฟล์ทุกครั้งที่ส่งมอบ** · ส่งมอบเมื่อ: 2026-09-24 · เซสชัน 2 (kickoff → v0.1.0 → v0.2.0 WIP)
> เหตุผลที่ส่ง: ผู้ใช้ขอเปิดแชตใหม่ — ประวัติยาว (kickoff, spec, drawio, v0.1.0, Supabase, v0.2.0) อาจทำให้สับสน

## ทำอะไรไปในเซสชันนี้
- Kickoff + `docs/spec.md` + `docs/design/api-vault.drawio` (10 หน้า)
- **v0.1.0** (tag) ขึ้น Supabase จริงแล้ว: migrate → import 1,871 → `db:verify` ผ่าน (anon เห็น 0)
- **v0.2.0 โค้ดเสร็จ ยังไม่ tag** — ล็อกอิน + บังคับ TOTP + `requireOwner()` กันทุก `/api/*`

## สถานะ ณ ตอนส่ง
- **working tree:** สะอาด (มีแค่ `.env` ที่ gitignored)
- **เทส:** `npm run check` ผ่าน (typecheck + 26 เทส)
- **commit ล่าสุด:** `442511e feat(auth): v0.2.0 WIP …` · tag ล่าสุด `v0.1.0`
- **ไม่มี git remote** — ยังไม่ได้ push ที่ไหนเลย (รอผู้ใช้อนุญาต)

## ค้างอยู่ตรงไหน
v0.2.0 เหลือแค่ **ทดสอบล็อกอินจริง** ซึ่งต้องให้ผู้ใช้ทำเองบางขั้น:

1. ⏳ ผู้ใช้กรอก `OWNER_EMAIL=` ใน `.env` (key อยู่ท้ายไฟล์แล้ว ค่ายังว่าง — ว่าง = `/api/*` ตอบ 500 โดยตั้งใจ)
2. ⏳ ผู้ใช้สร้างบัญชีเจ้าของ: Supabase › Authentication › **Users › Add user › Create new user** · อีเมลตรงกับ `OWNER_EMAIL` · ✅ **Auto Confirm User**

## ทำต่อยังไง
1. ถามว่าข้อ 1–2 เสร็จหรือยัง
2. เปิด dev ใน browser pane: `preview_start` ชื่อ `dev` (`.claude/launch.json`, พอร์ต 3100) — **ต้อง restart ทุกครั้งที่ `.env` เปลี่ยน**
3. **ผู้ใช้ล็อกอินเอง** ที่ `/login` (Claude ห้ามพิมพ์รหัสผ่าน) → ถูกพาไป `/mfa/enroll` → **ให้ผู้ใช้หยุดที่หน้า QR ก่อนใส่รหัส**
4. ตอนอยู่ที่ aal1: รัน `fetch('/api/search?q=weather').then(r => r.status)` ใน browser pane → **ต้องได้ 403** (รหัสผ่านอย่างเดียวต้องไม่พอ)
5. ผู้ใช้สแกน QR + ใส่รหัส → หน้า `/` ต้องค้นได้ (200) · ลองออกจากระบบ → เข้าใหม่ → ต้องไปหน้า `/mfa` (ไม่ใช่ enroll)
6. ผ่านทั้งหมด → เขียน CHANGELOG `[0.2.0]` + `npm pkg set version=0.2.0` + commit + `git tag -a v0.2.0` → อัปเดต HOTCACHE/WORKLOG
7. เจอปัญหา → แก้ แล้วเพิ่มกับดักใน HOTCACHE

## สิ่งที่ตกลงกันไว้แต่ยังไม่ได้เขียนลงไฟล์ไหน
- ผู้ใช้**ปิด sign-up แล้ว** (ตรวจจาก `GET /auth/v1/settings` → `disable_signup: true`) และ**เปิด TOTP แล้ว**
  (เมนู: Authentication › CONFIGURATION › **Multi-Factor** — ค่าเริ่มต้นของ Supabase คือเปิดอยู่แล้ว)
- **ทำ TOTP หาย** → ลบ factor ของ user ใน Supabase dashboard › Users แล้วลงทะเบียนใหม่ (ยังไม่ได้ใช้ recovery codes ของ auth-js 2.117)
- **ห้าม deploy ขึ้น Vercel ก่อน tag v0.2.0** · ตอน deploy ต้องตั้ง Authentication › **URL Configuration** (Site URL / Redirect URLs) ให้ตรงโดเมน
- **GitHub:** ผู้ใช้ยังไม่ได้ตอบว่าให้ `gh repo create VoramethP/api-vault --public` + push ไหม — ถามก่อน และรัน `/repo-hygiene` ก่อน push แรก
- ทดสอบแล้ว (dev + `OWNER_EMAIL` ชั่วคราว): ไม่มี cookie → 401 · cookie ปลอม → 401 · `/`, `/mfa`, `/mfa/enroll` ไม่ล็อกอิน → 302 `/login` · `/about` → 200

## เกณฑ์ว่าไม้นี้ส่งได้จริง
เปิดแชตใหม่ อ่านไฟล์นี้ + `HOTCACHE.md` แล้วทำงานต่อได้ทันทีโดยไม่ต้องถามอะไรเลย (นอกจากข้อ 1–2 ที่รอผู้ใช้)
