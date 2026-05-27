import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { UserInfo, UserRole } from '@/types'

interface ChangePasswordData {
  oldPassword: string
  newPassword: string
}

interface CreateUserData {
  username: string
  password: string
  name?: string
  role?: UserRole
}

const changePassword = (data: ChangePasswordData) =>
  request.post<null>('/api/user/change-password', data)

const resetPassword = (userId: number | string, newPassword: string) =>
  request.post<null>(`/api/users/${userId}/reset-password`, { password: newPassword })

const listUsers = () =>
  request.get<{ users: UserInfo[] }>('/api/users')

const createUser = (data: CreateUserData) =>
  request.post<{ user: UserInfo }>('/api/users', data)

const updateUserRole = (userId: number | string, role: UserRole) =>
  request.put<{ user: UserInfo }>(`/api/users/${userId}/role`, { role })

const updateUserName = (userId: number | string, name: string) =>
  request.put<{ user: UserInfo }>(`/api/users/${userId}/name`, { name })

const deleteUser = (userId: number | string) =>
  request.delete<null>(`/api/users/${userId}`)

const getInviteCode = () =>
  request.get<{ inviteCode: string }>('/api/invite-code')

const refreshInviteCode = () =>
  request.post<{ inviteCode: string }>('/api/invite-code/refresh')

const userApi = {
  changePassword: unwrap(changePassword),
  resetPassword: unwrap(resetPassword),
  list: unwrap(listUsers),
  create: unwrap(createUser),
  remove: unwrap(deleteUser),
  updateRole: unwrap(updateUserRole),
  updateName: unwrap(updateUserName),
  getInviteCode: unwrap(getInviteCode),
  refreshInviteCode: unwrap(refreshInviteCode)
}

export { userApi }
export default userApi