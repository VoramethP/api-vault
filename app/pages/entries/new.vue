<script setup lang="ts">
import type { ManualEntryInput } from '~~/shared/entry'

const toast = useToast()
// กลับไปหน้าค้นด้วยชื่อที่เพิ่งเพิ่ม — เห็นทันทีว่าค้นเจอ
async function saved(e: ManualEntryInput) {
  toast.add({ title: `เพิ่ม ${e.name} แล้ว`, color: 'success' })
  await refreshCatalogue()
  await navigateTo({ path: '/', query: { q: e.name } })
}
</script>

<template>
  <UContainer class="py-8 max-w-2xl">
    <h1 class="text-xl font-semibold mb-6">เพิ่ม Entry</h1>
    <EntryForm @saved="saved" />
  </UContainer>
</template>
