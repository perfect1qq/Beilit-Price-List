import { computed, type ComputedRef } from 'vue'
import { readCurrentUser } from '@/utils/navigation'
import type { UserInfo } from '@/types'

interface PermissionsReturn {
  currentUser: ComputedRef<UserInfo | { role: string }>
  isAdmin: ComputedRef<boolean>
  isGuest: ComputedRef<boolean>
  canEdit: ComputedRef<boolean>
  canDelete: ComputedRef<boolean>
  canCreate: ComputedRef<boolean>
  canExport: ComputedRef<boolean>
}

export const usePermissions = (): PermissionsReturn => {
  const currentUser = computed(() => readCurrentUser())
  const isAdmin = computed(() => currentUser.value.role === 'admin')
  const isGuest = computed(() => currentUser.value.role === 'guest')
  const canEdit = computed(() => !isGuest.value)
  const canDelete = computed(() => !isGuest.value)
  const canCreate = computed(() => !isGuest.value)
  const canExport = computed(() => !isGuest.value)

  return {
    currentUser,
    isAdmin,
    isGuest,
    canEdit,
    canDelete,
    canCreate,
    canExport
  }
}
