import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/user'

interface PasswordDialogForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordDialogState {
  visible: boolean
  form: PasswordDialogForm
}

interface AsyncDialogRef {
  load: <T>(fn: () => Promise<T>) => Promise<T>
}

interface NavbarPasswordDialogDeps {
  onSuccess?: () => void
  dialogRef?: { value: AsyncDialogRef | null }
}

export const useNavbarPasswordDialog = ({ onSuccess, dialogRef }: NavbarPasswordDialogDeps) => {
  const changePassDialog = reactive<PasswordDialogState>({
    visible: false,
    form: { oldPassword: '', newPassword: '', confirmPassword: '' }
  })

  const confirmChangePass = async (): Promise<void> => {
    const { oldPassword, newPassword, confirmPassword } = changePassDialog.form
    if (!oldPassword || !newPassword) { ElMessage.warning('请填写必填项'); return }
    if (newPassword !== confirmPassword) { ElMessage.warning('两次输入的新密码不一致'); return }
    if (newPassword.length < 6) { ElMessage.warning('密码长度至少为 6 位'); return }
    if (newPassword.length > 100) { ElMessage.warning('密码长度不能超过 100 位'); return }

    try {
      await dialogRef?.value?.load(() =>
        userApi.changePassword({ oldPassword, newPassword })
      )
      ElMessage.success('密码修改成功，请重新登录')
      changePassDialog.visible = false
      changePassDialog.form = { oldPassword: '', newPassword: '', confirmPassword: '' }
      onSuccess?.()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      ElMessage.error(err?.response?.data?.message || '修改失败')
    }
  }

  return {
    changePassDialog,
    confirmChangePass
  }
}
