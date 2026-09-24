# ADR-0002: Envelope encryption สำหรับ Key

- สถานะ: ยอมรับ · 2026-09-23 · บันทึก 2026-09-24

## ตัดสินใจ
- Key แต่ละชิ้นเข้ารหัสด้วย **AES-256-GCM** ด้วย **DEK ที่สุ่มใหม่ต่อ Key** (IV สุ่มใหม่ทุกครั้งที่เข้ารหัส)
- DEK ถูกห่อด้วย **master key ที่อยู่ใน env ของ Vercel เท่านั้น** — DB เก็บแค่ ciphertext + DEK ที่ถูกห่อ + IV + auth tag
- **Reveal ต้องยืนยันตัวใหม่ (re-auth) และเขียน audit log ทุกครั้ง** · Pull นับเป็น Reveal
- **Key ไม่ถูกส่งให้ Ranker/Jev หรือบริการภายนอกใดเลย**
- zero-knowledge ฝั่ง client (เข้ารหัสในเบราว์เซอร์) = V2

## ทำไม
DB รั่ว (dump, backup, RLS พลาด) อย่างเดียวต้องไม่พอให้อ่าน Key ได้ · DEK ต่อ Key ทำให้หมุน master key
ได้โดยห่อ DEK ใหม่ ไม่ต้องเข้ารหัส Key ทุกชิ้นใหม่

## ตัดสินเพิ่ม 2026-09-24 (v0.3.0)
- **Reveal = TOTP ใหม่ทุกครั้ง** ไม่มีช่วงผ่อน — server ตรวจเวลาใน `amr` ของ JWT (≤ 120 วิ) และ unique index บน
  `audit_log.totp_at` ทำให้หนึ่งรหัสใช้ Reveal ได้ครั้งเดียว · ไม่ verify TOTP ที่ server เพราะ secret อยู่ที่ Supabase
  และการ verify ผ่าน server client จะหมุน refresh token ใต้เท้าเบราว์เซอร์
- **4 ตัวท้ายเก็บเป็น plaintext** ให้รายการแยก Key ออก — เฉพาะ Key ≥ 16 ตัว (สั้นกว่านั้น 4 ตัวคือสัดส่วนที่ใหญ่เกินไป)
- **ตาราง Vault ไม่มี RLS policy เลย** — policy ที่ดูแค่ role `authenticated` จะปล่อย session aal1 ผ่าน Data API
- **audit append-only ด้วย trigger** ไม่ใช่แค่ไม่มี policy — server ต่อด้วย role ที่ข้าม RLS

## ผลที่ตามมา
- ต้องมีเทส crypto round-trip + เทสว่า tamper แล้ว decrypt ล้ม
- master key หาย = Key ทั้งหมดอ่านไม่ได้ → ต้องมีสำเนา master key นอก Vercel (เจ้าของเก็บเอง)
