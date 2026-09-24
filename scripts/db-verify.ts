// npm run db:verify — รันหลัง migrate ทุกครั้ง · RLS ที่หายไม่มีอะไรพังให้เห็นจนกว่าข้อมูลจะรั่ว
// ต้องตรวจในฐานะ anon/authenticated ภายใน transaction — postgres (เจ้าของตาราง) ข้าม RLS ทั้งหมด
import postgres from 'postgres'

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) throw new Error('MIGRATION_DATABASE_URL / DATABASE_URL is not set')
const sql = postgres(url, { prepare: false, max: 1 })
const failures: string[] = []

try {
  const noRls = await sql<{ relname: string }[]>`
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`
  for (const t of noRls) failures.push(`RLS ปิดอยู่: public.${t.relname}`)

  const asRole = async (role: 'anon' | 'authenticated') => {
    let n = -1
    await sql.begin(async (tx) => {
      await tx.unsafe(`set local role ${role}`)
      const [who] = await tx<{ r: string }[]>`select current_user as r`
      if (who!.r !== role) throw new Error(`set local role ไม่ติด (ได้ ${who!.r})`)
      n = (await tx<{ n: number }[]>`select count(*)::int as n from public.entries`)[0]!.n
    })
    return n
  }
  const anon = await asRole('anon')
  if (anon !== 0) failures.push(`anon อ่าน entries ได้ ${anon} แถว (ต้องเป็น 0)`)
  const authed = await asRole('authenticated')
  console.log(`authenticated เห็น entries ${authed} แถว · anon เห็น ${anon} แถว`)
}
finally {
  await sql.end()
}

if (failures.length) {
  console.error('❌ db:verify ไม่ผ่าน\n- ' + failures.join('\n- '))
  process.exit(1)
}
console.log('✅ db:verify ผ่าน')
