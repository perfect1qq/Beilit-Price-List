import { defineStore } from 'pinia'
import authApi from '@/api/auth'
import type { UserInfo, SessionPayload, LoginCredentials, RegisterPayload } from '@/types'

interface UserState {
  user: UserInfo | null
  permissions: string[]
  menu: Record<string, unknown>[]
  hydrated: boolean
  loading: boolean
  authError: string | null
}

let restorePromise: Promise<UserInfo | null> | null = null

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    permissions: [],
    menu: [],
    hydrated: false,
    loading: false,
    authError: null,
  }),

  getters: {
    isLoggedIn: (state: UserState): boolean => Boolean(state.user?.id),

    username: (state: UserState): string => state.user?.username || '',

    role: (state: UserState): string => state.user?.role || '',

    displayName: (state: UserState): string => state.user?.name || state.user?.username || '',

    isAdmin: (state: UserState): boolean => state.user?.role === 'admin',

    isGuest: (state: UserState): boolean => state.user?.role === 'guest',

    hasPermission: (state: UserState) => (permission: string): boolean => {
      if (!permission) return true
      return state.permissions.includes(permission)
    },
  },

  actions: {
    setSession(payload: SessionPayload = {}): void {
      this.user = payload.user || null
      this.permissions = Array.isArray(payload.permissions)
        ? payload.permissions
        : []
      this.menu = Array.isArray(payload.menu) ? payload.menu : []
      this.hydrated = true
      this.authError = null
    },

    clearSession(): void {
      this.user = null
      this.permissions = []
      this.menu = []
      this.hydrated = true
      this.authError = null
    },

    async login(credentials: LoginCredentials): Promise<UserInfo> {
      this.loading = true
      try {
        const response = await authApi.login(credentials)
        this.setSession(response.data as SessionPayload)
        return response.data as UserInfo
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string }
        this.authError =
          err?.response?.data?.message || err?.message || '登录失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async register(payload: RegisterPayload): Promise<unknown> {
      const response = await authApi.register(payload)
      return response.data
    },

    async restoreSession(force: boolean = false): Promise<UserInfo | null> {
      if (!force && this.hydrated) {
        return this.user
      }

      if (!force && restorePromise) {
        return restorePromise
      }

      restorePromise = authApi
        .getProfile()
        .then((response) => {
          this.setSession(response.data as SessionPayload)
          return this.user
        })
        .catch((error: unknown) => {
          const err = error as { response?: { status?: number } }
          if (err?.response?.status === 401) {
            this.clearSession()
            return null
          }

          this.hydrated = true
          throw error
        })
        .finally(() => {
          restorePromise = null
        })

      return restorePromise
    },

    async refreshProfile(): Promise<UserInfo | null> {
      const response = await authApi.getProfile({ disableCacheBust: false })
      this.setSession(response.data as SessionPayload)
      return this.user
    },

    async logout(): Promise<void> {
      try {
        await authApi.logout()
      } finally {
        this.clearSession()
      }
    },
  },
})