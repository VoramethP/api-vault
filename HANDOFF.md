# HANDOFF

> **เขียนทับทั้งไฟล์ทุกครั้งที่ส่งมอบ** · ส่งมอบเมื่อ: 2026-09-25 · เซสชัน 5 (หลัง v1.0.0)

## ทำอะไรไปในเซสชันนี้
- `docs/RUNBOOK.md` (เข้าเว็บ → ขอ Key → Vault → `vault pull` → ใช้ในโค้ด) · ขึ้นเว็บที่ `/docs` + `/llms.txt` `/llms-full.txt`
- ปุ่ม **"ขอ Key"** บนการ์ด: เปิดเว็บเจ้าของ API + ฟอร์มเพิ่ม Key ค้างไว้ (api-vault ออก Key เองไม่ได้)
- ความเร็ว: Catalogue โหลดครั้งเดียวแล้วกรองในเบราว์เซอร์ · `/api/search` คืน id+score · cache แท็บ Vault (SWR) · `Server-Timing`
- `Referrer-Policy: strict-origin-when-cross-origin` ทุกหน้า
- ทุกอย่าง **ขึ้น prod แล้ว** (เช็ก header + ไฟล์ llms บน prod แล้ว)

## สถานะ ณ ตอนส่ง
- working tree สะอาด · push แล้ว · `npm run check` ผ่าน (96 เทส) · build + scan-build ผ่าน
- tag ล่าสุด `v1.0.0` — งานเซสชันนี้อยู่ใน CHANGELOG `[Unreleased]` ยังไม่ bump เวอร์ชัน

## ค้างอยู่ตรงไหน
- ไม่มีงานค้างกลางทาง

## ทำต่อยังไง
1. ถามผู้ใช้ว่าดู `Server-Timing` บน prod แล้ว (DevTools › Network › Timing) ยังช้าไหม — ถ้ายังช้า ต้นเหตุคือเปิด connection DB ต่อ request
   (กฎเหล็กข้อ 6 / ADR-0005) ต้องคุยก่อนแตะ
2. ถามว่าจะ tag งาน `Unreleased` เป็นเวอร์ชันอะไร — v1.1.0 จะชนชื่อ "V1.1" (Jev) ในแผน · เสนอ v1.0.1 หรือเปลี่ยนชื่อแผน Jev
3. งานที่พักไว้: ช่อง "ลิงก์หน้าสมัคร" ต่อ Entry (ต้อง migration + ตัดสินว่า Entry public_apis แก้ช่องนี้ได้ไหม) · `database.types.ts`

## สิ่งที่ตกลงกันไว้แต่ยังไม่ได้เขียนลงไฟล์ไหน
- **ไม่ซ่อน URL** (คำค้น/ตัวกรองอยู่ใน query ต่อ) — ผู้ใช้ตัดสิน เพราะไม่มีความลับใน URL และ server เช็กสิทธิ์ทุก route
- กฎความปลอดภัยของ URL เก็บเป็น skill **`url-safety`** ใน Framework Skills (brain) แล้ว — ผู้ใช้ขอให้ใช้เชิงรุกทุกโปรเจกต์
  · ความรู้ของ brain ไปที่ `../../Framework Skills` เสมอ ไม่ใช่ `~/.claude/CLAUDE.md`
- api-vault อยู่ใน `repos.json` ของ brain แล้ว (`brainpush` ดูแล) · ลบ nuxel/moneymate ออกจากรายการ sync ตามที่ผู้ใช้สั่ง
- ผู้ใช้อยากให้ **ลองบน local ก่อนขึ้น prod** — push เมื่อผู้ใช้สั่งเท่านั้น (push main = deploy)
- `/docs` กับ `/llms*.txt` เป็นสาธารณะ (เนื้อหาเดียวกับ repo public) — ผู้ใช้ไม่ได้คัดค้าน
- ปุ่ม "ขอ Key" ทดสอบได้แค่ว่าเปิด popup ถูก URL (Browser pane บล็อกเพราะไม่ใช่คลิกของผู้ใช้) · ไม่ได้บันทึก Key จริง (audit ลบไม่ได้)

## เกณฑ์ว่าไม้นี้ส่งได้จริง
เปิดแชตใหม่ อ่านไฟล์นี้ + `HOTCACHE.md` แล้วทำงานต่อได้ทันที
