CREATE TYPE "public"."entry_auth" AS ENUM('none', 'api_key', 'oauth', 'x_mashape_key', 'user_agent');--> statement-breakpoint
CREATE TYPE "public"."entry_cors" AS ENUM('yes', 'no', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."entry_source" AS ENUM('public_apis', 'manual');--> statement-breakpoint
CREATE TABLE "entries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text NOT NULL,
	"categories" text[] NOT NULL,
	"auth" "entry_auth" NOT NULL,
	"https" boolean NOT NULL,
	"cors" "entry_cors" NOT NULL,
	"source" "entry_source" NOT NULL,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entries_name_url_key" UNIQUE("name","url")
);
--> statement-breakpoint
ALTER TABLE "entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "entries_select_owner" ON "entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "entries_insert_owner" ON "entries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "entries_update_owner" ON "entries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);