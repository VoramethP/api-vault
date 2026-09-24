<script setup lang="ts">
import type { SearchHit } from '~~/shared/entry'

const props = defineProps<{ hit: SearchHit }>()
const emit = defineEmits<{ deleted: [] }>()
const e = computed(() => props.hit.entry)

const toast = useToast()
const deleteOpen = ref(false)
const deleting = ref(false)
async function confirmDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/entries/${e.value.id}`, { method: 'DELETE' })
    deleteOpen.value = false
    toast.add({ title: `ลบ ${e.value.name} แล้ว`, color: 'success' })
    emit('deleted')
  }
  catch (err) {
    // มี Key ผูกอยู่ = 409 พร้อมบอกว่าต้องลบ Key ก่อน
    toast.add({ title: 'ลบไม่สำเร็จ', description: errorMessage(err), color: 'error' })
  }
  finally {
    deleting.value = false
  }
}

const AUTH_LABEL: Record<SearchHit['entry']['auth'], string> = {
  none: 'ไม่ต้องใช้ key',
  api_key: 'API key',
  oauth: 'OAuth',
  x_mashape_key: 'X-Mashape-Key',
  user_agent: 'User-Agent',
}
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <ULink :to="e.url" target="_blank" rel="noopener" class="font-medium text-highlighted hover:underline">
          {{ e.name }}
        </ULink>
        <p class="text-sm text-muted mt-1">{{ e.description }}</p>
      </div>
      <UProgress
        v-if="hit.score !== null"
        :model-value="Math.round(hit.score * 100)"
        size="xs"
        class="w-20 shrink-0 mt-2"
        :aria-label="`ตรง ${Math.round(hit.score * 100)} %`"
      />
    </div>
    <div class="flex flex-wrap gap-1.5 mt-3">
      <UBadge v-for="c in e.categories" :key="c" :label="c" variant="outline" color="neutral" size="sm" />
      <UBadge :label="AUTH_LABEL[e.auth]" variant="outline" :color="e.auth === 'none' ? 'success' : 'neutral'" size="sm" />
      <UBadge v-if="!e.https" label="ไม่มี HTTPS" variant="outline" color="warning" size="sm" />
      <UBadge v-if="e.cors === 'yes'" label="CORS" variant="outline" color="neutral" size="sm" />
      <UBadge v-if="e.source === 'manual'" label="เพิ่มเอง" variant="subtle" color="primary" size="sm" />
      <div class="ms-auto flex gap-1">
        <UButton
          v-if="e.auth !== 'none'"
          :to="{ path: '/vault', query: { entry: e.id, name: e.name } }"
          icon="i-lucide-key-round"
          size="xs"
          variant="ghost"
          color="neutral"
        >
          เพิ่ม Key
        </UButton>
        <template v-if="e.source === 'manual'">
          <UButton :to="`/entries/${e.id}`" icon="i-lucide-pencil" size="xs" variant="ghost" color="neutral" :aria-label="`แก้ ${e.name}`" />
          <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error" :aria-label="`ลบ ${e.name}`" @click="deleteOpen = true" />
        </template>
      </div>
    </div>
    <VaultConfirmModal
      v-if="e.source === 'manual'"
      v-model:open="deleteOpen"
      :title="`ลบ ${e.name}?`"
      description="Entry นี้จะหายจาก Catalogue ถาวร · ถ้ามี Key ผูกอยู่จะลบไม่ได้"
      confirm-label="ลบถาวร"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </UCard>
</template>
