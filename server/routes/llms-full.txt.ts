import { llmsFull } from '../../shared/docs'

// public — runbook ห้ามมีค่าลับอยู่แล้ว (prerender เป็นไฟล์ static ตอน build)
export default defineEventHandler(async (event) => {
  const runbook = await useStorage('assets:docs').getItem<string>('RUNBOOK.md')
  if (!runbook) throw createError({ statusCode: 500, statusMessage: 'RUNBOOK.md not bundled' })
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  // เปิดอ่านในแท็บได้ (LLM/crawler) · ตอนกดบันทึกได้ชื่อไฟล์ที่บอกว่ามาจากไหน
  setResponseHeader(event, 'content-disposition', 'inline; filename="api-vault-llms-full.txt"')
  return llmsFull(String(runbook))
})
