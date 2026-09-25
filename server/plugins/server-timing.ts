// Server-Timing บอกเวลาใน DevTools (Network › Timing) ทั้ง dev และ production — ใช้ดูว่าช้าตรงไหนก่อนจะแก้
// มีแค่ชื่อขั้นกับตัวเลข ไม่มีข้อมูลของ request
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', (event) => {
    event.context.timingStart = performance.now()
  })
  nitro.hooks.hook('beforeResponse', (event) => {
    const start = event.context.timingStart as number | undefined
    if (start === undefined || !event.path.startsWith('/api/')) return
    const parts = [...(event.context.timings as string[] | undefined ?? []), `total;dur=${(performance.now() - start).toFixed(1)}`]
    appendResponseHeader(event, 'Server-Timing', parts.join(', '))
  })
})
