/**
 * @module composables/useAvatarUpload
 * @description 头像上传组合式函数
 * 
 * 从 Navbar.vue 中抽取，提供完整的头像上传能力：
 * - 文件选择和校验
 * - 图片裁剪（vue-cropper）
 * - 实时预览
 * - 上传到服务器
 * - 即时更新用户 Store
 */

import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import authApi from '@/api/auth'
import { useUserStore } from '@/stores/user'

export function useAvatarUpload() {
  const userStore = useUserStore()

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  const avatarUrl = computed(() => {
    const avatar = userStore.user?.avatar
    if (avatar) {
      if (avatar.startsWith('http') || avatar.startsWith('data:')) {
        return avatar
      }
      return `${API_BASE_URL}${avatar}`
    }
    return ''
  })

  const dialogVisible = ref(false)
  const cropperRef = ref(null)
  const selectedFile = ref(null)
  const previewUrl = ref('')
  const previewCroppedUrl = ref('')
  const uploading = ref(false)

  const previewStyle = computed(() => ({
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #e5e7eb'
  }))

  const showDialog = () => {
    selectedFile.value = null
    previewUrl.value = ''
    previewCroppedUrl.value = ''
    dialogVisible.value = true
  }

  const cancel = () => {
    dialogVisible.value = false
    selectedFile.value = null
    previewUrl.value = ''
    previewCroppedUrl.value = ''
  }

  const resetCrop = () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    selectedFile.value = null
    previewUrl.value = ''
    previewCroppedUrl.value = ''
  }

  const handleFileChange = (file) => {
    const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.raw.type)
    const isLt5M = file.raw.size / 1024 / 1024 < 5
    if (!isImage) {
      ElMessage.error('只能上传图片文件!')
      return false
    }
    if (!isLt5M) {
      ElMessage.error('图片大小不能超过 5MB!')
      return false
    }
    selectedFile.value = file.raw
    previewUrl.value = URL.createObjectURL(file.raw)
    previewCroppedUrl.value = ''
  }

  watch(previewUrl, (newVal) => {
    if (newVal) {
      previewCroppedUrl.value = ''
    }
  })

  const onRealTime = () => {
    if (!cropperRef.value) return
    cropperRef.value.getCropData((data) => {
      previewCroppedUrl.value = data
    })
  }

  const upload = async () => {
    if (!selectedFile.value || !cropperRef.value) return

    uploading.value = true
    try {
      const blob = await new Promise((resolve) => {
        cropperRef.value.getCropBlob((blob) => {
          resolve(blob)
        })
      })

      if (!blob || blob.size === 0) {
        throw new Error('裁剪失败，请重新选择图片')
      }

      const formData = new FormData()
      formData.append('avatar', blob, `avatar_${Date.now()}.png`)

      const res = await authApi.uploadAvatar(formData)
      const avatarUrlFromServer = res?.data?.avatar || res?.avatar

      if (userStore.user && avatarUrlFromServer) {
        userStore.user.avatar = avatarUrlFromServer
      }

      ElMessage.success('头像上传成功')
      dialogVisible.value = false
      selectedFile.value = null
      previewUrl.value = ''
      previewCroppedUrl.value = ''
    } catch (err) {
      ElMessage.error(err?.response?.data?.message || err?.message || '上传失败')
    } finally {
      uploading.value = false
    }
  }

  return {
    avatarUrl,
    dialogVisible,
    cropperRef,
    selectedFile,
    previewUrl,
    previewCroppedUrl,
    uploading,
    previewStyle,
    showDialog,
    cancel,
    resetCrop,
    handleFileChange,
    onRealTime,
    upload
  }
}
