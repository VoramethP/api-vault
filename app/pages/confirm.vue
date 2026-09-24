<script setup lang="ts">
// ปลายทางของลิงก์จากอีเมล (เช่นรีเซ็ตรหัสผ่าน) — โมดูลแลก code เป็น session ให้ แล้ว middleware พาไปต่อ
const user = useSupabaseUser()
watch(user, (u) => {
  if (u) navigateTo('/')
}, { immediate: true })
</script>

<template>
  <UContainer class="py-16 max-w-sm">
    <p class="text-muted">กำลังยืนยัน…</p>
  </UContainer>
</template>
