# api-vault — Spec

> สเปกของ V1 · ศัพท์ตาม [`CONTEXT.md`](../CONTEXT.md) · เหตุผลอยู่ใน [`adr/`](adr/) · ภาพอยู่ใน [`design/api-vault.drawio`](design/api-vault.drawio)
> สถานะ: **draft 2026-09-24** — หัวข้อที่มี 🟡 ยังเป็นข้อเสนอ ต้องยืนยันก่อนเริ่มเวอร์ชันนั้น

## 1. เป้าหมาย

เจ้าของคนเดียวต้อง (1) หา API ที่ใช้ได้จากคำค้นภาษาไทย (2) เก็บ Key ที่ถือไว้แบบปลอดภัย และ (3) ดึง Key ลง `.env` ของโปรเจกต์ได้ในคำสั่งเดียว
พร้อมเดโมสาธารณะที่โชว์ว่าค้นไทยได้จริง · เพดานเวลา 1 เดือน (2026-09-24 → 2026-10-24)

### ไม่ทำใน V1

| ไม่ทำ | ไปอยู่ไหน |
|---|---|
| gateway / proxy ยิง API แทน | ไม่ทำเลย (ADR-0001) |
| ผู้ใช้หลายคน / sign-up | ไม่ทำ (ADR-0006) |
| zero-knowledge (เข้ารหัสในเบราว์เซอร์) | V2 |
| ประวัติการแก้ของ Entry | V1.1 |
| Jev ranker + Tag อัตโนมัติ | V1.1 (ADR-0007) |
| API งาน/ภายในองค์กร | ไม่ใส่ใน Catalogue |
| ค้นสดในเดโม | ไม่ทำ (ADR-0004) |

## 2. ผู้ใช้

| ใคร | ทำอะไรได้ |
|---|---|
| **เจ้าของ** (อีเมลเดียว, TOTP) | ทุกอย่าง |
| **ผู้ชมเดโม** (ไม่ล็อกอิน) | ดู `/demo` และ `/about` เท่านั้น |
| **CLI** ของเจ้าของ | Pull Key ของ Project ที่ token อนุญาต |

## 3. แผนเวอร์ชัน

ทุกเวอร์ชันจบด้วย `npm run check` ผ่าน + commit + `git tag` + บรรทัดใน `CHANGELOG.md`

| เวอร์ชัน | ได้อะไร | เกณฑ์ผ่าน |
|---|---|---|
| **v0.1.0** | Catalogue + ค้นอังกฤษ | §4 ครบ · นำเข้า 1,873 แถวต้นทาง = 1,871 Entry · ค้น "weather" ได้ top-5 เป็นหมวด Weather ทั้งหมด · คำไทย = `no_match` · `/about` แสดงเวอร์ชัน |
| **v0.2.0** | Auth + TOTP | ทุกหน้ายกเว้น `/demo` `/about` ต้องล็อกอิน + AAL2 · ทุก server route เช็ก `getUser()` · อีเมลอื่นเข้าไม่ได้ |
| **v0.3.0** | Vault + audit | §6 ครบ · เทส crypto round-trip + tamper · Reveal ต้อง re-auth และมีแถวใน audit |
| **v0.4.0** | CLI `vault pull` | §7 ครบ · pull ลง `.env` แล้วไฟล์ไม่ถูก track โดย git · pull ถูกบันทึกใน audit |
| **v0.5.0** | เดโม | §8 ครบ · เทสว่า build ของเดโมไม่มี secret |
| **v1.0.0** | เพิ่ม Entry เอง + ปิด V1 (ADR-0007) | §4.5 ครบ · `eval:ranker thai-dict spike/queries-holdout3.json` ≥ 14/20 (กันถอยหลัง) · เดโมใช้ผลของ thai-dict |
| V1.1 | Jev ranker + Tag อัตโนมัติ + ประวัติการแก้ของ Entry | Jev ผ่าน ≥ 15/20 ในชุดคำค้นใหม่ที่ไม่เคยใช้ปรับ (ADR-0003) |

