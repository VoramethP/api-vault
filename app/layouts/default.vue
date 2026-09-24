<script setup lang="ts">
const version = useRuntimeConfig().public.appVersion
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-default">
      <UContainer class="flex items-center justify-between h-14">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="font-semibold">api-vault</NuxtLink>
          <template v-if="user">
            <UButton to="/" variant="ghost" color="neutral" size="sm" icon="i-lucide-search">ค้นหา</UButton>
            <UButton to="/vault" variant="ghost" color="neutral" size="sm" icon="i-lucide-vault">Vault</UButton>
          </template>
        </div>
        <div class="flex items-center gap-2">
          <UButton to="/about" variant="ghost" color="neutral" size="sm">v{{ version }}</UButton>
          <UColorModeButton />
          <UButton v-if="user" variant="ghost" color="neutral" size="sm" icon="i-lucide-log-out" aria-label="ออกจากระบบ" @click="signOut" />
        </div>
      </UContainer>
    </header>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
