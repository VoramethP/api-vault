-- audit_log เป็น append-only จริง: ปฏิเสธ UPDATE/DELETE/TRUNCATE แม้แต่ role postgres ที่ข้าม RLS
-- FOR EACH STATEMENT เพื่อให้ล้มแม้คำสั่งไม่โดนแถวไหนเลย — db:verify ใช้พฤติกรรมนี้ตรวจว่า trigger ยังอยู่
CREATE FUNCTION "public"."audit_log_append_only"() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (% blocked)', TG_OP;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "audit_log_no_update_delete" BEFORE UPDATE OR DELETE ON "public"."audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION "public"."audit_log_append_only"();--> statement-breakpoint
CREATE TRIGGER "audit_log_no_truncate" BEFORE TRUNCATE ON "public"."audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION "public"."audit_log_append_only"();--> statement-breakpoint
-- ชั้นที่สองนอกจาก RLS ที่ไม่มี policy: role ของ Data API ไม่มีสิทธิ์บนตาราง Vault เลย
REVOKE ALL ON "public"."keys", "public"."projects", "public"."project_keys", "public"."audit_log" FROM "anon", "authenticated";
