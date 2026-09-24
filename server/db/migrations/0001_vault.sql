CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'reveal', 'pull');--> statement-breakpoint
CREATE TYPE "public"."audit_via" AS ENUM('web', 'cli');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"key_id" bigint,
	"key_label" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"via" "audit_via" NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"totp_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "keys" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "keys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entry_id" bigint NOT NULL,
	"label" text NOT NULL,
	"ciphertext" "bytea" NOT NULL,
	"iv" "bytea" NOT NULL,
	"auth_tag" "bytea" NOT NULL,
	"wrapped_dek" "bytea" NOT NULL,
	"dek_iv" "bytea" NOT NULL,
	"dek_tag" "bytea" NOT NULL,
	"master_key_version" integer NOT NULL,
	"last4" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_keys" (
	"project_id" bigint NOT NULL,
	"key_id" bigint NOT NULL,
	"env_var" text NOT NULL,
	CONSTRAINT "project_keys_project_id_key_id_pk" PRIMARY KEY("project_id","key_id"),
	CONSTRAINT "project_keys_env_var_key" UNIQUE("project_id","env_var")
);
--> statement-breakpoint
ALTER TABLE "project_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "keys" ADD CONSTRAINT "keys_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_keys" ADD CONSTRAINT "project_keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_keys" ADD CONSTRAINT "project_keys_key_id_keys_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_at_idx" ON "audit_log" USING btree ("at");--> statement-breakpoint
CREATE UNIQUE INDEX "audit_log_totp_at_key" ON "audit_log" USING btree ("totp_at") WHERE "audit_log"."action" = 'reveal';--> statement-breakpoint
CREATE INDEX "keys_entry_id_idx" ON "keys" USING btree ("entry_id");