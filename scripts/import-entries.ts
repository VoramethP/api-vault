// npm run db:import — นำเข้า spike/data/apis.json ลงตาราง entries (รันซ้ำได้ ผลเท่าเดิม)
import { readFileSync } from 'node:fs'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import { entries } from '../server/db/schema'
import { toEntries } from '../shared/import-public-apis'

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) throw new Error('MIGRATION_DATABASE_URL / DATABASE_URL is not set')

const rows = JSON.parse(readFileSync(new URL('../spike/data/apis.json', import.meta.url), 'utf8')) as unknown[]
const list = toEntries(rows) // แถวผิด → throw ทั้งก้อน ก่อนแตะฐาน

const client = postgres(url, { prepare: false, max: 1 })
const db = drizzle({ client })
try {
  const before = (await db.select({ n: sql<number>`count(*)::int` }).from(entries))[0]!.n
  await db.transaction(async (tx) => {
    for (let i = 0; i < list.length; i += 500) {
      await tx.insert(entries).values(list.slice(i, i + 500)).onConflictDoUpdate({
        target: [entries.name, entries.url],
        set: {
          description: sql`excluded.description`,
          categories: sql`excluded.categories`,
          auth: sql`excluded.auth`,
          https: sql`excluded.https`,
          cors: sql`excluded.cors`,
          updatedAt: sql`now()`,
        },
        // ไม่ทับ Entry ที่เจ้าของเพิ่มเอง
        setWhere: sql`${entries.source} = 'public_apis'`,
      })
    }
  })
  const after = (await db.select({ n: sql<number>`count(*)::int` }).from(entries))[0]!.n
  console.log(`source rows: ${rows.length} · entries: ${list.length} · new: ${after - before} · table now: ${after}`)
}
finally {
  await client.end()
}
