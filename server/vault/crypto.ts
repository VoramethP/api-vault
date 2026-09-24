import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// ADR-0002 · AES-256-GCM ทั้งสองชั้น · IV 12 ไบต์สุ่มใหม่ทุกครั้ง (GCM ห้ามใช้ IV ซ้ำกับกุญแจเดิมเด็ดขาด)
const ALG = 'aes-256-gcm'
const IV_BYTES = 12

export interface MasterKey { key: Buffer, version: number }

export interface Sealed {
  ciphertext: Buffer
  iv: Buffer
  authTag: Buffer
  wrappedDek: Buffer
  dekIv: Buffer
  dekTag: Buffer
  masterKeyVersion: number
}

/** อ่าน master key จาก env ต่อครั้งที่ใช้ — ไม่เก็บไว้ในตัวแปรระดับ module */
export function loadMasterKey(env: Record<string, string | undefined> = process.env): MasterKey {
  const raw = env.VAULT_MASTER_KEY
  if (!raw) throw new Error('VAULT_MASTER_KEY is not set')
  const key = Buffer.from(raw, 'base64')
  // base64 ที่ตัดขาด/พิมพ์ผิดยังถอดได้แต่ได้ไม่ครบ 32 ไบต์ — ต้องล้มตรงนี้ ไม่ใช่ไปล้มตอน Reveal
  if (key.length !== 32) throw new Error('VAULT_MASTER_KEY must be base64 of exactly 32 bytes')
  const version = Number(env.VAULT_MASTER_KEY_VERSION ?? '1')
  if (!Number.isInteger(version) || version < 1) throw new Error('VAULT_MASTER_KEY_VERSION must be a positive integer')
  return { key, version }
}

function gcmEncrypt(key: Buffer, plaintext: Buffer) {
  const iv = randomBytes(IV_BYTES)
  const c = createCipheriv(ALG, key, iv)
  const out = Buffer.concat([c.update(plaintext), c.final()])
  return { out, iv, tag: c.getAuthTag() }
}

function gcmDecrypt(key: Buffer, data: Buffer, iv: Buffer, tag: Buffer) {
  const d = createDecipheriv(ALG, key, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(data), d.final()])
}

export function seal(value: string, master: MasterKey): Sealed {
  const dek = randomBytes(32)
  try {
    const body = gcmEncrypt(dek, Buffer.from(value, 'utf8'))
    const wrap = gcmEncrypt(master.key, dek)
    return {
      ciphertext: body.out, iv: body.iv, authTag: body.tag,
      wrappedDek: wrap.out, dekIv: wrap.iv, dekTag: wrap.tag,
      masterKeyVersion: master.version,
    }
  }
  finally {
    dek.fill(0)
  }
}

/** ciphertext/tag/DEK ถูกแก้ หรือ master key ผิด → GCM โยน error เสมอ ไม่มีทางได้ค่าผิด ๆ ออกมา */
export function open(sealed: Sealed, master: MasterKey): string {
  if (sealed.masterKeyVersion !== master.version) {
    throw new Error(`Key sealed with master key v${sealed.masterKeyVersion}, env has v${master.version}`)
  }
  const dek = gcmDecrypt(master.key, sealed.wrappedDek, sealed.dekIv, sealed.dekTag)
  try {
    return gcmDecrypt(dek, sealed.ciphertext, sealed.iv, sealed.authTag).toString('utf8')
  }
  finally {
    dek.fill(0)
  }
}
