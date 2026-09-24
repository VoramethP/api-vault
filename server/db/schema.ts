import { sql } from 'drizzle-orm'
import { bigint, boolean, customType, index, integer, jsonb, pgEnum, pgPolicy, pgTable, primaryKey, text, timestamp, unique, uniqueIndex } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'
import { AUTH, CORS, SOURCE } from '../../shared/entry'
import { AUDIT_ACTION, AUDIT_VIA } from '../../shared/vault'

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

// ---------- Vault (ชั้น 2) ----------
// RLS เปิดแต่ไม่มี policy เลย = Data API ของ Supabase แตะไม่ได้แม้แต่ session ของเจ้าของ
// เพราะ policy ที่ดูแค่ role authenticated จะปล่อย session aal1 (รหัสผ่านอย่างเดียว) อ่าน label/4 ตัวท้ายได้
// เข้าถึงได้ทางเดียวคือ server ผ่าน getDb() หลัง requireOwner() (aal2)

const bytea = customType<{ data: Buffer, driverData: Buffer }>({ dataType: () => 'bytea' })

export const auditAction = pgEnum('audit_action', AUDIT_ACTION)
export const auditVia = pgEnum('audit_via', AUDIT_VIA)

export const keys = pgTable('keys', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  entryId: bigint('entry_id', { mode: 'number' }).notNull().references(() => entries.id, { onDelete: 'restrict' }),
  label: text('label').notNull(),
  // ADR-0002: Key เข้ารหัสด้วย DEK · DEK ถูกห่อด้วย master key ใน env · DB ไม่มี DEK ดิบ
  ciphertext: bytea('ciphertext').notNull(),
  iv: bytea('iv').notNull(),
  authTag: bytea('auth_tag').notNull(),
  wrappedDek: bytea('wrapped_dek').notNull(),
  dekIv: bytea('dek_iv').notNull(),
  dekTag: bytea('dek_tag').notNull(),
  masterKeyVersion: integer('master_key_version').notNull(),
  // เจ้าของเลือกให้เห็น 4 ตัวท้ายในรายการ — null เมื่อ Key สั้นเกินจนการโชว์ 4 ตัวบอกความลับมากไป
  last4: text('last4'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  rotatedAt: timestamp('rotated_at', { withTimezone: true }),
}, t => [index('keys_entry_id_idx').on(t.entryId)]).enableRLS()

export const projects = pgTable('projects', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  // ชื่อที่พิมพ์กับ `vault pull <project>`
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

export const projectKeys = pgTable('project_keys', {
  projectId: bigint('project_id', { mode: 'number' }).notNull().references(() => projects.id, { onDelete: 'cascade' }),
  keyId: bigint('key_id', { mode: 'number' }).notNull().references(() => keys.id, { onDelete: 'cascade' }),
  envVar: text('env_var').notNull(),
}, t => [
  primaryKey({ columns: [t.projectId, t.keyId] }),
  // .env หนึ่งไฟล์มีชื่อซ้ำไม่ได้
  unique('project_keys_env_var_key').on(t.projectId, t.envVar),
]).enableRLS()

// append-only: trigger ใน migration 0002 ปฏิเสธ UPDATE/DELETE/TRUNCATE แม้แต่ role postgres
// จึงไม่มี FK ไป keys — ON DELETE SET NULL คือ UPDATE ที่ trigger จะปฏิเสธ · เก็บ label ไว้ให้อ่านรู้เรื่องหลัง Key ถูกลบ
export const auditLog = pgTable('audit_log', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  keyId: bigint('key_id', { mode: 'number' }),
  keyLabel: text('key_label').notNull(),
  action: auditAction('action').notNull(),
  via: auditVia('via').notNull(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  userAgent: text('user_agent'),
  // เวลาที่ยืนยัน TOTP ที่ใช้ Reveal ครั้งนี้ — หนึ่งรหัสต่อหนึ่ง Reveal (index ด้านล่างบังคับ)
  totpAt: timestamp('totp_at', { withTimezone: true }),
}, t => [
  index('audit_log_at_idx').on(t.at),
  uniqueIndex('audit_log_totp_at_key').on(t.totpAt).where(sql`${t.action} = 'reveal'`),
]).enableRLS()
