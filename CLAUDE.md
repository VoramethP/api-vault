# CLAUDE.md

## 🤝 เปิดแชตใหม่: อ่าน 2 ไฟล์นี้ก่อนเสมอ ตามลำดับ

**ก่อนจะค้นไฟล์ ก่อนจะ grep ก่อนจะเปิดเอกสารใด ๆ:**

| ลำดับ | ไฟล์ | ตอบคำถามว่า |
|---|---|---|
| 1️⃣ | [`HANDOFF.md`](HANDOFF.md) | **เมื่อกี้ทำอะไรค้างอยู่ · ทำต่อยังไง** |
| 2️⃣ | [`HOTCACHE.md`](HOTCACHE.md) | **โปรเจกต์อยู่ตรงไหน · กฎเหล็ก · กับดักที่เคยเจอ** |

สองไฟล์นี้ยาวรวมกันไม่ถึง 900 คำ **คำตอบส่วนใหญ่อยู่ในนั้นแล้ว**
ค่อยไปเปิดไฟล์อื่นเมื่อสองไฟล์นี้ตอบไม่ได้จริง ๆ ตามลำดับนี้:

| หา | เปิด |
|---|---|
| สเปก V1 (ตาราง, route, Ranker contract, เกณฑ์ผ่านของแต่ละเวอร์ชัน) | [`docs/spec.md`](docs/spec.md) |
| ภาพดีไซน์ทั้งระบบ (10 หน้า) | [`docs/design/api-vault.drawio`](docs/design/api-vault.drawio) |
| คำนี้ในโปรเจกต์แปลว่าอะไร (Entry, Key, Vault, Ranker, Reveal, Demo…) | [`CONTEXT.md`](CONTEXT.md) |
| ประวัติว่าทำอะไรไปบ้าง ทำไมถึงตัดสินใจแบบนั้น | [`docs/WORKLOG.md`](docs/WORKLOG.md) |
| เหตุผลเบื้องหลังการตัดสินใจเชิงสถาปัตยกรรม | [`docs/adr/`](docs/adr/) |
| เวอร์ชันที่ปล่อยแล้ว | [`CHANGELOG.md`](CHANGELOG.md) |
| spike วัดความแม่นของ Jev กับคำค้นไทย | [`spike/`](spike/) (`run.mjs`, `queries.json`, `data/apis.json`) |
| ความรู้เรื่อง Jev | wiki ของ brain (`../../Framework Skills`): `typesafe-jev`, `typed-judgments-not-generated-text`, `confidence-gated-composition`, `jev-thai-accuracy` |

### ระบบความจำ 4 ชั้น — แต่ละไฟล์มีหน้าที่ต่างกัน ห้ามเขียนซ้ำกัน

| ไฟล์ | เปรียบเหมือน | ขอบเขต | ความยาว |
|---|---|---|---|
| `HANDOFF.md` | **ไม้ที่ส่งต่อ** | เฉพาะงานที่ค้างอยู่ ณ ตอนส่งมอบ | สั้น เขียนทับทั้งไฟล์ทุกครั้ง |
| `HOTCACHE.md` | **ความจำระยะสั้น** | สถานะโปรเจกต์ · กฎเหล็ก · กับดัก | **ห้ามเกิน 500 คำ** |
| `docs/WORKLOG.md` | **ความจำระยะยาว** | ทุกอย่างที่เคยเกิดขึ้น + เหตุผล | ไม่จำกัด |
| `CONTEXT.md` | **พจนานุกรม** | **คำนี้ในโปรเจกต์นี้แปลว่าอะไร** เท่านั้น | สั้น ไม่มีรายละเอียด implement |

> ถ้าสิ่งที่จะเขียนลง `CONTEXT.md` ไม่ใช่ "นิยามของคำ" แปลว่ามันควรไปอยู่ไฟล์อื่น

### 🔄 ทำงานเสร็จเป็นชิ้น (commit แล้ว) → อัปเดต 3 ที่

