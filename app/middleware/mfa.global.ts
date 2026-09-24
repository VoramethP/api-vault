import { nextStep } from '~~/shared/auth-flow'

// ส่งไปหน้า TOTP ตามสถานะ session — เป็นแค่การแสดงผล ตัวกันจริงคือ requireOwner() ที่ server
export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const session = useSupabaseSession()
  let state = null
  if (session.value) {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    state = { current: data?.currentLevel ?? null, next: data?.nextLevel ?? null }
  }
  const target = nextStep(to.path, state)
  if (target && target !== to.path) return navigateTo(target)
})
