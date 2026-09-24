# ADR-0006: ผู้ใช้คนเดียว — Supabase auth, ปิดสมัคร, TOTP MFA

- สถานะ: ยอมรับ · 2026-09-23 · บันทึก 2026-09-24

## ตัดสินใจ
- `@nuxtjs/supabase` (FDR-0008) · **ปิด sign-up** · รับเฉพาะอีเมลเจ้าของ
- **TOTP MFA บังคับ** (อยู่ใน free tier — ตรวจ 2026-09-23) · route ของ Vault ต้องการ AAL2
- ตรวจสิทธิ์ฝั่ง server ด้วย `getUser()` ทุก route ที่กัน · **ห้าม `serverSupabaseServiceRole`**
- RLS ทุกตารางตั้งแต่ migration แรก และเทสในฐานะ `authenticated`

## ทำไม
Vault เก็บความลับ — รหัสผ่านอย่างเดียวไม่พอ และไม่มีเหตุผลให้ใครอื่นสมัครได้
