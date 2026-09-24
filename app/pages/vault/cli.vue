<script setup lang="ts">
import type { CliTokenItem } from '~~/shared/cli'

const toast = useToast()
const { data: tokens, refresh } = await useFetch<CliTokenItem[]>('/api/cli-tokens', { default: () => [] })
const origin = useRequestURL().origin

const name = ref('')
const creating = ref(false)
// token ตัวจริงอยู่แค่ในหน้านี้จนกว่าจะกดปิด — reload แล้วหายถาวร (DB มีแค่ hash)
const created = ref('')
const copied = ref(false)

async function create() {
  creating.value = true
  try {
    const res = await $fetch<{ token: string }>('/api/cli-tokens', { method: 'POST', body: { name: name.value } })
    created.value = res.token
    copied.value = false
    name.value = ''
    await refresh()
  }
  catch (e) {
    toast.add({ title: 'สร้าง token ไม่สำเร็จ', description: errorMessage(e), color: 'error' })
  }
  finally {
    creating.value = false
  }
}
async function copy() {
  await navigator.clipboard.writeText(created.value)
  copied.value = true
}

const revoking = ref<CliTokenItem | null>(null)
const revokeOpen = ref(false)
async function revoke() {
  if (!revoking.value) return
  try {
    await $fetch(`/api/cli-tokens/${revoking.value.id}`, { method: 'DELETE' })
    revokeOpen.value = false
    await refresh()
  }
  catch (e) {
    toast.add({ title: 'เพิกถอนไม่สำเร็จ', description: errorMessage(e), color: 'error' })
  }
}

const now = Date.now()
const state = (t: CliTokenItem) => t.revokedAt ? { label: 'เพิกถอนแล้ว', color: 'neutral' as const }
  : new Date(t.expiresAt).getTime() <= now ? { label: 'หมดอายุ', color: 'neutral' as const }
    : { label: 'ใช้ได้', color: 'success' as const }
const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <UContainer class="py-8 max-w-4xl">
    <VaultNav />

    <UCard class="mb-6">
      <template #header>
        <p class="font-medium">ติดตั้ง CLI</p>
      </template>
      <pre class="text-sm font-mono whitespace-pre-wrap text-muted"># จาก repo api-vault
npm i -g ./cli
vault login --url {{ origin }}
vault pull &lt;project&gt;</pre>
      <p class="text-sm text-muted mt-3">
        token บอกแค่ว่าเครื่องไหนขอ — ทุกครั้งที่ pull ต้องมาอนุมัติที่หน้า <code>/vault/approve</code> ด้วย TOTP
        · token อายุ 30 วัน
      </p>
    </UCard>

    <form class="flex gap-2 mb-4" @submit.prevent="create">
      <UInput v-model="name" placeholder="ชื่อเครื่อง เช่น macbook-work" class="flex-1" aria-label="ชื่อเครื่อง" />
      <UButton type="submit" icon="i-lucide-plus" :loading="creating" :disabled="!name.trim()">สร้าง token</UButton>
    </form>

    <UAlert
      v-if="created"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="คัดลอก token ตอนนี้ — จะไม่แสดงอีก"
      class="mb-6"
    >
      <template #description>
        <div class="flex flex-col gap-2 mt-2">
          <UInput :model-value="created" readonly class="w-full font-mono" aria-label="token ใหม่" />
          <div class="flex gap-2">
            <UButton size="sm" :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" @click="copy">{{ copied ? 'คัดลอกแล้ว' : 'คัดลอก' }}</UButton>
            <UButton size="sm" color="neutral" variant="ghost" @click="created = ''">ปิด</UButton>
          </div>
        </div>
      </template>
    </UAlert>

    <p v-if="!tokens.length" class="text-sm text-muted">ยังไม่มี token</p>
    <ul v-else class="divide-y divide-default">
      <li v-for="t in tokens" :key="t.id" class="py-3 flex flex-wrap items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="font-medium">{{ t.name }} <UBadge :label="state(t).label" :color="state(t).color" variant="subtle" size="sm" class="ms-1" /></p>
          <p class="text-xs text-muted">
            สร้าง {{ fmt(t.createdAt) }} · หมดอายุ {{ fmt(t.expiresAt) }}
            · {{ t.lastUsedAt ? `ใช้ล่าสุด ${fmt(t.lastUsedAt)}` : 'ยังไม่เคยใช้' }}
          </p>
        </div>
        <UButton v-if="!t.revokedAt" size="sm" color="error" variant="ghost" @click="revoking = t; revokeOpen = true">เพิกถอน</UButton>
      </li>
    </ul>

    <VaultConfirmModal
      v-model:open="revokeOpen"
      :title="`เพิกถอน ${revoking?.name ?? ''}?`"
      description="เครื่องนั้นจะยื่นคำขอ pull ไม่ได้อีก ต้อง vault login ด้วย token ใหม่"
      confirm-label="เพิกถอน"
      @confirm="revoke"
    />
  </UContainer>
</template>
