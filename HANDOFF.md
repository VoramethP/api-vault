# HANDOFF

> **เขียนทับทั้งไฟล์ทุกครั้งที่ส่งมอบ** · ส่งมอบเมื่อ: 2026-09-24 · เซสชัน 2 (kickoff)

## ทำอะไรไปในเซสชันนี้
Kickoff จบ: สแต็กลงครบและ build ผ่าน · ย้ายการออกแบบจาก brain มาเป็น `CONTEXT.md` + ADR-0001…0006 ·
ระบบความจำ 4 ชั้น + `CHANGELOG.md` · `git init` + commit แรก

## สถานะ ณ ตอนส่ง
- **working tree:** สะอาด
- **เทส:** `npm run check` ผ่าน (typecheck + 1 เทส) · `npm run build` ผ่าน
- **commit ล่าสุด:** `chore: kickoff api-vault`

## ค้างอยู่ตรงไหน
ไม่มีโค้ดค้าง · ติดสองอย่างที่ผู้ใช้ต้องทำ/อนุญาตเอง:
1. Supabase project `api-vault` (`ap-southeast-1`) + `.env`
2. สร้าง repo GitHub public + push แรก

## ทำต่อยังไง
1. ถามผู้ใช้ว่าข้อ 1–2 ข้างบนเสร็จหรือยัง · ถ้า push ยังไม่เกิด → `/repo-hygiene` สแกนทุก object ก่อน
2. เริ่ม **v0.1.0** ตาม `HOTCACHE.md` › งานถัดไป ข้อ 3 (ทำ schema + importer + keyword ranker ได้ก่อนมี Supabase;
   migrate จริงต้องรอ `.env`)

## สิ่งที่ตกลงกันไว้แต่ยังไม่ได้เขียนลงไฟล์ไหน
- ไม่มี — ทุกอย่างจาก brain ย้ายเข้า `CONTEXT.md` / ADR / WORKLOG แล้ว

## เกณฑ์ว่าไม้นี้ส่งได้จริง
เปิดแชตใหม่ อ่านไฟล์นี้ + `HOTCACHE.md` แล้วทำงานต่อได้ทันทีโดยไม่ต้องถามอะไรเลย
