<script setup lang="ts">
import type { ProjectListItem } from '~~/shared/vault'

const toast = useToast()
const { data: projects, refresh } = await useVaultProjects()
const { data: keys } = await useVaultKeys()

const newName = ref('')
const creating = ref(false)
async function create() {
  creating.value = true
  try {
    await $fetch('/api/projects', { method: 'POST', body: { name: newName.value } })
    newName.value = ''
    await refresh()
  }
  catch (e) {
    toast.add({ title: 'สร้างโปรเจกต์ไม่สำเร็จ', description: errorMessage(e), color: 'error' })
  }
  finally {
    creating.value = false
  }
}

// ฟอร์มผูก Key แยกตามโปรเจกต์
const drafts = reactive<Record<number, { keyId?: number, envVar: string }>>({})
const draft = (id: number) => (drafts[id] ??= { envVar: '' })
function keyItems(p: ProjectListItem) {
  const used = new Set(p.keys.map(k => k.keyId))
  return keys.value.filter(k => !used.has(k.id)).map(k => ({ label: `${k.label} (${k.entry.name})`, value: k.id }))
}
// เดาชื่อตัวแปรจากชื่อ Entry ให้ก่อน — แก้ได้
watch(() => Object.values(drafts).map(d => d.keyId), () => {
  for (const d of Object.values(drafts)) {
    const k = keys.value.find(x => x.id === d.keyId)
    if (k && !d.envVar) d.envVar = `${k.entry.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}_API_KEY`.replace(/^(\d)/, '_$1')
  }
})

async function link(p: ProjectListItem) {
  const d = draft(p.id)
  try {
    await $fetch(`/api/projects/${p.id}/keys`, { method: 'PUT', body: { keyId: d.keyId, envVar: d.envVar } })
    drafts[p.id] = { envVar: '' }
    await refresh()
  }
  catch (e) {
    toast.add({ title: 'ผูก Key ไม่สำเร็จ', description: errorMessage(e), color: 'error' })
  }
}
async function unlink(p: ProjectListItem, keyId: number) {
  try {
    await $fetch(`/api/projects/${p.id}/keys/${keyId}`, { method: 'DELETE' })
    await refresh()
  }
  catch (e) {
    toast.add({ title: 'ถอด Key ไม่สำเร็จ', description: errorMessage(e), color: 'error' })
  }
}

const deleting = ref<ProjectListItem | null>(null)
const deleteOpen = ref(false)
async function confirmDelete() {
  if (!deleting.value) return
  try {
    await $fetch(`/api/projects/${deleting.value.id}`, { method: 'DELETE' })
    deleteOpen.value = false
    await refresh()
  }
  catch (e) {
    toast.add({ title: 'ลบโปรเจกต์ไม่สำเร็จ', description: errorMessage(e), color: 'error' })
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-4xl">
    <VaultNav />
    <form class="flex gap-2 mb-6" @submit.prevent="create">
      <UInput v-model="newName" placeholder="ชื่อโปรเจกต์ เช่น weather-bot" class="flex-1" aria-label="ชื่อโปรเจกต์ใหม่" />
      <UButton type="submit" icon="i-lucide-plus" :loading="creating" :disabled="!newName.trim()">สร้างโปรเจกต์</UButton>
    </form>

    <UCard v-if="!projects.length" class="text-center">
      <UIcon name="i-lucide-folder" class="size-8 text-muted" />
      <p class="mt-2 font-medium">ยังไม่มีโปรเจกต์</p>
      <p class="text-sm text-muted">โปรเจกต์คือชุด Key + ชื่อตัวแปรที่ <code>vault pull</code> (v0.4.0) จะเขียนลง .env</p>
    </UCard>

    <div class="flex flex-col gap-4">
      <UCard v-for="p in projects" :key="p.id">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="font-medium text-highlighted font-mono">{{ p.name }}</p>
              <p class="text-xs text-muted font-mono">vault pull {{ p.name }}</p>
            </div>
            <UButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" :aria-label="`ลบโปรเจกต์ ${p.name}`" @click="deleting = p; deleteOpen = true" />
          </div>
        </template>
        <ul v-if="p.keys.length" class="flex flex-col gap-2 mb-4">
          <li v-for="k in p.keys" :key="k.keyId" class="flex items-center justify-between gap-2 text-sm">
            <span><span class="font-mono">{{ k.envVar }}</span> <span class="text-muted">← {{ k.label }}</span></span>
            <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" :aria-label="`ถอด ${k.envVar}`" @click="unlink(p, k.keyId)" />
          </li>
        </ul>
        <p v-else class="text-sm text-muted mb-4">ยังไม่มี Key ในโปรเจกต์นี้</p>
        <form v-if="keyItems(p).length" class="flex flex-wrap gap-2" @submit.prevent="link(p)">
          <USelect v-model="draft(p.id).keyId" :items="keyItems(p)" placeholder="เลือก Key" class="w-56" />
          <UInput v-model="draft(p.id).envVar" placeholder="ENV_VAR" class="flex-1 min-w-40 font-mono" aria-label="ชื่อตัวแปร" />
          <UButton type="submit" variant="outline" :disabled="!draft(p.id).keyId || !draft(p.id).envVar">ผูก</UButton>
        </form>
      </UCard>
    </div>

    <VaultConfirmModal
      v-model:open="deleteOpen"
      :title="`ลบโปรเจกต์ ${deleting?.name ?? ''}?`"
      description="ถอดแค่การผูก — Key ทั้งหมดยังอยู่ใน Vault"
      confirm-label="ลบโปรเจกต์"
      @confirm="confirmDelete"
    />
  </UContainer>
</template>
