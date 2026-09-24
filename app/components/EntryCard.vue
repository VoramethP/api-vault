<script setup lang="ts">
import type { SearchHit } from '~~/shared/entry'

const props = defineProps<{ hit: SearchHit }>()
const e = computed(() => props.hit.entry)

const AUTH_LABEL: Record<SearchHit['entry']['auth'], string> = {
  none: 'ไม่ต้องใช้ key',
  api_key: 'API key',
  oauth: 'OAuth',
  x_mashape_key: 'X-Mashape-Key',
  user_agent: 'User-Agent',
}
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <ULink :to="e.url" target="_blank" rel="noopener" class="font-medium text-highlighted hover:underline">
          {{ e.name }}
        </ULink>
        <p class="text-sm text-muted mt-1">{{ e.description }}</p>
      </div>
      <UProgress
        v-if="hit.score !== null"
        :model-value="Math.round(hit.score * 100)"
        size="xs"
        class="w-20 shrink-0 mt-2"
        :aria-label="`ตรง ${Math.round(hit.score * 100)} %`"
      />
    </div>
    <div class="flex flex-wrap gap-1.5 mt-3">
      <UBadge v-for="c in e.categories" :key="c" :label="c" variant="outline" color="neutral" size="sm" />
      <UBadge :label="AUTH_LABEL[e.auth]" variant="outline" :color="e.auth === 'none' ? 'success' : 'neutral'" size="sm" />
      <UBadge v-if="!e.https" label="ไม่มี HTTPS" variant="outline" color="warning" size="sm" />
      <UBadge v-if="e.cors === 'yes'" label="CORS" variant="outline" color="neutral" size="sm" />
    </div>
  </UCard>
</template>
