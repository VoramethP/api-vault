<script setup lang="ts">
const items = [
  { label: 'Key', to: '/vault', icon: 'i-lucide-key-round', exact: true },
  { label: 'โปรเจกต์', to: '/vault/projects', icon: 'i-lucide-folder' },
  { label: 'CLI', to: '/vault/cli', icon: 'i-lucide-terminal' },
  { label: 'Audit', to: '/vault/audit', icon: 'i-lucide-scroll-text' },
]
</script>

<template>
  <UNavigationMenu :items="items" class="border-b border-default mb-6" />
</template>
