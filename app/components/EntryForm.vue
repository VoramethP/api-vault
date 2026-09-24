<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { AUTH, CORS, manualEntryInput, type ManualEntryInput } from '~~/shared/entry'

const props = defineProps<{ entry?: ManualEntryInput & { id: number } }>()
const emit = defineEmits<{ saved: [ManualEntryInput] }>()

const state = reactive<Partial<ManualEntryInput>>(props.entry
  ? { name: props.entry.name, url: props.entry.url, description: props.entry.description, categories: [...props.entry.categories], auth: props.entry.auth, https: props.entry.https, cors: props.entry.cors }
  : { categories: [], auth: 'none', https: true, cors: 'unknown' })

// หมวดเดิมของ Catalogue ก่อน — หมวดใหม่พิมพ์เพิ่มได้ แต่หมวดสะกดต่างกันนิดเดียวจะกรองแยกกัน
const { data: categories } = await useFetch('/api/categories', { default: () => [] })
const categoryItems = ref<string[]>([])
watchEffect(() => {
  categoryItems.value = [...new Set([...categories.value.map(c => c.name), ...(state.categories ?? [])])]
})
function addCategory(c: string) {
  const name = c.trim()
  if (!name) return
  categoryItems.value.push(name)
  state.categories = [...(state.categories ?? []), name]
}

const authItems = AUTH.map(a => ({ label: { none: 'ไม่ต้องใช้ key', api_key: 'API key', oauth: 'OAuth', x_mashape_key: 'X-Mashape-Key', user_agent: 'User-Agent' }[a], value: a }))
const corsItems = CORS.map(c => ({ label: { yes: 'ได้', no: 'ไม่ได้', unknown: 'ไม่ทราบ' }[c], value: c }))

const saving = ref(false)
const error = ref('')
async function onSubmit(e: FormSubmitEvent<ManualEntryInput>) {
  saving.value = true
  error.value = ''
  try {
    if (props.entry) await $fetch(`/api/entries/${props.entry.id}`, { method: 'PATCH', body: e.data })
    else await $fetch('/api/entries', { method: 'POST', body: e.data })
    emit('saved', e.data)
  }
  catch (err) {
    error.value = errorMessage(err)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UForm :schema="manualEntryInput" :state="state" class="flex flex-col gap-5" @submit="onSubmit">
    <UFormField label="ชื่อ" name="name" required>
      <UInput v-model="state.name" class="w-full" placeholder="เช่น Thai Open Data" />
    </UFormField>
    <UFormField label="URL" name="url" required>
      <UInput v-model="state.url" type="url" class="w-full" placeholder="https://" />
    </UFormField>
    <UFormField
      label="คำอธิบาย (ภาษาอังกฤษ)"
      name="description"
      required
      help="การค้นภาษาไทยแปลคำค้นเป็นอังกฤษก่อนจับคู่ — คำอธิบายไทยจะค้นไม่เจอ"
    >
      <UTextarea v-model="state.description" :rows="3" :maxlength="500" class="w-full" placeholder="Open government datasets of Thailand" />
    </UFormField>
    <UFormField label="หมวด" name="categories" required help="เลือกหมวดเดิม หรือพิมพ์เพื่อสร้างหมวดใหม่">
      <USelectMenu
        v-model="state.categories"
        :items="categoryItems"
        multiple
        create-item
        placeholder="เลือกอย่างน้อย 1 หมวด"
        class="w-full"
        @create="addCategory"
      />
    </UFormField>
    <UFormField label="การยืนยันตัวตน" name="auth" required>
      <USelect v-model="state.auth" :items="authItems" class="w-full" />
    </UFormField>
    <div class="flex flex-wrap gap-8">
      <UFormField label="HTTPS" name="https">
        <USwitch v-model="state.https" :label="state.https ? 'มี' : 'ไม่มี'" />
      </UFormField>
      <UFormField label="เรียกจากเบราว์เซอร์ได้ (CORS)" name="cors">
        <URadioGroup v-model="state.cors" :items="corsItems" orientation="horizontal" />
      </UFormField>
    </div>
    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="ghost" to="/">ยกเลิก</UButton>
      <UButton type="submit" :loading="saving">{{ entry ? 'บันทึก' : 'เพิ่ม Entry' }}</UButton>
    </div>
  </UForm>
</template>
