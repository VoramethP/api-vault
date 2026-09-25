# HANDOFF

> **เขียนทับทั้งไฟล์ทุกครั้งที่ส่งมอบ** · ส่งมอบเมื่อ: 2026-09-25 · เซสชัน 7 (ปล่อย v1.0.1)

## ทำอะไรไปในเซสชันนี้
- ตรวจ prod: favicon SVG ขึ้นแล้ว (ไฟล์ตรง local, `<link rel="icon">` อยู่ใน head)
- ผู้ใช้ตอบว่า `Server-Timing` บน prod **เร็วพอ** → ปิดประเด็น ไม่แตะ connection ต่อ request (ADR-0005)
- ผู้ใช้เลือก **v1.0.1** คงชื่อแผน "V1.1" ของ Jev ไว้ → bump `package.json`/lock · CHANGELOG `[1.0.1]` · tag `v1.0.1`

## สถานะ ณ ตอนส่ง
- commit + tag `v1.0.1` แล้ว · **ยังไม่ push** (push main = deploy prod · ต้อง `git push --follow-tags` หรือ push tag แยก)
- `npm run check` ผ่าน

## ค้างอยู่ตรงไหน
- รอผู้ใช้สั่ง push · หลัง deploy เช็ก `/about` ต้องขึ้น 1.0.1

## ทำต่อยังไง
1. `git push origin main --follow-tags` เมื่อผู้ใช้สั่ง → เช็ก https://api-vault-two.vercel.app/about
2. งานที่พักไว้: ช่อง "ลิงก์หน้าสมัคร" ต่อ Entry (ต้อง migration) · `database.types.ts`
3. V1.1 (Jev) รอ TypeSafe เปิดรับสมัคร

## สิ่งที่ตกลงกันไว้แต่ยังไม่ได้เขียนลงไฟล์ไหน
- feature ที่มาก่อน Jev ใช้ v1.0.x ต่อไป (ไม่ยึด semver เคร่ง) — "V1.1" สงวนให้ Jev
- favicon สี hard-coded `#22c55e` — เปลี่ยน `primary` ใน `app.config.ts` ต้องแก้ SVG ตาม
- ไม่ซ่อน URL · push เมื่อผู้ใช้สั่งเท่านั้น · ความรู้ของ brain ไปที่ `../../Framework Skills`

## เกณฑ์ว่าไม้นี้ส่งได้จริง
เปิดแชตใหม่ อ่านไฟล์นี้ + `HOTCACHE.md` แล้วทำงานต่อได้ทันที
