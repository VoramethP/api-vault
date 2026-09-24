# ADR-0005: Postgres + Drizzle, `getDb()` ต่อ request ไม่มี workspaceId

- สถานะ: ยอมรับ · 2026-09-24

## ตัดสินใจ
- ข้อมูลอยู่ Supabase Postgres (`ap-southeast-1`) ผ่าน Drizzle ตาม golden path (FDR-0001) · compute Vercel `sin1`
- **MongoDB ถูกเสนอและปฏิเสธ** (2026-09-23): ออกนอก path โดยไม่มีเหตุผลทางเทคนิค — ข้อมูลเป็นตารางชัดเจน และ RLS/auth ของ Supabase ต้องใช้ Postgres
- **เบี่ยงจาก stack-setup:** ใช้ `getDb()` ไม่มีพารามิเตอร์ `workspaceId` เพราะแอปนี้มีเจ้าของคนเดียว ไม่มี workspace
  (FDR-0013 เป็นเรื่องของ platform) · แต่ยังคงกฎ **resolve ต่อ request ห้ามมี `db` ระดับ module**

## ผลที่ตามมา
ถ้าวันหนึ่งกลายเป็นหลายผู้ใช้ ต้องเปิด ADR นี้ใหม่ ไม่ใช่เติมพารามิเตอร์เงียบ ๆ
