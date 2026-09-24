<script setup lang="ts">
import type { ManualEntryInput, SearchHit } from '~~/shared/entry'

const route = useRoute()
const toast = useToast()
const { data: entry, error } = await useFetch<SearchHit['entry']>(`/api/entries/${route.params.id}`)

async function saved(e: ManualEntryInput) {
  toast.add({ title: `บันทึก ${e.name} แล้ว`, color: 'success' })
  await navigateTo({ path: '/', query: { q: e.name } })
}
</script>

<template>
  <UContainer class="py-8 max-w-2xl">
    <h1 class="text-xl font-semibold mb-6">แก้ Entry</h1>
    <UAlert v-if="error" color="error" variant="subtle" :title="error.statusMessage || 'โหลด Entry ไม่สำเร็จ'" />
    <UAlert
      v-else-if="entry && entry.source !== 'manual'"
      color="neutral"
      variant="subtle"
      icon="i-lucide-lock"
      title="Entry จาก public-apis แก้ไม่ได้"
      description="การนำเข้ารอบหน้าจะเขียนทับ — แก้ได้เฉพาะ Entry ที่เพิ่มเอง"
    />
    <EntryForm v-else-if="entry" :entry="entry" @saved="saved" />
  </UContainer>
</template>
