# HANDOFF

> **เขียนทับทั้งไฟล์ทุกครั้งที่ส่งมอบ** · ส่งมอบเมื่อ: 2026-09-24 · เซสชัน 2 (kickoff → v0.1.0)

## ทำอะไรไปในเซสชันนี้
Kickoff · `docs/spec.md` + ดีไซน์ drawio 10 หน้า · **v0.1.0** (Catalogue + ค้นอังกฤษ + `/about`) ทดสอบครบวงจรกับ
Postgres ในเครื่อง · commit ใน brain ที่ย้ายการออกแบบออก

## สถานะ ณ ตอนส่ง
- **working tree:** สะอาด (`.claude/launch.json` ไม่ได้ commit — ชี้ไป env ทดสอบใน scratchpad ของเซสชันนี้ ลบได้)
- **เทส:** `npm run check` ผ่าน 15 เทส · `npm run build` ผ่าน
- **commit ล่าสุด:** `feat: v0.1.0 …` + tag `v0.1.0`

## ค้างอยู่ตรงไหน
ไม่มีโค้ดค้าง · รอผู้ใช้สองอย่าง:
1. Supabase project `api-vault` (`ap-southeast-1`) + `.env` → แล้วรัน `npm run db:migrate && npm run db:import && npm run db:verify`
2. อนุญาตสร้าง repo GitHub public + push แรก (สแกนด้วย `/repo-hygiene` ก่อน)

## ทำต่อยังไง
1. ถามข้อ 1–2 · ถ้า `.env` มีแล้ว รันสามคำสั่งข้างบนแล้วดูผล (คาด: 1,871 Entry · anon เห็น 0)
2. เริ่ม **v0.2.0** ตาม spec §5 และ HOTCACHE › งานถัดไป

## สิ่งที่ตกลงกันไว้แต่ยังไม่ได้เขียนลงไฟล์ไหน
- ไม่มี

## เกณฑ์ว่าไม้นี้ส่งได้จริง
เปิดแชตใหม่ อ่านไฟล์นี้ + `HOTCACHE.md` แล้วทำงานต่อได้ทันทีโดยไม่ต้องถามอะไรเลย
