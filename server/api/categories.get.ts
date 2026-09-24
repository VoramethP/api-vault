import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const rows = await withDb(db => db.execute<{ name: string, count: number }>(
    sql`select c as name, count(*)::int as count from entries, unnest(categories) c group by c order by c`,
  ))
  return rows.map(r => ({ name: r.name, count: r.count }))
})
