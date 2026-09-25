<script setup lang="ts">
import { marked } from 'marked'
import runbook from '~~/docs/RUNBOOK.md?raw'

// เนื้อหามาจากไฟล์ใน repo ของเราเอง ตอน build (prerender) — ไม่ใช่ข้อความจากผู้ใช้ จึง v-html ได้
const html = marked.parse(runbook, { async: false })

useHead({ title: 'Docs · api-vault' })
</script>

<template>
  <UContainer class="py-8 max-w-3xl flex flex-col gap-6">
    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="font-medium">ใช้กับ LLM (Claude, ChatGPT ฯลฯ)</p>
          <p class="text-sm text-muted">ดาวน์โหลดเอกสารทั้งหมดเป็นไฟล์ข้อความ แล้วแนบให้ LLM ช่วยตอบเรื่องการใช้ api-vault</p>
        </div>
        <div class="flex gap-2">
          <UButton to="/llms-full.txt" download="api-vault-llms-full.txt" external icon="i-lucide-download">llms-full.txt</UButton>
          <UButton to="/llms.txt" external target="_blank" color="neutral" variant="outline">llms.txt</UButton>
        </div>
      </div>
    </UCard>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <article class="doc" v-html="html" />
  </UContainer>
</template>

<style scoped>
/* ไม่มี typography plugin — จัดเฉพาะ element ที่ runbook ใช้ ด้วย token ของ Nuxt UI (ใช้ได้ทั้งโหมดสว่าง/มืด) */
.doc :deep(h1) { font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; }
.doc :deep(h2) { font-size: 1.25rem; font-weight: 600; margin: 2rem 0 0.75rem; padding-top: 1rem; border-top: 1px solid var(--ui-border); }
.doc :deep(h3) { font-weight: 600; margin: 1.25rem 0 0.5rem; }
.doc :deep(p), .doc :deep(ul), .doc :deep(ol), .doc :deep(table), .doc :deep(pre), .doc :deep(blockquote) { margin: 0.75rem 0; }
.doc :deep(ul) { list-style: disc; padding-left: 1.25rem; }
.doc :deep(ol) { list-style: decimal; padding-left: 1.25rem; }
.doc :deep(li) { margin: 0.25rem 0; }
.doc :deep(a) { color: var(--ui-primary); text-decoration: underline; }
.doc :deep(code) { font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.875em; background: var(--ui-bg-elevated); padding: 0.1rem 0.3rem; border-radius: 0.25rem; }
.doc :deep(pre) { background: var(--ui-bg-elevated); padding: 0.75rem 1rem; border-radius: 0.5rem; overflow-x: auto; }
.doc :deep(pre code) { background: none; padding: 0; }
.doc :deep(blockquote) { border-left: 3px solid var(--ui-border-accented); padding-left: 0.75rem; color: var(--ui-text-muted); }
.doc :deep(table) { display: block; overflow-x: auto; border-collapse: collapse; font-size: 0.875rem; }
.doc :deep(th), .doc :deep(td) { border: 1px solid var(--ui-border); padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
.doc :deep(th) { background: var(--ui-bg-elevated); font-weight: 600; }
.doc :deep(hr) { display: none; } /* หัวข้อ h2 มีเส้นคั่นของตัวเองแล้ว */
</style>
