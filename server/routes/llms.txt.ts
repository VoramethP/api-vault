import { llmsIndex } from '../../shared/docs'

// public — ไม่มีข้อมูลส่วนตัว (prerender เป็นไฟล์ static ตอน build)
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return llmsIndex()
})
