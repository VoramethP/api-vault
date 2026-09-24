<script setup lang="ts">
import { normalizeUserCode, type PullRequestView } from '~~/shared/cli'

const route = useRoute()
const supabase = useSupabaseClient()
const codeInput = ref(String(route.query.code ?? ''))
const code = computed(() => normalizeUserCode(codeInput.value))

// ดึงรายละเอียดเฉพาะเมื่อรหัสครบรูป — ไม่ยิงทุกตัวอักษร
const { data: req, error, refresh } = await useFetch<PullRequestView>(() => `/api/pull-requests/${code.value}`, {
  immediate: !!code.value,
  watch: [code],
})

const totp = ref<string[]>([])
const busy = ref(false)
const actionError = ref('')

async function decide(approve: boolean) {
  if (!code.value) return
  actionError.value = ''
  busy.value = true
  try {
    if (approve) {
      // TOTP สดทางเดียวกับ Reveal — server ตรวจ amr และกินรหัสทิ้ง
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const factor = factors?.totp[0]
      if (!factor) throw new Error('ไม่พบ TOTP ของบัญชีนี้')
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp.value.join('') })
      if (err) throw new Error('รหัสไม่ถูกต้องหรือหมดเวลา ลองรหัสใหม่')
    }
    await $fetch(`/api/pull-requests/${code.value}/decision`, { method: 'POST', body: { approve } })
    await refresh()
  }
  catch (e) {
    actionError.value = e instanceof Error && !('data' in e) ? e.message : errorMessage(e)
    totp.value = []
  }
  finally {
    busy.value = false
  }
}

const STATUS: Record<PullRequestView['status'], { title: string, color: 'success' | 'neutral' | 'error' | 'warning' }> = {
  pending: { title: 'รออนุมัติ', color: 'warning' },
  approved: { title: 'อนุมัติแล้ว — กลับไปที่ terminal', color: 'success' },
  consumed: { title: 'CLI ดึงค่าไปแล้ว', color: 'success' },
  denied: { title: 'ปฏิเสธแล้ว', color: 'neutral' },
  expired: { title: 'หมดอายุ — รัน vault pull ใหม่', color: 'neutral' },
}
</script>

<template>
  <UContainer class="py-8 max-w-lg flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">อนุมัติ vault pull</h1>
      <p class="text-sm text-muted mt-1">อนุมัติเฉพาะคำขอที่คุณเพิ่งรันเอง และรหัสตรงกับใน terminal</p>
    </div>

    <UFormField label="รหัสจาก terminal">
      <UInput v-model="codeInput" placeholder="ABCD-2345" class="w-full font-mono" size="xl" />
    </UFormField>

    <UAlert v-if="code && error" color="error" variant="subtle" :title="errorMessage(error)" />

    <UCard v-if="code && req">
      <dl class="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
        <dt class="text-muted">สถานะ</dt>
        <dd><UBadge :label="STATUS[req.status].title" :color="STATUS[req.status].color" variant="subtle" /></dd>
        <dt class="text-muted">เครื่อง</dt>
        <dd class="font-medium">{{ req.device }}</dd>
        <dt class="text-muted">โปรเจกต์</dt>
        <dd class="font-mono">{{ req.project }}</dd>
        <dt class="text-muted">ขอเมื่อ</dt>
        <dd>{{ new Date(req.createdAt).toLocaleTimeString('th-TH') }}</dd>
        <dt class="text-muted">ตัวแปร</dt>
        <dd class="font-mono break-all">{{ req.envVars.length ? req.envVars.join(', ') : '— (โปรเจกต์ยังไม่มี Key)' }}</dd>
      </dl>

      <template v-if="req.status === 'pending'" #footer>
        <div class="flex flex-col items-center gap-4">
          <p class="text-sm text-muted">ใส่รหัส TOTP เพื่ออนุมัติ</p>
          <UPinInput v-model="totp" :length="6" otp size="xl" :disabled="busy" @complete="decide(true)" />
          <UAlert v-if="actionError" color="error" variant="subtle" :title="actionError" class="w-full" />
          <div class="flex gap-2 w-full">
            <UButton color="neutral" variant="outline" block :disabled="busy" @click="decide(false)">ปฏิเสธ</UButton>
            <UButton block :loading="busy" :disabled="totp.join('').length !== 6" @click="decide(true)">อนุมัติ</UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
