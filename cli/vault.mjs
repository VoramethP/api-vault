#!/usr/bin/env node
// vault — ดึง Key ของโปรเจกต์จาก api-vault ลง .env (spec §7, ADR-0002)
// ไม่มี dependency · token ใน ~/.config/api-vault/config.json (chmod 600) บอกแค่ว่าเครื่องไหนขอ
// ทุก Pull ต้องให้เจ้าของอนุมัติบนเว็บด้วย TOTP — token หลุดอย่างเดียวดึง Key ไม่ได้
import { execFileSync, spawn } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { mergeEnv, parseArgs, serverMessage } from './lib.mjs'

const DEFAULT_URL = 'https://api-vault-two.vercel.app'
const CONFIG = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'api-vault', 'config.json')
const POLL_MS = 2000

const HELP = `vault — ดึง Key จาก api-vault ลง .env

  vault login [--url <url>]           วาง token ที่สร้างจาก <url>/vault/cli
  vault pull <project> [--file .env]  ขอ Key ของโปรเจกต์ → อนุมัติบนเว็บด้วย TOTP → เขียน .env
  vault whoami                        ดูว่า token นี้คือเครื่องไหน หมดอายุเมื่อไหร่
  vault logout                        ลบ token ออกจากเครื่องนี้
`

function fail(msg) {
  console.error(`✖ ${msg}`)
  process.exit(1)
}

function readConfig() {
  if (!existsSync(CONFIG)) fail('ยังไม่ได้ login — รัน vault login')
  const c = JSON.parse(readFileSync(CONFIG, 'utf8'))
  return { url: process.env.VAULT_URL || c.url, token: c.token }
}

async function api(cfg, path, init = {}) {
  let res
  try {
    res = await fetch(new URL(path, cfg.url), {
      ...init,
      headers: { 'authorization': `Bearer ${cfg.token}`, 'content-type': 'application/json', 'user-agent': 'api-vault-cli/0.4.0' },
    })
  }
  catch {
    fail(`ต่อ ${cfg.url} ไม่ได้`)
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) fail(serverMessage(body, res.status))
  return body
}

function askHidden(question) {
  // ไม่ใช่ terminal (เช่น pipe token เข้ามา) → อ่าน stdin ตรง ๆ
  if (!process.stdin.isTTY) return new Promise(r => { let d = ''; process.stdin.on('data', c => d += c).on('end', () => r(d.trim())) })
  return new Promise((r) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    // readline วาดบรรทัดใหม่ (prompt + ข้อความ) ทุกครั้งที่วาง/พิมพ์ — ปล่อย prompt ออกไปแค่ครั้งแรก ไม่ปล่อยตัว token เลย
    let shown = false
    rl._writeToOutput = (s) => {
      if (!shown && s.includes(question)) {
        process.stdout.write(question)
        shown = true
      }
    }
    rl.question(question, (a) => { rl.close(); process.stdout.write('\n'); r(a.trim()) })
  })
}

async function login(flags) {
  const url = typeof flags.url === 'string' ? flags.url.replace(/\/+$/, '') : DEFAULT_URL
  console.log(`สร้าง token ที่ ${url}/vault/cli แล้ววางที่นี่ (ไม่แสดงบนจอ)`)
  const token = await askHidden('token: ')
  if (!token) fail('ไม่ได้ใส่ token')
  const me = await api({ url, token }, '/api/cli/whoami')
  mkdirSync(dirname(CONFIG), { recursive: true, mode: 0o700 })
  writeFileSync(CONFIG, JSON.stringify({ url, token }, null, 2) + '\n', { mode: 0o600 })
  chmodSync(CONFIG, 0o600)
  console.log(`✔ login แล้ว: ${me.name} · หมดอายุ ${new Date(me.expiresAt).toLocaleDateString()}`)
}

