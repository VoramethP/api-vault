<script setup lang="ts">
import changelog from '~~/CHANGELOG.md?raw'
import { parseChangelog } from '~~/shared/changelog'

const version = useRuntimeConfig().public.appVersion
// ซ่อน Unreleased ที่ยังว่าง — การ์ดเปล่าไม่บอกอะไร
const releases = parseChangelog(changelog).filter(r => r.version !== 'Unreleased' || r.groups.length)
const released = releases.filter(r => r.version !== 'Unreleased').length
</script>

<template>
  <UContainer class="py-8 max-w-3xl flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold">api-vault <span class="text-muted">v{{ version }}</span></h1>
      <p class="text-muted mt-1">คลัง API ส่วนตัว: แคตตาล็อก API สาธารณะ + ที่เก็บ API key แบบเข้ารหัส</p>
      <p class="text-sm text-muted mt-1">ปล่อยแล้ว {{ released }} เวอร์ชัน</p>
    </div>

    <UCard v-for="r in releases" :key="r.version">
      <template #header>
        <div class="flex items-baseline justify-between">
          <h2 class="font-semibold">{{ r.version === 'Unreleased' ? 'กำลังทำ' : `v${r.version}` }}</h2>
          <span v-if="r.date" class="text-sm text-muted">{{ r.date }}</span>
        </div>
      </template>
      <div class="flex flex-col gap-4">
        <div v-for="g in r.groups" :key="g.title">
          <h3 v-if="g.title" class="text-sm font-medium text-muted mb-1">{{ g.title }}</h3>
          <ul class="list-disc pl-5 text-sm flex flex-col gap-1">
            <li v-for="item in g.items" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </UCard>

    <p class="text-sm text-muted">
      แคตตาล็อกตั้งต้นจาก
      <ULink to="https://github.com/public-apis/public-apis" target="_blank" class="underline">public-apis/public-apis</ULink>
      (MIT License)
    </p>
  </UContainer>
</template>