~~ถ้า TypeSafe ยังปิด ณ v0.5.0: ใช้ Claude เป็น Ranker ของ v1.0.0~~ — แทนที่ด้วย ADR-0007: เจ้าของยอมรับ thai-dict 14/20 ไม่เปิด Claude · Jev ไป V1.1

## 4. Catalogue (v0.1.0)

### 4.1 ตาราง `entries`

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | `bigint` identity | |
| `name` | `text` not null | |
| `url` | `text` not null | |
| `description` | `text` not null | ต้นทางยาวสุด 128 ตัวอักษร |
| `categories` | `text[]` not null | ≥ 1 · Entry เดียวอยู่ได้หลายหมวด |
| `auth` | enum `none` `api_key` `oauth` `x_mashape_key` `user_agent` | |
| `https` | `boolean` not null | |
| `cors` | enum `yes` `no` `unknown` | |
| `source` | enum `public_apis` `manual` | |
| `tags` | `jsonb` null | Tag ที่ Ranker ตัดสิน (V1.1) · null = ยังไม่ตัดสิน |
| `created_at` `updated_at` | `timestamptz` | |

- **unique (`name`, `url`)** — แถวต้นทางที่ชื่อ+URL ซ้ำ = Entry เดียว รวม `categories`
- **RLS เปิด** · policy: `authenticated` อ่าน/เขียนได้ · **ไม่มี policy ของ `anon`** → Data API ของ Supabase ไม่เปิดให้คนนอก
  (server route อ่านผ่าน `getDb()` และกันสิทธิ์ที่ route เอง — เริ่มกันจริงใน v0.2.0)

### 4.2 นำเข้า

`npm run db:import` ← `spike/data/apis.json`

