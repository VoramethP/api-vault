import type { CatalogueEntry } from '~~/shared/entry'

export const CATALOGUE_KEY = 'catalogue'

/**
 * Catalogue ทั้งคลัง โหลดครั้งเดียวต่อแท็บ แล้วทุกหน้าใช้ร่วมกัน (ตัวกรอง, ฟอร์ม, เลือก Entry ตอนเพิ่ม Key)
 * ข้อมูลเปลี่ยนเฉพาะตอนเราเพิ่ม/แก้/ลบ Entry เอง → เรียก refreshCatalogue() หลังบันทึก
 * ไม่ render ฝั่ง server — ไม่ให้ HTML ทุกหน้าพกข้อมูล 440 KB ไปด้วย
 */
export function useCatalogue() {
  return useFetch<CatalogueEntry[]>('/api/entries', {
    key: CATALOGUE_KEY,
    server: false,
    lazy: true,
    default: () => [],
    // หลาย component เรียกพร้อมกันได้ — ให้รอ request เดิม ไม่ใช่ยกเลิกแล้วยิงใหม่ (ค่าเริ่ม 'cancel')
    dedupe: 'defer',
    getCachedData: (key, nuxtApp, ctx) => ctx.cause === 'initial' ? nuxtApp.payload.data[key] : undefined,
  })
}

/** หลังเพิ่ม/แก้/ลบ Entry — ผลค้นที่ cache ไว้อาจไม่มี Entry ใหม่ จึงล้างทิ้งด้วย */
export async function refreshCatalogue() {
  clearNuxtData(key => key.startsWith('search:'))
  await refreshNuxtData(CATALOGUE_KEY)
}
