# ADR-0001: ไม่ทำ gateway — Vault เก็บ Key แต่ไม่ยิง API แทน

- สถานะ: ยอมรับ · 2026-09-23 (grilling) · บันทึก 2026-09-24

## บริบท
คลัง key มักถูกต่อยอดเป็น proxy/gateway ที่ยิง API ปลายทางให้ (แอปเรียก gateway แทนเก็บ key เอง)

## ตัดสินใจ
api-vault มีแค่ 2 ชั้น: Catalogue + Vault · ส่ง Key ออกไปให้ผู้ใช้ผ่าน Reveal (เว็บ) และ Pull (CLI → `.env`) เท่านั้น
**ไม่มี route ใดยิง API ปลายทางด้วย Key ของเจ้าของ**

## ผลที่ตามมา
- ✅ api-vault ล่มไม่ทำให้แอปอื่นล่ม (gateway = single point of failure ของทุกโปรเจกต์)
- ✅ ไม่ต้องรับภาระ rate limit / latency / ค่า egress แทน API ปลายทาง
- ❌ Key ออกไปอยู่ใน `.env` ของโปรเจกต์ปลายทาง — หมุน key ต้อง Pull ใหม่เอง
