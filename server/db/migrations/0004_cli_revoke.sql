-- เหมือน 0002: ตาราง Vault/CLI ปิดจาก Data API ทั้งหมด (RLS ไม่มี policy + ไม่มีสิทธิ์ตาราง)
REVOKE ALL ON "public"."totp_uses", "public"."cli_tokens", "public"."pull_requests" FROM "anon", "authenticated";--> statement-breakpoint
-- รหัสที่เคยใช้ Reveal ก่อนมี totp_uses ต้องนับว่าใช้แล้วด้วย
INSERT INTO "public"."totp_uses" ("totp_at")
  SELECT DISTINCT "totp_at" FROM "public"."audit_log" WHERE "totp_at" IS NOT NULL
  ON CONFLICT DO NOTHING;
