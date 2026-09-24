import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  supabase: {
    // middleware ของโมดูลเช็กแค่ว่ามี session · เรื่อง TOTP อยู่ที่ app/middleware/mfa.global.ts
    // /login กับ /confirm ถูกยกเว้นให้อัตโนมัติ · รายการนี้ต้องตรงกับ PUBLIC_PATHS ใน shared/auth-flow.ts
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/about', '/demo', '/demo/*'],
    },
  },
  runtimeConfig: {
    public: { appVersion: pkg.version },
  },
  // หน้าที่อ่าน session ห้าม isr/swr/prerender เด็ดขาด · เพิ่ม '/demo/**' เมื่อหน้าเดโมมีจริง
  // (prerender หน้าที่ไม่มี = build พัง)
  routeRules: {
    '/about': { prerender: true },
    // คำตอบที่ขึ้นกับ session ห้ามให้ CDN แคช — ผู้ใช้ A อาจได้ของผู้ใช้ B
    '/api/**': { headers: { 'cache-control': 'private, no-store' } },
  },
})
