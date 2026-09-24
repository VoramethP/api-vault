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
        <NuxtLink to="/" class="font-semibold">api-vault</NuxtLink>
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
