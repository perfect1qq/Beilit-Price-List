<template>
  <el-dialog v-model="visible" title="更换头像" width="480px" :append-to-body="true" :close-on-click-modal="false">
    <div class="avatar-dialog-content">
      <div v-if="!selectedFile" class="avatar-upload-area">
        <div class="avatar-preview-large">
          <el-avatar :size="120" :src="avatarUrl">
            {{ userInitial }}
          </el-avatar>
        </div>
        <el-upload class="avatar-uploader" action="" :auto-upload="false" :show-file-list="false"
          accept="image/jpeg,image/png,image/gif,image/webp" :on-change="handleFileChange">
          <template #trigger>
            <el-button type="primary" size="large">选择图片</el-button>
          </template>
        </el-upload>
        <p class="avatar-tip">支持 jpg、png、gif、webp 格式，大小不超过 5MB</p>
      </div>

      <div v-else class="avatar-crop-area">
        <div class="crop-container">
          <VueCropper ref="cropperRef" :img="previewUrl" :output-size="1" :output-type="'png'" :info="true"
            :full="false" :can-move="true" :can-move-box="true" :can-scale="true" :original="false" :auto-crop="true"
            :auto-crop-width="150" :auto-crop-height="150" :fixed="true" :fixed-number="[1, 1]" :center-box="true"
            mode="contain" @real-time="onRealTime" />
        </div>
        <div class="crop-preview-wrapper">
          <span class="preview-label">预览</span>
          <div :style="previewStyle" class="crop-preview-round">
            <img :src="previewCroppedUrl" alt="" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button v-if="selectedFile" @click="resetCrop">重新选择</el-button>
      <el-button type="primary" :loading="uploading" @click="handleUpload" :disabled="!selectedFile">确认上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VueCropper } from 'vue-cropper/next'
import 'vue-cropper/next/dist/index.css'
import authApi from '@/api/auth'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  avatarUrl: { type: String, default: '' },
  userInitial: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'uploaded'])

const userStore = useUserStore()
const cropperRef = ref(null)
const selectedFile = ref(null)
const previewUrl = ref('')
const previewCroppedUrl = ref('')
const uploading = ref(false)

const getAvatarFromResponse = (res) =>
  res?.data?.avatar || res?.avatar || res?.data?.data?.avatar

const updateUserAvatar = (avatar) => {
  if (!avatar || !userStore.user) return false
  userStore.user.avatar = avatar
  return true
}

const clearSelection = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  selectedFile.value = null
  previewUrl.value = ''
  previewCroppedUrl.value = ''
}

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const previewStyle = computed(() => ({
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  overflow: 'hidden',
  border: '2px solid #e5e7eb'
}))

const cancel = () => {
  visible.value = false
  clearSelection()
}

const resetCrop = () => {
  clearSelection()
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

const handleUpload = async () => {
  if (!cropperRef.value) return
  uploading.value = true
  try {
    const blob = await new Promise((resolve) => {
      cropperRef.value.getCropBlob((b) => resolve(b))
    })

    if (!blob || blob.size === 0) {
      throw new Error('裁剪失败，请重新选择图片')
    }

    const formData = new FormData()
    formData.append('avatar', blob, 'avatar.png')
    const res = await authApi.uploadAvatar(formData)
    const avatarUrl = getAvatarFromResponse(res)
    if (updateUserAvatar(avatarUrl)) {
      ElMessage.success('头像更新成功')
      emit('uploaded')
      cancel()
    } else {
      ElMessage.error('上传失败：未收到头像地址')
    }
  } catch (err) {
    const fallbackAvatar = err?.response?.data?.data?.avatar || err?.response?.data?.avatar
    if (updateUserAvatar(fallbackAvatar)) {
      ElMessage.success('头像更新成功')
      emit('uploaded')
      cancel()
    } else {
      ElMessage.error(err?.response?.data?.message || '上传失败，请稍后重试')
    }
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.avatar-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.avatar-preview-large {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.avatar-uploader {
  width: 100%;
}

.avatar-uploader :deep(.el-upload) {
  width: 100%;
  display: flex;
  justify-content: center;
}

.avatar-tip {
  color: #94a3b8;
  font-size: 12px;
  margin: 0;
}

.avatar-crop-area {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  padding: 10px 0;
}

.crop-container {
  width: 280px;
  height: 280px;
}

.crop-preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.preview-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.crop-preview-round img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
