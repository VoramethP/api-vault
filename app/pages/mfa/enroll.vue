<script setup lang="ts">
const supabase = useSupabaseClient()
const factorId = ref('')
const qr = ref('')
const secret = ref('')
const code = ref<string[]>([])
const error = ref('')
const loading = ref(false)

// QR ต้องสร้างฝั่ง client — secret ของ TOTP ไม่ควรไปอยู่ใน SSR payload
onMounted(async () => {
  // factor ที่ลงทะเบียนค้างไว้ (ยังไม่ verify) จะทำให้ enroll ใหม่ชนชื่อ — ล้างก่อน
  const { data: existing } = await supabase.auth.mfa.listFactors()
  for (const f of existing?.all ?? []) {
    if (f.factor_type === 'totp' && f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
  }
  const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'api-vault' })
  if (err || !data) {
    error.value = `ลงทะเบียน TOTP ไม่สำเร็จ: ${err?.message ?? 'ไม่ทราบสาเหตุ'}`
    return
  }
  factorId.value = data.id
  qr.value = data.totp.qr_code
  secret.value = data.totp.secret
})

async function verify() {
  error.value = ''
  loading.value = true
  const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factorId.value, code: code.value.join('') })
  loading.value = false
  if (err) {
    error.value = 'รหัสไม่ถูกต้อง — ดูว่าเวลาในเครื่องตรงไหม แล้วลองรหัสใหม่'
    code.value = []
    return
  }
  await navigateTo('/')
}
</script>

<template>
  <UContainer class="py-16 max-w-sm flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">ตั้งค่า TOTP</h1>
      <p class="text-sm text-muted mt-1">ต้องทำครั้งเดียวก่อนใช้งาน · สแกนด้วยแอป Authenticator (Google Authenticator, 1Password ฯลฯ)</p>
    </div>
    <USkeleton v-if="!qr && !error" class="size-48 mx-auto" />
    <template v-if="qr">
      <img :src="qr" alt="QR code สำหรับลงทะเบียน TOTP" class="size-48 mx-auto rounded-md bg-white p-2">
      <UFormField label="สแกนไม่ได้? พิมพ์รหัสนี้แทน">
        <UInput :model-value="secret" readonly class="w-full font-mono" />
      </UFormField>
      <UFormField label="รหัส 6 หลักจากแอป">
        <UPinInput v-model="code" :length="6" otp size="xl" @complete="verify" />
      </UFormField>
      <UButton :loading="loading" :disabled="code.join('').length !== 6" block @click="verify">ยืนยันและเปิดใช้</UButton>
    </template>
    <UAlert v-if="error" color="error" variant="subtle" :title="error" />
  </UContainer>
</template>
