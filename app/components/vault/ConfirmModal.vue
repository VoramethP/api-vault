<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
defineProps<{ title: string, description: string, confirmLabel: string, loading?: boolean }>()
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="open = false">ยกเลิก</UButton>
        <UButton color="error" :loading="loading" @click="emit('confirm')">{{ confirmLabel }}</UButton>
      </div>
    </template>
  </UModal>
</template>
