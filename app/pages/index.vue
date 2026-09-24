<script setup lang="ts">
import { AUTH, CORS, type SearchResponse } from '~~/shared/entry'

const route = useRoute()
const router = useRouter()

// สถานะการค้นอยู่ใน URL — แชร์ลิงก์/กด back ได้ และไม่มี state ระดับ module
const q = ref(String(route.query.q ?? ''))
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

const { data: categories } = await useFetch('/api/categories', { default: () => [] })
const { data, status, error, refresh } = await useFetch<SearchResponse>('/api/search', {
  query: computed(() => ({ q: route.query.q, ...filters.value, limit: 30 })),
})

const ANY = '__any'
const categoryItems = computed(() => [
  { label: 'ทุกหมวด', value: ANY },
  ...categories.value.map(c => ({ label: `${c.name} (${c.count})`, value: c.name })),
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

      <UAlert v-if="error" color="error" variant="subtle" title="ค้นไม่สำเร็จ" :description="error.statusMessage || error.message" />

      <template v-else-if="status === 'pending' && !data">
        <USkeleton v-for="i in 5" :key="i" class="h-24 w-full" />
      </template>

      <template v-else-if="data">
        <UAlert
          v-if="data.kind === 'no_match'"
          color="neutral"
          variant="subtle"
          icon="i-lucide-search-x"
          title="ไม่เจอ API ที่ตรง"
          :description="`ค้นใน ${data.candidates.toLocaleString()} รายการแล้วไม่มีคำไหนตรงเลย · ลองใช้คำอื่น หรือพิมพ์เป็นคำอังกฤษ (คำไทยค้นได้เฉพาะคำที่อยู่ในพจนานุกรม)`"
        />
        <p v-else class="text-sm text-muted">
          <template v-if="data.kind === 'browse'">ทั้งหมด {{ data.candidates.toLocaleString() }} รายการ · แสดง {{ data.hits.length }} รายการแรก</template>
          <template v-else>
            {{ data.hits.length }} ผลจาก {{ data.candidates.toLocaleString() }} รายการ
            · ความมั่นใจ {{ Math.round((data.confidence ?? 0) * 100) }} % · Ranker: {{ data.ranker }}
          </template>
        </p>
        <EntryCard v-for="hit in data.hits" :key="hit.entry.id" :hit="hit" @deleted="refresh()" />
      </template>
    </section>
  </UContainer>
</template>