1. `HOTCACHE.md` — สถานะ, งานถัดไป, กับดักใหม่, **ห้ามเกิน 500 คำ**
2. `docs/WORKLOG.md` — รายละเอียดเต็ม ต่อท้าย**ก่อน**หัวข้อ "งานถัดไป" เสมอ
3. ถ้าจบก้อนตามแผน: `package.json` version + บรรทัดใน `CHANGELOG.md` + `git tag vX.Y.Z` (หน้า `/about` อ่านจากตรงนี้)

### 🚨 context ใกล้เต็ม → เสนอ handoff

อย่ารอให้ผู้ใช้สังเกต · ขั้นตอนเต็มอยู่ใน skill `handoff` (`/handoff`)

---

## 🔬 Skill ที่ใช้ได้

อยู่ที่ `~/.claude/skills/` (คัดลอกมาจาก `Framework Skills` ด้วย `brainpull`) — ใช้ได้ทุกโปรเจกต์ ไม่ได้ติดตั้งในโปรเจกต์นี้

| พิมพ์ | ได้อะไร | เขียนไฟล์ไหม |
|---|---|---|
| `/context-checker` | งานก้อนถัดไปพอกับ context ที่เหลือไหม | ❌ |
| `/grill-me` · `/grilling` | ซักไซ้จนตกผลึก ใช้ได้กับทุกเรื่อง | ❌ |
| `/grill-with-docs` · `/domain-modeling` | ซักไซ้ + บันทึกคำลง `CONTEXT.md` และการตัดสินใจลง `docs/adr/` | ✅ |
| `/stack-setup` | กติกาของ Nuxt/Supabase/Drizzle/RLS/region | ❌ |
| `/ui-decision` | เช็กลิสต์ออกแบบหน้าจอด้วย Nuxt UI | ❌ |
| `/repo-hygiene` | กัน secret หลุดเข้า git — **ใช้ก่อน push ครั้งแรกและทุกครั้งที่แตะ `.env*`** | ❌ |
| `/handoff` | ปิดเซสชันให้เซสชันหน้าทำต่อได้ทันที | ✅ |

---

## โปรเจกต์นี้คืออะไร

**api-vault** คือคลัง API กลางของเจ้าของคนเดียว: **Catalogue** ของ API ฟรี/สาธารณะ (ตั้งต้น 1,873 รายการจาก
`public-apis`, MIT) + API ที่เจ้าของเพิ่มเอง ค้นได้เป็นภาษาไทยผ่าน **Ranker** และ **Vault** เก็บ Key แบบเข้ารหัส
ดึงออกด้วย Reveal บนเว็บหรือ `vault pull` ลง `.env` · repo public มีเดโมสาธารณะ · เพดานเวลา 1 เดือน (เริ่ม 2026-09-24)

| ห้ามปนกัน | |
|---|---|
| **Catalogue** (ชั้น 1) vs **Vault** (ชั้น 2) | ข้อมูลสาธารณะ vs ความลับ — ตาราง route และสิทธิ์แยกกัน |
| **Version ของแอป** vs **ประวัติของ Entry** | อย่างแรกคือ semver + CHANGELOG · อย่างหลังคือ V1.1 |
| **Vault** vs **gateway** | Vault ไม่ยิง API แทนใคร (ADR-0001) |

