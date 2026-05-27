import { computed, type ComputedRef } from 'vue'
import { useUserStore } from '@/stores/user'
import { ROLES } from '@/types'

interface PermissionsReturn {
  currentUser: ComputedRef<{ role: string }>
  isAdmin: ComputedRef<boolean>
  isGuest: ComputedRef<boolean>
  canEdit: ComputedRef<boolean>
  canDelete: ComputedRef<boolean>
  canCreate: ComputedRef<boolean>
  canExport: ComputedRef<boolean>
}

export const usePermissions = (): PermissionsReturn => {
  const store = useUserStore()
  const currentUser = computed(() => store.user || { role: ROLES.GUEST })
  const isAdmin = computed(() => currentUser.value.role === ROLES.ADMIN)
  const isGuest = computed(() => currentUser.value.role === ROLES.GUEST)
  const canWrite = computed(() => !isGuest.value)

  return {
    currentUser,
    isAdmin,
    isGuest,
    canEdit: canWrite,
    canDelete: canWrite,
    canCreate: canWrite,
    canExport: canWrite,
  }
}
