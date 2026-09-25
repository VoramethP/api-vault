<script setup lang="ts">
import { AUTH, CORS, categoryCounts, visibleHits, type CatalogueFilters, type SearchResponse } from '~~/shared/entry'

const route = useRoute()
const router = useRouter()

// สถานะการค้นอยู่ใน URL — แชร์ลิงก์/กด back ได้ และไม่มี state ระดับ module
const q = ref(String(route.query.q ?? ''))
const query = computed(() => String(route.query.q ?? '').trim())
const filters = computed(() => ({
  category: route.query.category as string | undefined,
  auth: route.query.auth as string | undefined,
  https: route.query.https as string | undefined,
  cors: route.query.cors as string | undefined,
}))
function setQuery(patch: Record<string, string | undefined>) {
  const next = { ...route.query, ...patch }
  for (const k of Object.keys(next)) if (!next[k]) delete next[k]
  router.replace({ query: next })
}

// Catalogue โหลดครั้งเดียว — ตัวกรองซ้ายกรองในเบราว์เซอร์ ไม่ยิง server
const { data: catalogue, status: catalogueStatus, error: catalogueError } = useCatalogue()
// ยิง server เฉพาะตอนมีคำค้น (Ranker อยู่ฝั่ง server — ADR-0003) · key ตามคำค้น = กลับไปคำเดิมไม่ต้องยิงซ้ำ
const { data: search, status: searchStatus, error: searchError } = useAsyncData(
  () => `search:${query.value}`,
  () => query.value ? $fetch<SearchResponse>('/api/search', { query: { q: query.value } }) : Promise.resolve(null),
  { server: false, lazy: true, getCachedData: (key, nuxtApp, ctx) => ctx.cause === 'refresh:manual' ? undefined : nuxtApp.payload.data[key] },
)

const activeFilters = computed<CatalogueFilters>(() => ({
  category: filters.value.category,
  auth: filters.value.auth as CatalogueFilters['auth'],
  https: filters.value.https === undefined ? undefined : filters.value.https === 'true',
  cors: filters.value.cors as CatalogueFilters['cors'],
}))
const hits = computed(() => visibleHits(catalogue.value, query.value ? (search.value ?? null) : null, activeFilters.value))

// แสดงทีละ 30 — การ์ด 1,871 ใบพร้อมกันทำให้หน้าหน่วง
const PAGE = 30
const shown = ref(PAGE)
watch([query, filters], () => { shown.value = PAGE })

const error = computed(() => catalogueError.value ?? searchError.value)
const loading = computed(() => (catalogueStatus.value !== 'success' && !catalogue.value.length) || (!!query.value && searchStatus.value !== 'success' && !search.value))

const ANY = '__any'
const categoryItems = computed(() => [
  { label: 'ทุกหมวด', value: ANY },
  ...categoryCounts(catalogue.value).map(c => ({ label: `${c.name} (${c.count})`, value: c.name })),
])
const authItems = [
  { label: 'ทุกแบบ', value: ANY },
  ...AUTH.map(a => ({ label: { none: 'ไม่ต้องใช้ key', api_key: 'API key', oauth: 'OAuth', x_mashape_key: 'X-Mashape-Key', user_agent: 'User-Agent' }[a], value: a })),
]
const httpsItems = [{ label: 'ทั้งหมด', value: ANY }, { label: 'มี', value: 'true' }, { label: 'ไม่มี', value: 'false' }]
const corsItems = [{ label: 'ทั้งหมด', value: ANY }, ...CORS.map(c => ({ label: { yes: 'ได้', no: 'ไม่ได้', unknown: 'ไม่ทราบ' }[c], value: c }))]

const bind = (key: keyof typeof filters.value) => computed({
  get: () => filters.value[key] ?? ANY,
  set: (v: string) => setQuery({ [key]: v === ANY ? undefined : v }),
})
const category = bind('category')
const auth = bind('auth')
const https = bind('https')
const cors = bind('cors')
</script>

<template>
  <UContainer class="py-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
    <aside class="flex flex-col gap-6">
      <UFormField label="หมวด">
        <USelect v-model="category" :items="categoryItems" class="w-full" />
      </UFormField>
      <UFormField label="การยืนยันตัวตน">
        <USelect v-model="auth" :items="authItems" class="w-full" />
      </UFormField>
      <UFormField label="HTTPS">
        <URadioGroup v-model="https" :items="httpsItems" orientation="horizontal" />
      </UFormField>
      <UFormField label="CORS">
        <URadioGroup v-model="cors" :items="corsItems" />
      </UFormField>
    </aside>

    <section class="flex flex-col gap-4 min-w-0">
      <form class="flex gap-2" @submit.prevent="setQuery({ q: q.trim() || undefined })">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          size="lg"
          class="flex-1 min-w-0"
          placeholder="ค้นได้ทั้งไทยและอังกฤษ เช่น อัตราแลกเปลี่ยนแบบไม่ต้องใช้ key, พยากรณ์อากาศ, cat pictures"
          aria-label="ค้นหา API"
        />
        <UButton to="/entries/new" icon="i-lucide-plus" size="lg" color="neutral" variant="outline" aria-label="เพิ่ม Entry">
          <span class="hidden sm:inline">เพิ่ม Entry</span>
        </UButton>
      </form>

      <UAlert v-if="error" color="error" variant="subtle" title="โหลดไม่สำเร็จ" :description="error.statusMessage || error.message" />

      <template v-else-if="loading">
        <USkeleton v-for="i in 5" :key="i" class="h-24 w-full" />
      </template>

      <template v-else>
        <UAlert
          v-if="query && search?.kind === 'no_match'"
          color="neutral"
          variant="subtle"
          icon="i-lucide-search-x"
          title="ไม่เจอ API ที่ตรง"
          :description="`ค้นใน ${search.candidates.toLocaleString()} รายการแล้วไม่มีคำไหนตรงเลย · ลองใช้คำอื่น หรือพิมพ์เป็นคำอังกฤษ (คำไทยค้นได้เฉพาะคำที่อยู่ในพจนานุกรม)`"
        />
        <p v-else class="text-sm text-muted">
          <template v-if="!query">ทั้งหมด {{ hits.length.toLocaleString() }} รายการ</template>
          <template v-else-if="search">
            {{ hits.length.toLocaleString() }} ผลจาก {{ search.candidates.toLocaleString() }} รายการ
            · ความมั่นใจ {{ Math.round(search.confidence * 100) }} % · Ranker: {{ search.ranker }}
          </template>
        </p>
        <EntryCard v-for="hit in hits.slice(0, shown)" :key="hit.entry.id" :hit="hit" @deleted="refreshCatalogue()" />
        <UButton v-if="hits.length > shown" color="neutral" variant="outline" block @click="shown += PAGE">
          แสดงเพิ่ม ({{ (hits.length - shown).toLocaleString() }} รายการ)
        </UButton>
        <p v-else-if="query && search?.kind === 'match' && !hits.length" class="text-sm text-muted">ไม่มีผลที่ตรงกับตัวกรอง — ลองเอาตัวกรองออก</p>
      </template>
    </section>
  </UContainer>
</template>
