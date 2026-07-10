<template>
  <AuthLayout card-title="申请创建账号" card-subtitle="填写基本员工信息与邀请码加入倍力特管理平台">

    <el-form ref="formRef" :model="form" :rules="rules" class="form" @keyup.enter="handleRegister">
      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="请输入至少3位用户名" size="large" clearable :prefix-icon="User" />
      </el-form-item>
      <el-form-item prop="name">
        <el-input v-model="form.name" placeholder="请输入真实姓名" size="large" clearable :prefix-icon="UserFilled" />
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="form.password" type="password" placeholder="请设置登录密码" size="large" show-password
          :prefix-icon="Lock" />
      </el-form-item>
      <el-form-item prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" placeholder="请再次确认密码" size="large" show-password
          :prefix-icon="Lock" />
      </el-form-item>
      <el-form-item prop="inviteCode">
        <el-input v-model="form.inviteCode" placeholder="请输入管理员邀请码" size="large" clearable :prefix-icon="Key" />
      </el-form-item>

      <el-button class="login-btn" type="primary" size="large" :loading="loading"
        @click="handleRegister">立即注册</el-button>

      <div class="footer-links">
        <span>已有账号？</span>
        <el-link type="primary" underline="never" @click="goToLogin">去登录</el-link>
      </div>
    </el-form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { to } from '@/utils/async'
import { showError, showSuccess } from '@/utils/message'
import { Lock, User, UserFilled, Key } from '@element-plus/icons-vue'
import { isPublicRegisterEnabled } from '@/utils/runtimeConfig'
import AuthLayout from '@/components/common/AuthLayout.vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const formRef = ref()

if (!isPublicRegisterEnabled) {
  router.replace('/login')
}


const form = reactive({
  username: '',
  name: '',
  password: '',
  confirmPassword: '',
  inviteCode: ''
})


const validatePass2 = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value === '') {
    callback(new Error('请再次输入密码以确认'))
  } else if (value !== form.password) {
    callback(new Error('两次输入的新密码不一致!'))
  } else {
    callback()
  }
}


const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度至少为 3 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/, message: '用户名只能包含字母或数字，且必须包含至少一个字母', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, message: '姓名长度至少为 2 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置登录密码', trigger: 'blur' },
    { min: 6, message: '密码安全长度至少为 6 个字符', trigger: 'blur' },
    { max: 100, message: '密码长度不能超过 100 个字符', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validatePass2, trigger: 'blur', required: true }],
  inviteCode: [
    { required: true, message: '请输入管理员提供的邀请码', trigger: 'blur' }
  ]
}


const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    const [err] = await to(userStore.register({
      username: form.username,
      name: form.name,
      password: form.password,
      inviteCode: form.inviteCode
    }))
    if (err) {
      showError(err, '服务器繁忙，注册失败请重试')
      loading.value = false
      return
    }
    showSuccess('账号创建成功，请使用新账号登入系统')
    router.push('/login')
    loading.value = false
  })
}


const goToLogin = () => router.push('/login')
</script>
