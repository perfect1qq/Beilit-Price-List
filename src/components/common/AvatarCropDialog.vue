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

<script setup lang="ts">
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

interface CropperComponent {
  getCropData: (cb: (data: string) => void) => void
  getCropBlob: (cb: (blob: Blob) => void) => void
}

interface UploadFile {
  raw: File
}

interface UploadResponse {
  data?: {
    avatar?: string
    data?: {
      avatar?: string
    }
  }
  avatar?: string
}

interface ErrorResponse {
  response?: {
    data?: {
      data?: {
        avatar?: string
      }
      avatar?: string
      message?: string
    }
  }
  message?: string
}

const userStore = useUserStore()
const cropperRef = ref<CropperComponent | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const previewCroppedUrl = ref('')
const uploading = ref(false)

const getAvatarFromResponse = (res: UploadResponse): string | undefined =>
  res?.data?.avatar || res?.avatar || res?.data?.data?.avatar

const updateUserAvatar = (avatar: string): boolean => {
  if (!avatar) return false
  userStore.updateAvatar(avatar)
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

const handleFileChange = (file: UploadFile) => {
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
  cropperRef.value.getCropData((data: string) => {
    previewCroppedUrl.value = data
  })
}

const handleUpload = async () => {
  if (!cropperRef.value) return
  uploading.value = true
  try {
    const blob = await new Promise<Blob>((resolve) => {
      cropperRef.value!.getCropBlob((b: Blob) => resolve(b))
    })
    const formData = new FormData()
    formData.append('avatar', blob, 'avatar.png')
    const res = await authApi.uploadAvatar(formData)
    const avatarUrl = getAvatarFromResponse(res)
    if (avatarUrl) {
      updateUserAvatar(avatarUrl)
      ElMessage.success('头像更新成功')
      emit('uploaded')
      cancel()
    } else {
      ElMessage.error('上传失败：未收到头像地址')
    }
  } catch (err) {
    const error = err as ErrorResponse
    const fallbackAvatar = error?.response?.data?.data?.avatar || error?.response?.data?.avatar
    if (fallbackAvatar) {
      updateUserAvatar(fallbackAvatar)
      ElMessage.success('头像更新成功')
      emit('uploaded')
      cancel()
    } else {
      ElMessage.error(error?.response?.data?.message || error?.message || '上传失败，请稍后重试')
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
