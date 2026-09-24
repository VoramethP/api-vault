<script setup lang="ts">
const version = useRuntimeConfig().public.appVersion
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-default">
      <UContainer class="flex items-center justify-between h-14">
        <NuxtLink to="/" class="font-semibold">api-vault</NuxtLink>
        <div class="flex items-center gap-2">
          <UButton to="/about" variant="ghost" color="neutral" size="sm">v{{ version }}</UButton>
          <UColorModeButton />
        </div>
      </UContainer>
    </header>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