---

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # nuxt dev (ต้องมี SUPABASE_URL + SUPABASE_KEY ใน .env)
npm run check        # typecheck + test — ต้องผ่านก่อน commit
npm run build
npm run db:generate  # drizzle-kit generate — สร้างไฟล์ migration จาก server/db/schema.ts
npm run db:migrate   # drizzle-kit migrate — ใช้ MIGRATION_DATABASE_URL (session pooler :5432)
npm run db:import    # นำเข้า spike/data/apis.json → entries (รันซ้ำได้)
npm run db:verify    # ตรวจ RLS ในฐานะ anon/authenticated — รันหลัง migrate ทุกครั้ง
node --env-file=.env spike/run.mjs   # spike Jev (ต้องมี TYPESAFE_API_KEY)
```

---

## กฎเหล็ก (ละเมิดไม่ได้)

1. **ไม่มี gateway** — ห้ามมี route ที่ยิง API ปลายทางด้วย Key ของเจ้าของ ([ADR-0001](docs/adr/0001-no-gateway.md))
2. **Key เข้ารหัสแบบ envelope เสมอ · master key อยู่ใน env เท่านั้น ไม่เคยลง DB · Reveal ต้อง re-auth + audit**
   ([ADR-0002](docs/adr/0002-envelope-encryption.md))
3. **Key ไม่ถูกส่งให้ Ranker/Jev/Claude หรือบริการภายนอกใด** ([ADR-0002](docs/adr/0002-envelope-encryption.md), [ADR-0003](docs/adr/0003-ranker-seam.md))
4. **การค้นผ่าน `Ranker` interface เท่านั้น** — UI ห้ามเรียก Jev/Claude ตรง ([ADR-0003](docs/adr/0003-ranker-seam.md))
5. **เดโมไม่ยิง Ranker สด ไม่มี secret ใน build** ([ADR-0004](docs/adr/0004-precomputed-demo.md))
6. **`getDb()` ต่อ request ห้ามมี `db` / Supabase client / state ระดับ module** ([ADR-0005](docs/adr/0005-postgres-single-tenant-getdb.md), FDR-0008)
7. **ห้าม `serverSupabaseServiceRole` · ตรวจสิทธิ์ server ด้วย `getUser()` · RLS ทุกตาราง (`.enableRLS()`)**
   ([ADR-0006](docs/adr/0006-single-owner-auth-totp.md))
8. **migration ด้วย `drizzle-kit generate` + `migrate` เท่านั้น** ห้าม `push` ห้าม Supabase CLI migration ห้ามแก้ DB ผ่าน dashboard (FDR-0009)

---

## โครงสร้าง

```
app/            client — pages/ (index ค้นหา, about), components/, layouts/
server/api/     search.get.ts · categories.get.ts
server/ranker/  Ranker interface + keyword ranker (ADR-0003)
server/utils/   db.ts (getDb / withDb) — Nitro auto-import
server/db/      schema.ts (Drizzle) + migrations/ (generate เท่านั้น)
shared/         Zod schema ที่ใช้สองฝั่ง · importer ของ public-apis · parser ของ CHANGELOG
scripts/        import-entries.ts · db-verify.ts (รันด้วย tsx)
test/           Vitest
spike/          สคริปต์วัด Jev ไม่ใช่ส่วนของแอป — data/apis.json คือแหล่งนำเข้า 1,873 รายการ
docs/adr/       การตัดสินใจ · docs/WORKLOG.md ประวัติ · docs/spec.md สเปก · docs/design/ drawio
vercel.json     regions: sin1 (ต้องตรงกับ Supabase ap-southeast-1)
```

## ธรรมเนียมการเขียน

- **ภาษาไทย** สำหรับ commit message, คอมเมนต์อธิบาย "ทำไม", และการสนทนา
- ชื่อตัวแปร/ฟังก์ชันเป็นอังกฤษ · ศัพท์โดเมนตาม `CONTEXT.md` (Entry ไม่ใช่ Api/Item)
- คอมเมนต์อธิบาย **ทำไม** ไม่ใช่ **อะไร**
- commit format: `feat(scope):` / `fix(scope):` / `chore:` / `docs:` + คำอธิบายไทย
- ต่อท้าย commit ด้วย `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- server handler `return` ค่าเสมอ ห้าม `res.end()` · ใน setup ใช้ `useFetch` ไม่ใช่ `$fetch`
- ทุกก้อนจบด้วย commit ที่รันได้ + tag + บรรทัด CHANGELOG

## ความปลอดภัย

- ค่าจริงอยู่ใน `.env` (gitignored) เท่านั้น · `.env.example` ห้ามมีค่า (มีเทสตรวจ `test/env-example.test.ts`)
- **ห้ามวาง key/URL ที่มีรหัสผ่านในแชต** · ใส่ env บน Vercel ด้วย `vercel env add` จากไฟล์
- **ห้าม `git add -A` / `git add .`** — add ทีละไฟล์แล้วดู `git status` (repo-hygiene)
- ห้ามมี `service_role` / secret key ของ Supabase ที่ไหนทั้งสิ้น
- ห้าม log ค่า Key, ciphertext ที่ถอดแล้ว, หรือ connection string · error ที่ผู้ใช้เห็นต้อง redact token
- repo `bhaiG-de/jev-design-test`: อ่านอย่างเดียว **ห้าม `npm install`**
