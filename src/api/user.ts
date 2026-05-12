import request from '../utils/request'
import { unwrap } from '../utils/unwrap'

interface ChangePasswordData {
  oldPassword: string
  newPassword: string
}

interface CreateUserData {
  username: string
  password: string
  name?: string
  role?: string
}

const changePassword = (data: ChangePasswordData) => request.post('/api/user/change-password', data)

const resetPassword = (userId: number | string, newPassword: string) =>
  request.post(`/api/users/${userId}/reset-password`, { password: newPassword })

const listUsers = () => request.get('/api/users')

const createUser = (data: CreateUserData) => request.post('/api/users', data)

const updateUserRole = (userId: number | string, role: string) =>
  request.put(`/api/users/${userId}/role`, { role })

const updateUserName = (userId: number | string, name: string) =>
  request.put(`/api/users/${userId}/name`, { name })

const deleteUser = (userId: number | string) => request.delete(`/api/users/${userId}`)

const getInviteCode = () => request.get('/api/invite-code')

const refreshInviteCode = () => request.post('/api/invite-code/refresh')

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