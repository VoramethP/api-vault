CREATE TYPE "public"."pull_status" AS ENUM('pending', 'approved', 'denied', 'consumed');--> statement-breakpoint
CREATE TABLE "cli_tokens" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cli_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "cli_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "cli_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pull_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"token_id" bigint NOT NULL,
	"project_id" bigint NOT NULL,
	"user_code" text NOT NULL,
	"status" "pull_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"totp_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pull_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "totp_uses" (
	"totp_at" timestamp with time zone PRIMARY KEY NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "totp_uses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP INDEX "audit_log_totp_at_key";--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_token_id_cli_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."cli_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pull_requests_pending_code_key" ON "pull_requests" USING btree ("user_code") WHERE "pull_requests"."status" = 'pending';