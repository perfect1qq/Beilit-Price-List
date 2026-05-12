import { useUserStore } from '@/stores/user'
import { pinia } from '@/stores'
import { isPublicRegisterEnabled } from '@/utils/runtimeConfig'
import type { RouteLocationNormalized } from 'vue-router'

const PERMISSION_FALLBACKS: Record<string, string> = {
  'quotation:write': '/quotation/history',
  'beam:write': '/beam-quotation/history'
}

export const applyAuthGuard = async (to: RouteLocationNormalized): Promise<boolean | string> => {
  const userStore = useUserStore(pinia)

  if (to.meta.public) {
    if (to.path === '/register' && !isPublicRegisterEnabled) {
      return '/login'
    }

    try {
      await userStore.restoreSession()
    } catch {
      // keep public routes accessible when profile probing fails
    }

    if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
      return '/'
    }
    return true
  }

  let sessionRestored: boolean
  try {
    const user = await userStore.restoreSession()
    sessionRestored = !!user
  } catch {
    sessionRestored = false
  }

  if (!sessionRestored) {
    return '/login'
  }

  const requiredPermission = to.meta?.requiresPermission as string | undefined
  if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
    return PERMISSION_FALLBACKS[requiredPermission] || '/'
  }

  return true
}