import { sql } from 'drizzle-orm'
import { bigint, boolean, jsonb, pgEnum, pgPolicy, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'
import { AUTH, CORS, SOURCE } from '../../shared/entry'

export const entryAuth = pgEnum('entry_auth', AUTH)
export const entryCors = pgEnum('entry_cors', CORS)
export const entrySource = pgEnum('entry_source', SOURCE)

// ไม่มี policy ของ anon เลย → Data API ของ Supabase ไม่เปิด Catalogue ให้คนนอก (spec §4.1)
// authenticated = เจ้าของคนเดียวเพราะปิด sign-up (ADR-0006) จึงใช้ `true` ได้
export const entries = pgTable('entries', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  description: text('description').notNull(),
  categories: text('categories').array().notNull(),
  auth: entryAuth('auth').notNull(),
  https: boolean('https').notNull(),
  cors: entryCors('cors').notNull(),
  source: entrySource('source').notNull(),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  unique('entries_name_url_key').on(t.name, t.url),
  pgPolicy('entries_select_owner', { for: 'select', to: authenticatedRole, using: sql`true` }),
  pgPolicy('entries_insert_owner', { for: 'insert', to: authenticatedRole, withCheck: sql`true` }),
  pgPolicy('entries_update_owner', { for: 'update', to: authenticatedRole, using: sql`true`, withCheck: sql`true` }),
]).enableRLS()