1. ทำความสะอาดค่า: ตัด backtick / backslash / control char (`\apiKey\` → `apiKey`, `` `Yes` `` → `Yes`)
2. validate ด้วย Zod (`shared/entry.ts`) — แถวไหนไม่ผ่าน **หยุดทั้งหมด** พร้อมบอกแถว ไม่ข้ามเงียบ ๆ
3. รวมแถวที่ `name`+`url` ซ้ำ → `categories` รวมกัน
4. upsert บน (`name`, `url`) — รันซ้ำได้ ผลเท่าเดิม
5. พิมพ์สรุป: แถวต้นทาง / Entry / เพิ่มใหม่ / อัปเดต

### 4.3 Ranker

```ts
interface Ranker {
  readonly name: 'keyword' | 'jev' | 'claude'
  rank(query: string, candidates: EntryForRanking[], opts: { limit: number }): Promise<RankResult>
}
type RankResult =
  | { kind: 'match', hits: { entryId: number, score: number /* 0–1 */ }[], confidence: number }
  | { kind: 'no_match', confidence: number }
```

- **ห้ามส่ง Key หรือข้อมูลใน Vault เข้า Ranker** — `EntryForRanking` มีแค่ id, name, description, categories, auth, https, cors
- เลือก Ranker ด้วย env `RANKER` (ค่าเริ่ม `thai-dict` ตั้งแต่ v0.5.0)
- **keyword ranker:** แตกคำค้นเป็นคำ (ตัวพิมพ์เล็ก ตัด stopword) · ตรงชื่อ ×3 · ตรงหมวด ×2 · ตรงคำอธิบาย ×1
  (คำละที่สูงสุดที่เดียว; "ตรง" = เท่ากัน, +s/+es, หรือขึ้นต้นด้วยคำค้นถ้าคำค้นยาว ≥ 4) · normalize 0–1 · เสมอกันเรียงตามชื่อ ·
  ไม่มีคำไหนตรงเลย = `no_match` · `confidence` = สัดส่วนคำค้นที่เจออย่างน้อยหนึ่งที่
  · ⚠️ ข้อจำกัดที่รู้แล้ว: API ที่ชื่อมีคำค้นชนะ API ที่ดีกว่าแต่ตรงแค่หมวด (ค้น "weather" → Open-Meteo ไม่ติด top-5
  เพราะมี ~20 ตัวที่ชื่อมี "Weather") — นี่คือเหตุผลที่ต้องมี Jev
- **thai-dict ranker** (v0.5.0, ไม่มีค่าใช้จ่าย): `Intl.Segmenter('th')` ตัดคำ → จับวลีไทยยาวสุดก่อน (≤ 6 ท่อน) ใน
  `server/ranker/thai-dict.json` → คำอังกฤษ (ทางเลือกใดทางเลือกหนึ่งตรงก็พอ) → ให้คะแนนแบบ keyword ranker ·
  วลีเงื่อนไข ("ไม่ต้องใช้ key", "เรียกจากเบราว์เซอร์", "https") → ตัวกรอง · คำไทยที่ไม่รู้จัก (ไม่ใช่ stopword) ลด `confidence`
  · ไม่รู้จักสักคำ = `no_match` · คำอังกฤษในคำค้นใช้ได้เหมือนเดิม · วัดด้วย `npm run eval:ranker`
- **claude ranker** (v0.5.0, เก็บไว้ไม่เปิด): structured output + cache แคตตาล็อก · `RANKER=claude` + `ANTHROPIC_API_KEY`
- **jev ranker** (V1.1): 2 request — Choice เลือกหมวด top-K → Choice เลือก Entry ในหมวดเหล่านั้น (≤ 255 ตัว) + Nouls "no match"
  ตาม `spike/run.mjs`

### 4.4 หน้าจอและ route

| route | ทำอะไร |
|---|---|
| `GET /api/search?q=&category=&auth=&https=&cors=&limit=` | กรองด้วย filter ใน SQL → ส่งให้ Ranker → คืน Entry + score + `kind` |
| `GET /api/categories` | รายชื่อหมวด + จำนวน |
| `/` | ช่องค้น + filter (หมวด, auth, HTTPS, CORS) + ผลลัพธ์ · แสดง "ไม่เจอที่ตรง" เมื่อ `no_match` |
| `/about` | เวอร์ชันปัจจุบัน + `CHANGELOG.md` + เครดิต public-apis (prerender) |

query string validate ด้วย Zod ที่ `shared/` · handler `return` ค่าเสมอ

### 4.5 เพิ่ม Entry เอง (v1.0.0 · ADR-0007)

| route | ทำอะไร |
|---|---|
| `POST /api/entries` | สร้าง Entry `source = manual` · `tags = null` |
| `PATCH /api/entries/:id` | แก้ได้เฉพาะ `source = manual` · อื่น ๆ = 403 |
| `DELETE /api/entries/:id` | ลบได้เฉพาะ `source = manual` · มี Key ผูกอยู่ = 409 (FK `restrict`) |

- ทุก route: `requireOwner` บรรทัดแรก · body validate ด้วย Zod ตัวเดียวกับ importer (`shared/entry.ts`)
- **ชื่อ+URL ซ้ำ = 409** พร้อม id ของ Entry เดิม (ไม่ upsert ทับ — อาจเป็น Entry จาก `public_apis`)
- **คำอธิบายต้องเป็นอังกฤษ** (มีตัวอักษรละตินอย่างน้อยหนึ่งคำ ไม่มีอักษรไทย) — thai-dict จับคำค้นกับข้อความอังกฤษเท่านั้น
  ฟอร์มบอกเหตุผลนี้ตรง ๆ
- Entry ใหม่ค้นเจอทันทีผ่าน `/api/search` (ไม่มี index แยก)
- 🟡 หน้าจอ: ปุ่ม "เพิ่ม Entry" บน `/` + ฟอร์มแยกหน้า · แก้/ลบจาก EntryCard ของ Entry `manual` — ยืนยันตอนเริ่มทำ

## 5. Auth (v0.2.0)

- Supabase Auth · sign-up ปิดที่ dashboard · ล็อกอินด้วยอีเมล+รหัสผ่านของเจ้าของ · TOTP บังคับ
- เปิด `supabase.redirect` · `/login` `/confirm` · ยกเว้น `/demo/**` `/about`
- server route ที่กัน: `serverSupabaseUser` / `getUser()` + ตรวจ `aal2` · ไม่ใช้ `getSession()` ตัดสินสิทธิ์
- route ที่อ่าน session ห้ามแคช

## 6. Vault (v0.3.0)

### ตาราง

| ตาราง | คอลัมน์หลัก |
|---|---|
| `keys` | `id` · `entry_id` → entries · `label` · `ciphertext` `iv` `auth_tag` (bytea) · `wrapped_dek` `dek_iv` `dek_tag` · `master_key_version` · `last4` (null ถ้า Key สั้นกว่า 16 ตัว) · `created_at` `rotated_at` |
| `projects` | `id` · `name` unique (ชื่อที่ใช้กับ `vault pull <project>`) |
| `project_keys` | `project_id` · `key_id` · `env_var` (เช่น `OPENWEATHER_API_KEY`) · env_var ไม่ซ้ำในโปรเจกต์เดียว |
| `audit_log` | `id` · `key_id` (ไม่มี FK) · `key_label` · `action` (`create` `update` `delete` `reveal` `pull`) · `via` (`web` `cli`) · `at` · `user_agent` · `totp_at` (unique เมื่อ action = reveal) |

RLS ทุกตาราง **ไม่มี policy** + REVOKE จาก `anon`/`authenticated` — Data API แตะตาราง Vault ไม่ได้เลย เข้าได้ทาง server หลัง `requireOwner()` เท่านั้น
· `audit_log` append-only ด้วย trigger (ปฏิเสธ UPDATE/DELETE/TRUNCATE แม้แต่ role postgres)

### Envelope encryption (ADR-0002)

- **เก็บ:** สุ่ม DEK 32 ไบต์ → AES-256-GCM เข้ารหัส Key ด้วย DEK (IV 12 ไบต์สุ่ม) → ห่อ DEK ด้วย master key (AES-256-GCM, IV สุ่ม) → เก็บทุกชิ้นยกเว้น DEK ดิบ
- **Reveal:** ใส่ TOTP ใหม่**ทุกครั้ง** — เบราว์เซอร์ `challengeAndVerify` → server ดูเวลา TOTP ใน `amr` (ไม่เกิน 120 วิ) → แกะ DEK → ถอด Key → เขียน `audit_log` พร้อม `totp_at` **ก่อน** ส่งค่ากลับ · `totp_at` ซ้ำ = 409 (หนึ่งรหัสต่อหนึ่ง Reveal)
- master key: `VAULT_MASTER_KEY` (base64 32 ไบต์) ใน Vercel env · `VAULT_MASTER_KEY_VERSION` สำหรับหมุน
- list Key แสดง label + Entry + **4 ตัวท้าย** (เจ้าของเลือก 2026-09-24) — เก็บแยกเป็น plaintext เฉพาะ Key ≥ 16 ตัว

## 7. CLI (v0.4.0)

```bash
npm i -g ./cli                         # จาก repo นี้ ไม่มี dependency ไม่ publish ขึ้น npm
vault login [--url <url>]              # วาง token จาก /vault/cli → ~/.config/api-vault/config.json (chmod 600)
vault pull <project> [--file .env]     # ขอ → อนุมัติบนเว็บด้วย TOTP → เขียน/อัปเดต .env
vault whoami · vault logout
```

- **token บอกแค่ว่าเครื่องไหนขอ — ถือ token อย่างเดียวดึง Key ไม่ได้** (เจ้าของเลือก 2026-09-24)
  · สร้างบนเว็บหลัง aal2 · DB เก็บ sha256 · อายุ **30 วัน** · เพิกถอนได้ · ใช้ได้กับ `/api/cli/*` เท่านั้น
- **Pull = device flow:** CLI ยื่นคำขอ → ได้รหัส 8 ตัว (`ABCD-2345`) + ลิงก์ `/vault/approve?code=` → เจ้าของเห็นเครื่อง/โปรเจกต์/ตัวแปร
  → ใส่ TOTP สด (กติกาเดียวกับ Reveal, กินรหัสใน `totp_uses`) → CLI ถามทุก 2 วิ ได้ค่า**ครั้งเดียว** (approved → consumed)
  · คำขอหมดอายุใน 10 นาที · ปฏิเสธได้โดยไม่ต้องใช้ TOTP
- ลำดับตอนส่งค่า: ถอดรหัส → `audit_log` (`pull`, `cli`) ทุก Key → commit → คืนค่า
- `pull` ปฏิเสธถ้า `.env` ถูก git track หรือไม่อยู่ใน `.gitignore` (นอก git repo ผ่าน) · แก้เฉพาะบรรทัดของ env_var ที่ดึง
  ไม่ลบบรรทัดอื่น · ไฟล์ chmod 600 · เขียนแบบ tmp + rename
- ค่าที่ปลอดภัยเขียนตรง ๆ · นอกนั้นใส่ `'…'` · ค่าที่มี `'` หรือขึ้นบรรทัดใหม่ = ปฏิเสธ (อ่านกลับให้ตรงทั้ง dotenv และ shell ไม่ได้)

## 8. เดโม (v0.5.0)

- `/demo` prerender จาก `app/demo/results.json` ที่สร้างด้วย `npm run demo:build` (คำค้นใน `app/demo/queries.json`) · 8 คำค้นไทย · หนึ่งข้อเป็น "No match"
- ผลมีแค่ข้อมูลสาธารณะของ Entry + สิ่งที่ Ranker เข้าใจ (คำ + ตัวกรอง)
- แสดง score + confidence ของแต่ละผล และบอกว่าเป็นผลจาก Ranker ตัวไหน
- **ไม่มี route API ใดใน deployment ที่ผู้ชมเดโมเรียกได้** · `postbuild` (`scripts/scan-build.ts`) สแกน `.output/` และ `.vercel/output/`
  หาค่าของ env ที่เป็นความลับ เจอ = build ล้ม (รันบน Vercel ด้วย)

## 9. Env

| ตัวแปร | ใช้ที่ | ตั้งแต่ |
|---|---|---|
| `SUPABASE_URL` `SUPABASE_KEY` | `@nuxtjs/supabase` (publishable key เท่านั้น) | v0.1.0 |
| `DATABASE_URL` | app — transaction pooler :6543 | v0.1.0 |
| `MIGRATION_DATABASE_URL` | drizzle-kit — session pooler :5432 | v0.1.0 |
| `RANKER` | เลือก Ranker (`thai-dict` ค่าเริ่ม) | v0.1.0 |
| `ANTHROPIC_API_KEY` | claude ranker (ไม่ได้ใช้ตอนนี้) | v0.5.0 |
| `VAULT_MASTER_KEY` `VAULT_MASTER_KEY_VERSION` | Vault | v0.3.0 |
| `TYPESAFE_API_KEY` | jev ranker + spike | V1.1 |

## 10. เทสที่ต้องมีก่อน V1

- `.env.example` ไม่มีค่าจริง ✅
- keyword ranker: ตรงชื่อ > ตรงหมวด > ตรงคำอธิบาย · ไม่ตรงเลย = `no_match`
- importer: ทำความสะอาดค่าสกปรก · รวมแถวซ้ำ · แถวผิดทำให้หยุด
- `db:verify` (ในฐานะ `authenticated` ภายใน transaction): RLS เปิดทุกตาราง · `anon` อ่าน `entries` ไม่ได้
- crypto round-trip · แก้ ciphertext/tag แล้ว decrypt ล้ม · DEK สองครั้งไม่ซ้ำ
- Reveal/Pull เขียน audit
- build ของเดโมไม่มี secret
- เพิ่ม/แก้/ลบ Entry: `public_apis` แก้/ลบไม่ได้ · ซ้ำ = 409 · มี Key = ลบไม่ได้ · คำอธิบายไทย = 400
- thai-dict บน `queries-holdout3.json` ≥ 14/20

## 11. คำถามที่ยังเปิด

- 🟡 Tag เก็บใน `jsonb` หรือแยกคอลัมน์ — ตัดสินตอน V1.1 เมื่อเห็นผลจริงของ Jev
- `~/types/database.types.ts` gen จาก Supabase CLI หรือ type ของ Drizzle
