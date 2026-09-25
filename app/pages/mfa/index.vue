<script setup lang="ts">
const supabase = useSupabaseClient()
const code = ref<string[]>([])
const error = ref('')
const loading = ref(false)

async function verify() {
  error.value = ''
  loading.value = true
  const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors()
  const factor = factors?.totp[0]
  if (listErr || !factor) {
    loading.value = false
    error.value = 'ไม่พบ TOTP ของบัญชีนี้'
    return
  }
  const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.value.join('') })
  loading.value = false
  if (err) {
    error.value = totpErrorMessage(err)
    code.value = []
    return
  }
  await navigateTo('/')
}

async function signOut() {
  await supabase.auth.signOut()
  clearNuxtData()
  await navigateTo('/login')
}
</script>

<template>
  <UContainer class="py-16 max-w-sm flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">ยืนยันตัวตน</h1>
      <p class="text-sm text-muted mt-1">ใส่รหัส 6 หลักจากแอป Authenticator</p>
    </div>
    <UPinInput v-model="code" :length="6" otp autofocus size="xl" @complete="verify" />
    <UAlert v-if="error" color="error" variant="subtle" :title="error" />
    <UButton :loading="loading" :disabled="code.join('').length !== 6" block @click="verify">ยืนยัน</UButton>
    <UButton variant="link" color="neutral" @click="signOut">ออกจากระบบ</UButton>
  </UContainer>
</template>
