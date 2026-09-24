// npm run db:verify — รันหลัง migrate ทุกครั้ง · RLS ที่หายไม่มีอะไรพังให้เห็นจนกว่าข้อมูลจะรั่ว
// ต้องตรวจในฐานะ anon/authenticated ภายใน transaction — postgres (เจ้าของตาราง) ข้าม RLS ทั้งหมด
import postgres from 'postgres'

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) throw new Error('MIGRATION_DATABASE_URL / DATABASE_URL is not set')
const sql = postgres(url, { prepare: false, max: 1 })
const failures: string[] = []
const VAULT_TABLES = ['keys', 'projects', 'project_keys', 'audit_log']

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
  // ตาราง Vault: RLS ไม่มี policy + REVOKE → role ของ Data API ต้องถูกปฏิเสธตั้งแต่สิทธิ์ตาราง (42501)
  for (const role of ['anon', 'authenticated'] as const) {
    for (const table of VAULT_TABLES) {
      const code = await sql.begin(async (tx) => {
        await tx.unsafe(`set local role ${role}`)
        await tx.unsafe(`select 1 from public.${table} limit 1`)
      }).then(() => 'ok', (e: { code?: string }) => e.code)
      if (code !== '42501') failures.push(`${role} แตะ ${table} ได้ (ได้ ${code} ต้องเป็น 42501)`)
    }
  }

  // audit_log append-only: trigger แบบ statement ต้องล้มแม้คำสั่งไม่โดนแถวไหน · rollback เสมอ
  for (const stmt of ['update public.audit_log set key_label = key_label where false', 'delete from public.audit_log where false']) {
    const blocked = await sql.begin(async (tx) => {
      await tx.unsafe(stmt)
      throw new Error('rollback')
    }).catch((e: Error) => /append-only/.test(e.message))
    if (!blocked) failures.push(`audit_log ไม่ได้กัน: ${stmt.split(' ')[0]}`)
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
