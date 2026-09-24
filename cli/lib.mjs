// ส่วนที่ไม่แตะเครือข่าย/ดิสก์ — แยกไว้ให้เทสได้ (test/cli-lib.test.ts)

/** @param {string} name */
function lineMatcher(name) {
  return new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=`)
}

/**
 * ค่าที่ dotenv และ shell อ่านได้ตรงกัน · single quote = ไม่ตีความอะไรเลยทั้งสองฝั่ง
 * ค่าที่มี ' หรือขึ้นบรรทัดใหม่เขียนให้ถูกทั้งสองฝั่งไม่ได้ → ปฏิเสธดีกว่าเขียนค่าที่อ่านกลับมาผิด
 * @param {string} value
 */
export function formatValue(value) {
  if (/^[\w.\-/+=:@~%,]*$/.test(value)) return value
  if (!value.includes("'") && !/[\r\n]/.test(value)) return `'${value}'`
  throw new Error('ค่ามี \' หรือขึ้นบรรทัดใหม่ — เขียนลง .env ให้อ่านกลับได้ถูกต้องไม่ได้')
}

/**
 * แก้เฉพาะบรรทัดของตัวแปรที่ดึงมา · บรรทัดอื่นอยู่ครบ · ตัวที่ยังไม่มีต่อท้ายไฟล์
 * @param {string} existing เนื้อหา .env เดิม ('' ถ้ายังไม่มีไฟล์)
 * @param {{ envVar: string, value: string }[]} values
 * @param {string} project
 */
export function mergeEnv(existing, values, project) {
  const lines = existing === '' ? [] : existing.replace(/\r?\n$/, '').split(/\r?\n/)
  const updated = []
  const added = []
  const toAppend = []
  for (const { envVar, value } of values) {
    const line = `${envVar}=${formatValue(value)}`
    const re = lineMatcher(envVar)
    let found = false
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        lines[i] = line
        found = true
      }
    }
    if (found) updated.push(envVar)
    else {
      toAppend.push(line)
      added.push(envVar)
    }
  }
  if (toAppend.length) {
    if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('')
    lines.push(`# vault pull ${project}`, ...toAppend)
  }
  return { content: lines.length ? lines.join('\n') + '\n' : '', updated, added }
}

/**
 * @param {string[]} argv
 * @returns {{ command: string | undefined, positional: string[], flags: Record<string, string | true> }}
 */
export function parseArgs(argv) {
  const [command, ...rest] = argv
  const positional = []
  /** @type {Record<string, string | true>} */
  const flags = {}
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=', 2)
      if (v !== undefined) flags[k] = v
      else if (rest[i + 1] && !rest[i + 1].startsWith('--')) flags[k] = rest[++i]
      else flags[k] = true
    }
    else positional.push(a)
  }
  return { command, positional, flags }
}

/** ข้อความ error จาก server — ไม่ echo token หรือ header กลับออกไป @param {unknown} body @param {number} status */
export function serverMessage(body, status) {
  const b = /** @type {{ statusMessage?: string, message?: string } | null} */ (body)
  return b?.statusMessage || b?.message || `HTTP ${status}`
}
