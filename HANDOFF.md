# HANDOFF

> **เขียนทับทั้งไฟล์ทุกครั้งที่ส่งมอบ** · ส่งมอบเมื่อ: 2026-09-24 · เซสชัน 3 (v0.2.0 → v0.5.0)

## ทำอะไรไปในเซสชันนี้
- tag v0.2.0–v0.5.0 · GitHub `VoramethP/api-vault` · Vercel https://api-vault-two.vercel.app (push main = deploy)
- v0.5.0: ค้นไทยด้วยพจนานุกรม (`thai-dict`, ฟรี) + `/demo` · Claude ranker เก็บไว้ไม่เปิด
- BMC (แผนทำเงิน) อยู่ใน artifact private — ลิงก์อยู่ในความจำของ Claude ไม่ใส่ใน repo public

## สถานะ ณ ตอนส่ง
- working tree สะอาด · `npm run check` ผ่าน (67 เทส) · build + scan-build ผ่าน · tag ล่าสุด `v0.5.0`
- ผู้ใช้ใช้ `vault pull` จริงแล้ว · token CLI ที่หลุดบนจอถูกเพิกถอน ใช้ `nx_macbook-2`

## ค้างอยู่ตรงไหน
- **รอผู้ใช้**: เขียนคำค้นไทย 20 ข้อใน `spike/queries.json` (ต้องเป็นผู้ใช้เขียน ไม่ใช่ Claude)

## ทำต่อยังไง
1. ได้คำค้นแล้ว → `npm run eval:ranker` → เติม `server/ranker/thai-dict.json` จนผ่าน ≥ 15/20 → `npm run demo:build` → commit
2. ถามผู้ใช้ว่าเก็บสำเนา `VAULT_MASTER_KEY` นอกเครื่องแล้วหรือยัง
3. v1.0.0 รอ Jev (TypeSafe)

## เกณฑ์ว่าไม้นี้ส่งได้จริง
เปิดแชตใหม่ อ่านไฟล์นี้ + `HOTCACHE.md` แล้วทำงานต่อได้ทันที
