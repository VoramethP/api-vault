import type { KeyListItem, ProjectListItem } from '~~/shared/vault'

/*
 * stale-while-revalidate: เปิดแท็บซ้ำแสดงของเดิมทันที แล้วโหลดใหม่เงียบ ๆ ข้างหลัง
 * เก็บในหน่วยความจำของแท็บเท่านั้น (ไม่ลง localStorage) · มีแค่ชื่อ Key + 4 ตัวท้าย ไม่มีค่า Key
 * ออกจากระบบ = clearNuxtData() ล้างทิ้ง
 */
const fromCache = (key: string, nuxtApp: ReturnType<typeof useNuxtApp>, ctx: { cause: string }) =>
  ctx.cause === 'initial' ? nuxtApp.payload.data[key] : undefined

/** มีของใน cache และไม่ใช่ตอน hydrate (ตอน hydrate ข้อมูลเพิ่งมาจาก server สด ๆ) → โหลดใหม่หลัง mount */
function revalidateIfStale(key: string, refresh: () => Promise<void>) {
  const nuxtApp = useNuxtApp()
  if (import.meta.client && !nuxtApp.isHydrating && nuxtApp.payload.data[key] !== undefined) onMounted(() => refresh())
}

export function useVaultKeys() {
  revalidateIfStale('vault-keys', () => refreshNuxtData('vault-keys'))
  return useFetch<KeyListItem[]>('/api/keys', { key: 'vault-keys', default: () => [], getCachedData: fromCache })
}

export function useVaultProjects() {
  revalidateIfStale('vault-projects', () => refreshNuxtData('vault-projects'))
  return useFetch<ProjectListItem[]>('/api/projects', { key: 'vault-projects', default: () => [], getCachedData: fromCache })
}
