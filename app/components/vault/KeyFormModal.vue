<script setup lang="ts">
import type { KeyListItem } from '~~/shared/vault'

const open = defineModel<boolean>('open', { required: true })
/** ไม่มี = เพิ่ม Key ใหม่ · มี = แก้ชื่อ/หมุนค่า */
/** guide = มาจากปุ่ม "ขอ Key" — แสดงขั้นตอนไปสมัครที่เว็บเจ้าของ API (api-vault ออก Key เองไม่ได้) */
const props = defineProps<{ editing?: KeyListItem | null, presetEntry?: { id: number, name: string } | null, guide?: { url: string } | null }>()
const emit = defineEmits<{ saved: [] }>()

type EntryItem = { label: string, id: number, description?: string }
const entry = ref<EntryItem | undefined>()
const label = ref('')
const value = ref('')
const show = ref(false)
const error = ref('')
const saving = ref(false)

const searchTerm = ref('')
const entryItems = ref<EntryItem[]>([])
// เลือก Entry ตามชื่อจาก Catalogue ที่โหลดไว้แล้ว — พิมพ์แล้วขึ้นทันที ไม่ต้องยิง server ทีละตัวอักษร
const { data: catalogue, status: catalogueStatus } = useCatalogue()
const searching = computed(() => catalogueStatus.value === 'pending' && !catalogue.value.length)
watch([searchTerm, catalogue], ([q]) => {
  const term = q.trim().toLowerCase()
  if (!term) return
  const found = catalogue.value.filter(e => e.name.toLowerCase().includes(term))
  // ชื่อที่ขึ้นต้นด้วยคำที่พิมพ์มาก่อน
  found.sort((a, b) => Number(!a.name.toLowerCase().startsWith(term)) - Number(!b.name.toLowerCase().startsWith(term)))
  entryItems.value = found.slice(0, 20).map(e => ({ label: e.name, id: e.id, description: e.description }))
})

// เปิดใหม่ทุกครั้งเริ่มจากฟอร์มสะอาด — ค่า Key ที่พิมพ์ค้างไว้ไม่ควรโผล่กลับมา
watch(open, (o) => {
  if (!o) return
  error.value = ''
  value.value = ''
  show.value = false
  label.value = props.editing?.label ?? props.presetEntry?.name ?? ''
  const preset = props.presetEntry ? { label: props.presetEntry.name, id: props.presetEntry.id } : undefined
  entry.value = preset
  entryItems.value = preset ? [preset] : []
  searchTerm.value = ''
}, { immediate: true })

async function save() {
  error.value = ''
  saving.value = true
  try {
    if (props.editing) {
      await $fetch(`/api/keys/${props.editing.id}`, {
        method: 'PATCH',
        body: { label: label.value, ...(value.value ? { value: value.value } : {}) },
      })
    }
    else {
      if (!entry.value) throw new Error('เลือก Entry')
      await $fetch('/api/keys', { method: 'POST', body: { entryId: entry.value.id, label: label.value, value: value.value } })
    }
    value.value = ''
    open.value = false
    emit('saved')
  }
  catch (e) {
    error.value = e instanceof Error && !('data' in e) ? e.message : errorMessage(e)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="editing ? `แก้ Key: ${editing.label}` : 'เพิ่ม Key'"
    :description="editing ? 'เว้นช่องค่าว่างไว้ถ้าแค่เปลี่ยนชื่อ · ใส่ค่าใหม่ = หมุน Key' : 'ค่าถูกเข้ารหัสที่ server ก่อนลงฐานข้อมูล'"
  >
    <template #body>
      <div v-if="guide && !editing" class="mb-5 rounded-md border border-default p-4 text-sm">
        <p class="font-medium mb-2">Key ออกโดยเจ้าของ API — สมัครในแท็บที่เพิ่งเปิด แล้วกลับมาวางที่นี่</p>
        <ol class="list-decimal ps-5 space-y-1 text-muted">
          <li>สมัคร / เข้าสู่ระบบที่เว็บ {{ presetEntry?.name }}</li>
          <li>หาหน้า API keys (มักอยู่ใน Dashboard, Account หรือ Developer) แล้วสร้าง Key</li>
          <li>คัดลอก Key มาวางในช่อง "ค่า Key" ข้างล่าง — ไม่ต้องพักไว้ในโน้ตหรือแชต</li>
        </ol>
        <UButton :to="guide.url" target="_blank" rel="noopener" size="xs" variant="link" trailing-icon="i-lucide-external-link" class="mt-2 px-0">
          แท็บไม่เปิด? เปิดเว็บ {{ presetEntry?.name }}
        </UButton>
      </div>
      <form id="key-form" class="flex flex-col gap-4" @submit.prevent="save">
        <UFormField v-if="!editing" label="Entry" required>
          <USelectMenu
            v-model="entry"
            v-model:search-term="searchTerm"
            :items="entryItems"
            :loading="searching"
            ignore-filter
            placeholder="ค้นชื่อ API"
            class="w-full"
          />
        </UFormField>
        <p v-else class="text-sm text-muted">Entry: {{ editing.entry.name }}</p>
        <UFormField label="ชื่อ" required>
          <UInput v-model="label" class="w-full" placeholder="เช่น OpenWeather (ส่วนตัว)" />
        </UFormField>
        <UFormField :label="editing ? 'ค่าใหม่ (ไม่บังคับ)' : 'ค่า Key'" :required="!editing">
          <UInput
            v-model="value"
            :type="show ? 'text' : 'password'"
            autocomplete="off"
            class="w-full font-mono"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="show ? 'ซ่อนค่า' : 'แสดงค่า'"
                @click="show = !show"
              />
            </template>
          </UInput>
        </UFormField>
        <UAlert v-if="error" color="error" variant="subtle" :title="error" />
      </form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="open = false">ยกเลิก</UButton>
        <UButton type="submit" form="key-form" :loading="saving" :disabled="!label.trim() || (!editing && (!entry || !value.trim()))">
          {{ editing ? 'บันทึก' : 'เพิ่ม Key' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
