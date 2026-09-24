// postbuild — build ต้องไม่มีค่าความลับหลุดเข้าไป (ADR-0004, repo-hygiene) · เจอ = build ล้ม
// รันทั้งในเครื่อง (อ่าน .env) และบน Vercel (env ของ build) · ไม่พิมพ์ค่าที่เจอ บอกแค่ชื่อตัวแปรและไฟล์
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// SUPABASE_URL/KEY ไม่อยู่ในนี้ — publishable key ตั้งใจให้อยู่ฝั่ง client อยู่แล้ว
const SECRET_VARS = ['DATABASE_URL', 'MIGRATION_DATABASE_URL', 'VAULT_MASTER_KEY', 'OWNER_EMAIL', 'ANTHROPIC_API_KEY', 'TYPESAFE_API_KEY']

const values = new Map<string, string>()
for (const k of SECRET_VARS) if (process.env[k]) values.set(k, process.env[k]!)
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && SECRET_VARS.includes(m[1]!) && m[2]) values.set(m[1]!, m[2].replace(/^["']|["']$/g, ''))
  }
}
// ค่าสั้นเกินจะชนข้อความทั่วไปได้ — ความลับจริงยาวกว่านี้ทั้งหมด
for (const [k, v] of values) if (v.length < 8) values.delete(k)

const dirs = ['.output', '.vercel/output'].filter(existsSync)
if (!dirs.length) {
  console.error('scan-build: ไม่พบ .output หรือ .vercel/output — รันหลัง build เท่านั้น')
  process.exit(1)
}

function* walk(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}

const found: string[] = []
let files = 0
for (const dir of dirs) {
  for (const file of walk(dir)) {
    files++
    const body = readFileSync(file)
    for (const [k, v] of values) if (body.includes(v)) found.push(`${k} ใน ${file}`)
  }
}
if (found.length) {
  console.error(`❌ scan-build: เจอค่าความลับใน build\n- ${found.join('\n- ')}`)
  process.exit(1)
}
console.log(`✅ scan-build: ${files} ไฟล์ ไม่มีค่าของ ${[...values.keys()].join(', ') || '(ไม่มีตัวแปรให้ตรวจ)'}`)
