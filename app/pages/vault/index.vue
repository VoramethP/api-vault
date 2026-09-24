<script setup lang="ts">
import type { KeyListItem } from '~~/shared/vault'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { data: keys, status, error, refresh } = await useFetch<KeyListItem[]>('/api/keys', { default: () => [] })

const formOpen = ref(false)
const editing = ref<KeyListItem | null>(null)
const presetEntry = ref<{ id: number, name: string } | null>(null)
const revealing = ref<KeyListItem | null>(null)
const revealOpen = ref(false)
const deleting = ref<KeyListItem | null>(null)
const deleteOpen = ref(false)
const deleteLoading = ref(false)

// มาจากปุ่ม "เพิ่ม Key" บนการ์ด Entry: /vault?entry=<id>&name=<ชื่อ>
onMounted(() => {
  const id = Number(route.query.entry)
  if (Number.isInteger(id) && id > 0) {
    presetEntry.value = { id, name: String(route.query.name ?? '') }
    editing.value = null
    formOpen.value = true
    router.replace({ query: {} })
  }
})

function add() {
  editing.value = null
  presetEntry.value = null
  formOpen.value = true
}
function edit(k: KeyListItem) {
  editing.value = k
  formOpen.value = true
}
function askReveal(k: KeyListItem) {
  revealing.value = k
  revealOpen.value = true
}
function askDelete(k: KeyListItem) {
  deleting.value = k
  deleteOpen.value = true
}
async function confirmDelete() {
  if (!deleting.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/keys/${deleting.value.id}`, { method: 'DELETE' })
    toast.add({ title: `ลบ ${deleting.value.label} แล้ว`, color: 'success' })
    deleteOpen.value = false
    await refresh()
  }
  catch (e) {
    toast.add({ title: 'ลบไม่สำเร็จ', description: errorMessage(e), color: 'error' })
  }
  finally {
    deleteLoading.value = false
  }
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { dateStyle: 'medium' })
</script>

<template>
  <UContainer class="py-8 max-w-4xl">
    <VaultNav />
    <div class="flex items-center justify-between gap-4 mb-4">
      <p class="text-sm text-muted">Key ทั้งหมดเข้ารหัสไว้ · Reveal ต้องใส่ TOTP ใหม่ทุกครั้ง</p>
      <UButton icon="i-lucide-plus" @click="add">เพิ่ม Key</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="subtle" title="โหลด Key ไม่สำเร็จ" :description="errorMessage(error)" />
    <template v-else-if="status === 'pending' && !keys.length">
      <USkeleton v-for="i in 3" :key="i" class="h-20 w-full mb-3" />
    </template>
    <UCard v-else-if="!keys.length" class="text-center">
      <UIcon name="i-lucide-key-round" class="size-8 text-muted" />
      <p class="mt-2 font-medium">ยังไม่มี Key</p>
      <p class="text-sm text-muted">เพิ่มจากปุ่มด้านบน หรือจากการ์ด API ในหน้าค้นหา</p>
    </UCard>

    <div v-else class="flex flex-col gap-3">
      <UCard v-for="k in keys" :key="k.id">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium text-highlighted">{{ k.label }}</p>
            <p class="text-sm text-muted">
              <ULink :to="k.entry.url" target="_blank" rel="noopener" class="hover:underline">{{ k.entry.name }}</ULink>
              · <span class="font-mono">••••{{ k.last4 ?? '' }}</span>
              · เพิ่ม {{ fmt(k.createdAt) }}<template v-if="k.rotatedAt"> · หมุน {{ fmt(k.rotatedAt) }}</template>
            </p>
            <div v-if="k.projects.length" class="flex flex-wrap gap-1.5 mt-2">
              <UBadge v-for="p in k.projects" :key="p.id" variant="outline" color="neutral" size="sm">
                {{ p.name }}: <span class="font-mono">{{ p.envVar }}</span>
              </UBadge>
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <UButton icon="i-lucide-eye" size="sm" @click="askReveal(k)">Reveal</UButton>
            <UButton icon="i-lucide-pencil" size="sm" color="neutral" variant="ghost" :aria-label="`แก้ ${k.label}`" @click="edit(k)" />
            <UButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" :aria-label="`ลบ ${k.label}`" @click="askDelete(k)" />
          </div>
        </div>
      </UCard>
    </div>

    <VaultKeyFormModal v-model:open="formOpen" :editing="editing" :preset-entry="presetEntry" @saved="refresh()" />
    <VaultRevealModal v-if="revealing" v-model:open="revealOpen" :key-id="revealing.id" :label="revealing.label" />
    <VaultConfirmModal
      v-model:open="deleteOpen"
      :title="`ลบ ${deleting?.label ?? ''}?`"
      description="ค่า Key จะหายถาวร และถูกถอดออกจากทุกโปรเจกต์ · ประวัติใน Audit ยังอยู่"
      confirm-label="ลบถาวร"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </UContainer>
</template>
