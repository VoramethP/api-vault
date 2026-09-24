import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  supabase: {
    // ปิด redirect ไว้จนกว่าจะมีหน้า /login ใน v0.2.0 — ตอนนั้นทั้งแอปอยู่หลังล็อกอิน
    // ยกเว้นเดโมและ /about (ADR-0004)
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/demo', '/demo/*', '/about'],
    },
  },
  runtimeConfig: {
    public: { appVersion: pkg.version },
  },
  // หน้าที่อ่าน session ห้าม isr/swr/prerender เด็ดขาด · เพิ่ม '/demo/**' เมื่อหน้าเดโมมีจริง
  // (prerender หน้าที่ไม่มี = build พัง)
  routeRules: {
    '/about': { prerender: true },
  },
})