/** .env ที่ git จะเก็บ = Key หลุดขึ้น repo · นอก git repo ไม่มีความเสี่ยงนี้ */
function assertIgnored(file) {
  const cwd = dirname(file)
  const git = args => execFileSync('git', args, { cwd, stdio: 'pipe' })
  try { git(['rev-parse', '--is-inside-work-tree']) }
  catch { return }
  try {
    git(['ls-files', '--error-unmatch', file])
    fail(`${file} ถูก git track อยู่ — เอาออกก่อน: git rm --cached ${file}`)
  }
  catch {}
  try { git(['check-ignore', '-q', file]) }
  catch { fail(`${file} ไม่อยู่ใน .gitignore — เพิ่มก่อน แล้วค่อย pull`) }
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open'
  try { spawn(cmd, [url], { stdio: 'ignore', detached: true }).on('error', () => {}).unref() }
  catch {}
}

async function pull(positional, flags) {
  const project = positional[0]
  if (!project) fail('ระบุโปรเจกต์: vault pull <project>')
  const file = resolve(typeof flags.file === 'string' ? flags.file : '.env')
  assertIgnored(file)
  const cfg = readConfig()

  const req = await api(cfg, '/api/cli/pull-requests', { method: 'POST', body: JSON.stringify({ project }) })
  const approveUrl = `${cfg.url}/vault/approve?code=${req.userCode}`
  console.log(`\nรหัส: ${req.userCode}\nอนุมัติที่: ${approveUrl}\n(ตรวจว่ารหัสบนเว็บตรงกับที่นี่ แล้วใส่ TOTP)\n`)
  if (!flags['no-open']) openBrowser(approveUrl)

  const deadline = new Date(req.expiresAt).getTime()
  process.stdout.write('รออนุมัติ')
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_MS))
    const r = await api(cfg, `/api/cli/pull-requests/${req.id}`)
    if (r.status === 'pending' || r.status === 'approved') { process.stdout.write('.'); continue }
    process.stdout.write('\n')
    if (r.status === 'denied') fail('คำขอถูกปฏิเสธ')
    if (r.status === 'expired') fail('คำขอหมดอายุ')
    if (r.status !== 'consumed' || !r.values) fail(`สถานะไม่คาดคิด: ${r.status}`)
    if (!r.values.length) fail(`โปรเจกต์ ${project} ยังไม่มี Key — ผูกที่ ${cfg.url}/vault/projects`)
    const existing = existsSync(file) ? readFileSync(file, 'utf8') : ''
    const merged = mergeEnv(existing, r.values, project)
    // เขียนไฟล์ชั่วคราวแล้ว rename — ไฟล์ .env ไม่มีวันถูกเขียนค้างครึ่งเดียว
    const tmp = `${file}.vault-tmp`
    try {
      writeFileSync(tmp, merged.content, { mode: 0o600 })
      renameSync(tmp, file)
    }
    finally { rmSync(tmp, { force: true }) }
    chmodSync(file, 0o600)
    console.log(`✔ ${file}`)
    if (merged.updated.length) console.log(`  อัปเดต: ${merged.updated.join(', ')}`)
    if (merged.added.length) console.log(`  เพิ่ม:   ${merged.added.join(', ')}`)
    return
  }
  process.stdout.write('\n')
  fail('หมดเวลารออนุมัติ')
}

const { command, positional, flags } = parseArgs(process.argv.slice(2))
if (command === 'login') await login(flags)
else if (command === 'pull') await pull(positional, flags)
else if (command === 'whoami') {
  const cfg = readConfig()
  const me = await api(cfg, '/api/cli/whoami')
  console.log(`${me.name} @ ${cfg.url} · หมดอายุ ${new Date(me.expiresAt).toLocaleDateString()}`)
}
else if (command === 'logout') {
  rmSync(CONFIG, { force: true })
  console.log('✔ ลบ token ออกจากเครื่องนี้แล้ว (token ยังใช้ได้จนกว่าจะเพิกถอนที่ /vault/cli)')
}
else {
  console.log(HELP)
  if (command && command !== 'help' && command !== '--help') process.exit(1)
}
