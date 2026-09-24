import { defineConfig } from 'drizzle-kit'

// migrator ใช้ session pooler (5432) — direct connection ของ Supabase เป็น IPv6 อย่างเดียว
export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? '' },
  entities: { roles: { provider: 'supabase' } },
})
