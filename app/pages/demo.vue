<script setup lang="ts">
import demo from '~~/app/demo/results.json'

// หน้าสาธารณะ prerender จากผลที่คำนวณไว้แล้ว (ADR-0004) — ไม่เรียก API ใด ๆ ตอนเปิดหน้า
useSeoMeta({
  title: 'api-vault — ค้นหา API ด้วยภาษาไทย (เดโม)',
  description: `ตัวอย่างผลค้น API สาธารณะ ${demo.catalogueSize.toLocaleString()} รายการด้วยคำค้นภาษาไทย`,
})

const AUTH_LABEL: Record<string, string> = { none: 'ไม่ต้องใช้ key', api_key: 'API key', oauth: 'OAuth', x_mashape_key: 'X-Mashape-Key', user_agent: 'User-Agent' }
const FILTER_LABEL: Record<string, string> = { auth: 'ไม่ต้องใช้ key', cors: 'เรียกจากเบราว์เซอร์ได้', https: 'HTTPS' }
const pct = (n: number) => `${Math.round(n * 100)} %`
const generated = new Date(demo.generatedAt).toLocaleDateString('th-TH', { dateStyle: 'long' })
const selected = ref(0)
const current = computed(() => demo.results[selected.value]!)
</script>

<template>
  <UContainer class="py-10 max-w-4xl flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <p class="text-sm text-muted">เดโม · ผลคำนวณไว้แล้วเมื่อ {{ generated }}</p>
      <h1 class="text-2xl font-semibold text-highlighted text-balance">ค้นหา API สาธารณะด้วยภาษาไทย</h1>
      <p class="text-muted max-w-prose">
        api-vault ค้นใน Catalogue {{ demo.catalogueSize.toLocaleString() }} รายการ (จาก
        <ULink to="https://github.com/public-apis/public-apis" target="_blank" class="underline">public-apis</ULink>, MIT)
        ด้วยคำค้นภาษาไทย แล้วบอกตรง ๆ เมื่อไม่มีตัวไหนตรง ส่วน Key ของเจ้าของเก็บแบบเข้ารหัสในแอปจริง ซึ่งไม่อยู่ในหน้านี้
      </p>
    </div>

    <div class="flex flex-wrap gap-2" role="tablist" aria-label="คำค้นตัวอย่าง">
      <UButton
        v-for="(r, i) in demo.results"
        :key="r.q"
        role="tab"
        :aria-selected="selected === i"
        :variant="selected === i ? 'solid' : 'outline'"
        :color="selected === i ? 'primary' : 'neutral'"
        size="sm"
        @click="selected = i"
      >
        {{ r.q }}
      </UButton>
    </div>

    <section class="flex flex-col gap-4" role="tabpanel">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span class="text-muted">Ranker: <code>{{ demo.ranker }}</code></span>
        <span class="text-muted">ความมั่นใจ {{ pct(current.confidence) }}</span>
        <template v-if="current.understood && (current.understood.terms.length || Object.keys(current.understood.filters).length)">
          <span class="text-muted">เข้าใจว่า:</span>
          <UBadge v-for="t in current.understood.terms" :key="t" :label="t" variant="subtle" color="neutral" size="sm" />
          <UBadge v-for="(_, k) in current.understood.filters" :key="k" :label="`กรอง: ${FILTER_LABEL[k]}`" variant="subtle" color="primary" size="sm" />
        </template>
      </div>

      <UAlert
        v-if="current.kind === 'no_match'"
        color="neutral"
        variant="subtle"
        icon="i-lucide-search-x"
        title="ไม่เจอ API ที่ตรง"
        description="ไม่มีคำไหนในคำค้นที่ตรงกับ API ในคลัง — ตอบว่าไม่เจอดีกว่าเดาผลที่ไม่เกี่ยวมาให้"
      />
      <UCard v-for="h in current.hits" :key="h.url">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <ULink :to="h.url" target="_blank" rel="noopener" class="font-medium text-highlighted hover:underline">{{ h.name }}</ULink>
            <p class="text-sm text-muted mt-1">{{ h.description }}</p>
          </div>
          <div class="shrink-0 text-right text-xs text-muted w-20">
            <UProgress :model-value="Math.round(h.score * 100)" size="xs" :aria-label="`ตรง ${pct(h.score)}`" />
            <span class="tabular-nums">ตรง {{ pct(h.score) }}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-3">
          <UBadge v-for="c in h.categories" :key="c" :label="c" variant="outline" color="neutral" size="sm" />
          <UBadge :label="AUTH_LABEL[h.auth] ?? h.auth" variant="outline" :color="h.auth === 'none' ? 'success' : 'neutral'" size="sm" />
          <UBadge v-if="!h.https" label="ไม่มี HTTPS" variant="outline" color="warning" size="sm" />
          <UBadge v-if="h.cors === 'yes'" label="CORS" variant="outline" color="neutral" size="sm" />
        </div>
      </UCard>
    </section>

    <p class="text-sm text-muted border-t border-default pt-4">
      หน้านี้ไม่ยิงการค้นสด ทุกผลคำนวณไว้ล่วงหน้า และไม่มี Key หรือความลับใดอยู่ในหน้า ·
      <ULink to="https://github.com/VoramethP/api-vault" target="_blank" class="underline">โค้ดบน GitHub</ULink>
    </p>
  </UContainer>
</template>
