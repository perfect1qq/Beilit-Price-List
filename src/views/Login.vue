<template>
  <AuthLayout card-title="欢迎登入系统" card-subtitle="请输入正式员工账号与密码登录倍力特工作台">

    <el-form ref="formRef" :model="form" :rules="rules" class="form" @keyup.enter="handleLogin">

      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" size="large" clearable :prefix-icon="User" />
      </el-form-item>

      <el-form-item prop="password">
        <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password
          :prefix-icon="Lock" />
      </el-form-item>


      <el-button class="login-btn" type="primary" size="large" :loading="loading" @click="handleLogin">
        登录系统
      </el-button>


      <div v-if="isPublicRegisterEnabled" class="footer-links">
        <span>还没账号？</span>
        <el-link type="primary" underline="never" @click="goToRegister">
          立即注册
        </el-link>
      </div>
    </el-form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { to } from '@/utils/async'
import { showError } from '@/utils/message'
import { Lock, User } from '@element-plus/icons-vue'
import { isPublicRegisterEnabled } from '@/utils/runtimeConfig'
import AuthLayout from '@/components/common/AuthLayout.vue'

const router = useRouter()
const userStore = useUserStore()


const loading = ref(false)


const formRef = ref()



const form = reactive({
  username: '',
  password: '',
})



const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}



const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true

    const [err] = await to(
      userStore.login({
        username: form.username,
        password: form.password,
      }),
    )

    if (err) {
      showError(err, '登录异常失败，请检查网络')
      loading.value = false
      return
    }

    router.replace('/')
    loading.value = false
  })
}


const goToRegister = () => router.push('/register')
</script>
