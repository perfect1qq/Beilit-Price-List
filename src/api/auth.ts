import request from '../utils/request'
import type { LoginCredentials, RegisterPayload, RequestConfig, SessionPayload, UserInfo } from '@/types'

const login = async (data: LoginCredentials, config: RequestConfig = {}): Promise<SessionPayload> => {
  const response = await request.post<SessionPayload>('/api/login', data, {
    authRedirect: false,
    skipCancel: true,
    ...config,
  })
  return response.data
}

const register = async (data: RegisterPayload, config: RequestConfig = {}): Promise<{ user: UserInfo }> => {
  const response = await request.post<{ user: UserInfo }>('/api/register', data, {
    authRedirect: false,
    skipCancel: true,
    ...config,
  })
  return response.data
}

const getProfile = async (config: RequestConfig = {}): Promise<SessionPayload> => {
  const response = await request.get<SessionPayload>('/api/profile', {
    disableCacheBust: true,
    skipCancel: true,
    silent: true,
    authRedirect: false,
    ...config,
  })
  return response.data
}

const logout = async (config: RequestConfig = {}): Promise<void> => {
  await request.post('/api/logout', null, {
    authRedirect: false,
    skipCancel: true,
    silent: true,
    ...config,
  })
}

const uploadAvatar = async (formData: FormData): Promise<{ avatar: string }> => {
  const response = await request.post<{ avatar: string }>('/api/avatar', formData, {
    authRedirect: false,
    skipCancel: true,
  } as RequestConfig)
  return response.data
}

const deleteAvatar = async (): Promise<void> => {
  await request.delete('/api/avatar', {
    authRedirect: false,
    skipCancel: true,
  } as RequestConfig)
}

const refresh = async (): Promise<SessionPayload> => {
  const response = await request.post<SessionPayload>('/api/refresh', null, {
    authRedirect: false,
    skipCancel: true,
    silent: true,
    _isRefreshRequest: true,
  } as RequestConfig)
  return response.data
}

export default {
  login,
  register,
  getProfile,
  logout,
  uploadAvatar,
  deleteAvatar,
  refresh,
  refreshToken: refresh,
}
