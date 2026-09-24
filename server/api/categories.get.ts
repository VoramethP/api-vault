import { sql } from 'drizzle-orm'

// TODO(v0.2.0): กันด้วย getUser() + aal2
export default defineEventHandler(async () => {
  const rows = await withDb(db => db.execute<{ name: string, count: number }>(
    sql`select c as name, count(*)::int as count from entries, unnest(categories) c group by c order by c`,
  ))
  return rows.map(r => ({ name: r.name, count: r.count }))
})
