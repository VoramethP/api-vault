export interface Release {
  version: string
  date: string | null
  groups: { title: string, items: string[] }[]
}

// markdown inline ที่ใช้ใน CHANGELOG: `code` **bold** [text](url) — หน้า /about แสดงเป็นข้อความล้วน
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*]/g, '').trim()

/** อ่าน CHANGELOG แบบ Keep a Changelog: `## [0.1.0] - 2026-09-30` → `### Added` → `- ...` */
export function parseChangelog(md: string): Release[] {
  const releases: Release[] = []
  for (const line of md.replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const rel = line.match(/^## \[([^\]]+)\](?:\s*-\s*(\S+))?/)
    if (rel) {
      releases.push({ version: rel[1]!, date: rel[2] ?? null, groups: [] })
      continue
    }
    const current = releases.at(-1)
    if (!current) continue
    const group = line.match(/^### (.+)/)
    if (group) {
      current.groups.push({ title: plain(group[1]!), items: [] })
      continue
    }
    const item = line.match(/^- (.+)/)
    if (item) {
      if (!current.groups.length) current.groups.push({ title: '', items: [] })
      current.groups.at(-1)!.items.push(plain(item[1]!))
    }
  }
  return releases
}
