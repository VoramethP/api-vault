<script setup lang="ts">
import type { AuditAction, AuditItem } from '~~/shared/vault'

const { data: rows, error } = await useFetch<AuditItem[]>('/api/audit', { default: () => [] })

const ACTION: Record<AuditAction, { label: string, color: 'neutral' | 'warning' | 'error' | 'success' | 'info' }> = {
  create: { label: 'เพิ่ม', color: 'success' },
  update: { label: 'แก้', color: 'info' },
  delete: { label: 'ลบ', color: 'error' },
  reveal: { label: 'Reveal', color: 'warning' },
  pull: { label: 'Pull', color: 'warning' },
}
const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' })
</script>

<template>
  <UContainer class="py-8 max-w-4xl">
    <VaultNav />
    <p class="text-sm text-muted mb-4">200 รายการล่าสุด · บันทึกนี้แก้หรือลบไม่ได้</p>
    <UAlert v-if="error" color="error" variant="subtle" title="โหลด Audit ไม่สำเร็จ" :description="errorMessage(error)" />
    <p v-else-if="!rows.length" class="text-sm text-muted">ยังไม่มีบันทึก</p>
    <ul v-else class="divide-y divide-default">
      <li v-for="r in rows" :key="r.id" class="py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <UBadge :label="ACTION[r.action].label" :color="ACTION[r.action].color" variant="subtle" size="sm" class="w-16 justify-center" />
        <span class="font-medium">{{ r.keyLabel }}</span>
        <span class="text-muted">{{ fmt(r.at) }} · {{ r.via }}</span>
        <span v-if="r.userAgent" class="text-xs text-dimmed truncate basis-full sm:basis-auto sm:max-w-xs" :title="r.userAgent">{{ r.userAgent }}</span>
      </li>
    </ul>
  </UContainer>
</template>
