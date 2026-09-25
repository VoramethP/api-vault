import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        // SVG คมทุกขนาด · favicon.ico เดิมคงไว้เป็นตัวสำรองให้เบราว์เซอร์ที่ไม่รองรับ SVG
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
      ],
    },
  },
  supabase: {
    // middleware ของโมดูลเช็กแค่ว่ามี session · เรื่อง TOTP อยู่ที่ app/middleware/mfa.global.ts
    // /login กับ /confirm ถูกยกเว้นให้อัตโนมัติ · รายการนี้ต้องตรงกับ PUBLIC_PATHS ใน shared/auth-flow.ts
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/about', '/docs', '/demo', '/demo/*'],
    },
  },
  // docs/RUNBOOK.md ติดไปกับ server bundle — llms-full.txt อ่านจากตรงนี้ (dir นับจาก server/)
  nitro: {
    serverAssets: [{ baseName: 'docs', dir: '../docs' }],
  },
  runtimeConfig: {
    public: { appVersion: pkg.version },
  },
  // หน้าที่อ่าน session ห้าม isr/swr/prerender เด็ดขาด · prerender เฉพาะหน้าสาธารณะที่ไม่มีข้อมูลส่วนตัว
  routeRules: {
    // ตั้งเองไม่พึ่งค่าเริ่มของเบราว์เซอร์ — ลิงก์ออกไปเว็บเจ้าของ API ส่งแค่ชื่อโดเมน ไม่ส่ง path/query ของเรา (skill url-safety ข้อ 4)
    '/**': { headers: { 'referrer-policy': 'strict-origin-when-cross-origin' } },
    '/about': { prerender: true },
    '/demo': { prerender: true },
    '/docs': { prerender: true },
    '/llms.txt': { prerender: true },
    '/llms-full.txt': { prerender: true },
    // คำตอบที่ขึ้นกับ session ห้ามให้ CDN แคช — ผู้ใช้ A อาจได้ของผู้ใช้ B
    '/api/**': { headers: { 'cache-control': 'private, no-store' } },
  },
})
