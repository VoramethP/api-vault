<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const supabase = useSupabaseClient()
const schema = z.object({
  email: z.email('อีเมลไม่ถูกรูปแบบ'),
  password: z.string().min(1, 'ใส่รหัสผ่าน'),
})
const state = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function onSubmit(e: FormSubmitEvent<z.infer<typeof schema>>) {
  error.value = ''
  loading.value = true
  const { error: err } = await supabase.auth.signInWithPassword(e.data)
  loading.value = false
  // ไม่บอกว่าผิดที่อีเมลหรือรหัส — ไม่ช่วยคนเดาบัญชี
  if (err) {
    error.value = err.status === 429 ? 'ลองบ่อยเกินไป รอสักครู่แล้วลองใหม่' : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    return
  }
  // middleware จะพาไป /mfa หรือ /mfa/enroll ต่อเอง
  await navigateTo('/')
}
</script>

<template>
  <UContainer class="py-16 max-w-sm">
    <h1 class="text-xl font-semibold mb-6">เข้าสู่ระบบ</h1>
    <UForm :schema="schema" :state="state" class="flex flex-col gap-6" @submit="onSubmit">
      <UFormField label="อีเมล" name="email">
        <UInput v-model="state.email" type="email" autocomplete="username" class="w-full" />
      </UFormField>
      <UFormField label="รหัสผ่าน" name="password">
        <UInput v-model="state.password" type="password" autocomplete="current-password" class="w-full" />
      </UFormField>
      <UAlert v-if="error" color="error" variant="subtle" :title="error" />
      <UButton type="submit" :loading="loading" block class="mt-2">เข้าสู่ระบบ</UButton>
    </UForm>
  </UContainer>
</template>
