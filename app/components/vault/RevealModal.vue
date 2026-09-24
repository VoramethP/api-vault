<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{ keyId: number, label: string }>()

const HIDE_AFTER_S = 60
const supabase = useSupabaseClient()
const code = ref<string[]>([])
const value = ref('')
const error = ref('')
const loading = ref(false)
const copied = ref(false)
const secondsLeft = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

// ค่าจริงอยู่ในหน้าจอให้สั้นที่สุด — ปิด modal หรือครบเวลา = ล้างทิ้ง
function clear() {
  clearInterval(timer)
  value.value = ''
  code.value = []
  error.value = ''
  copied.value = false
}
watch(open, (o) => { if (!o) clear() })
onBeforeUnmount(clear)

async function verifyAndReveal() {
  error.value = ''
  loading.value = true
  try {
    // ยืนยัน TOTP ทางเดียวกับหน้า /mfa → session ใหม่มีเวลาใน amr ที่ server ตรวจว่าสดและยังไม่เคยใช้
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const factor = factors?.totp[0]
    if (!factor) throw new Error('ไม่พบ TOTP ของบัญชีนี้')
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.value.join('') })
    if (err) throw new Error('รหัสไม่ถูกต้องหรือหมดเวลา ลองรหัสใหม่')
    const res = await $fetch<{ value: string }>(`/api/keys/${props.keyId}/reveal`, { method: 'POST' })
    value.value = res.value
    secondsLeft.value = HIDE_AFTER_S
    timer = setInterval(() => {
      if (--secondsLeft.value <= 0) open.value = false
    }, 1000)
  }
  catch (e) {
    error.value = e instanceof Error && !('data' in e) ? e.message : errorMessage(e)
    code.value = []
  }
  finally {
    loading.value = false
  }
}

async function copy() {
  await navigator.clipboard.writeText(value.value)
  copied.value = true
}
</script>

<template>
  <UModal v-model:open="open" :title="`Reveal: ${label}`" :description="value ? `ซ่อนเองใน ${secondsLeft} วินาที` : 'ใส่รหัส TOTP ใหม่ทุกครั้งที่ Reveal · ทุกครั้งถูกบันทึก'">
    <template #body>
      <div v-if="!value" class="flex flex-col items-center gap-4">
        <UPinInput v-model="code" :length="6" otp autofocus size="xl" :disabled="loading" @complete="verifyAndReveal" />
        <UAlert v-if="error" color="error" variant="subtle" :title="error" class="w-full" />
      </div>
      <div v-else class="flex flex-col gap-3">
        <UInput :model-value="value" readonly class="w-full font-mono" aria-label="ค่า Key" />
        <UButton :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" color="neutral" variant="outline" block @click="copy">
          {{ copied ? 'คัดลอกแล้ว' : 'คัดลอก' }}
        </UButton>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="open = false">{{ value ? 'ปิดและซ่อน' : 'ยกเลิก' }}</UButton>
        <UButton v-if="!value" :loading="loading" :disabled="code.join('').length !== 6" @click="verifyAndReveal">Reveal</UButton>
      </div>
    </template>
  </UModal>
</template>
