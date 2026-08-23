<template>
  <el-dialog v-model="visible" title="更换头像" width="520px" :append-to-body="true" :close-on-click-modal="false"
    @open="onDialogOpen">
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
            <AppButton variant="upload" size="large" label="选择图片" />
          </template>
        </el-upload>
        <p class="avatar-tip">支持 jpg、png、gif、webp 格式，大小不超过 5MB</p>
      </div>

      <div v-else class="avatar-crop-area">
        <div class="crop-container" ref="cropContainerRef" @wheel.prevent="onWheel">
          <img :src="previewUrl" :style="imageStyle" draggable="false" @load="onImageLoad"
            @mousedown.prevent="onImgPointerDown" @touchstart.prevent="onImgTouchStart" alt="" />
          <div class="crop-overlay"></div>
          <div class="crop-box" :style="cropBoxStyle" @mousedown.prevent="onCropBoxPointerDown"
            @touchstart.prevent="onCropBoxTouchStart">
            <span class="crop-grid grid-h"></span>
            <span class="crop-grid grid-v"></span>
            <span class="crop-grid grid-h-2"></span>
            <span class="crop-grid grid-v-2"></span>
            <span class="resize-handle handle-nw" data-dir="nw" @mousedown.stop.prevent="onResizeStart($event, 'nw')"
              @touchstart.stop.prevent="onResizeTouchStart($event, 'nw')"></span>
            <span class="resize-handle handle-ne" data-dir="ne" @mousedown.stop.prevent="onResizeStart($event, 'ne')"
              @touchstart.stop.prevent="onResizeTouchStart($event, 'ne')"></span>
            <span class="resize-handle handle-sw" data-dir="sw" @mousedown.stop.prevent="onResizeStart($event, 'sw')"
              @touchstart.stop.prevent="onResizeTouchStart($event, 'sw')"></span>
            <span class="resize-handle handle-se" data-dir="se" @mousedown.stop.prevent="onResizeStart($event, 'se')"
              @touchstart.stop.prevent="onResizeTouchStart($event, 'se')"></span>
            <span class="resize-handle handle-n" data-dir="n" @mousedown.stop.prevent="onResizeStart($event, 'n')"
              @touchstart.stop.prevent="onResizeTouchStart($event, 'n')"></span>
            <span class="resize-handle handle-s" data-dir="s" @mousedown.stop.prevent="onResizeStart($event, 's')"
              @touchstart.stop.prevent="onResizeTouchStart($event, 's')"></span>
            <span class="resize-handle handle-w" data-dir="w" @mousedown.stop.prevent="onResizeStart($event, 'w')"
              @touchstart.stop.prevent="onResizeTouchStart($event, 'w')"></span>
            <span class="resize-handle handle-e" data-dir="e" @mousedown.stop.prevent="onResizeStart($event, 'e')"
              @touchstart.stop.prevent="onResizeTouchStart($event, 'e')"></span>
          </div>
        </div>
        <div class="crop-preview-wrapper">
          <span class="preview-label">预览</span>
          <div :style="previewStyle" class="crop-preview-round">
            <img :src="previewUrl" :style="previewImgStyle" alt="" />
          </div>
          <p class="zoom-tip">滚轮缩放 · 拖动图片/选框调整位置</p>
        </div>
      </div>
    </div>
    <template #footer>
      <AppButton variant="cancel" label="取消" @click="cancel" />
      <AppButton v-if="selectedFile" label="重新选择" @click="resetCrop" />
      <AppButton variant="submit" :loading="uploading" :disabled="!selectedFile" label="确认上传" @click="handleUpload" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppButton from '@/components/common/AppButton.vue'
import authApi from '@/api/auth'
import { extractMessage } from '@/utils/message'
import { useUserStore } from '@/stores/user'
import { useAvatarCrop } from '@/composables/useAvatarCrop'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  avatarUrl: { type: String, default: '' },
  userInitial: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'uploaded'])

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
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const uploading = ref(false)

const cropContainerRef = ref<HTMLDivElement | null>(null)

const {
  imageStyle, cropBoxStyle, previewImgStyle,
  onImageLoad, onImgPointerDown, onImgTouchStart,
  onCropBoxPointerDown, onCropBoxTouchStart,
  onResizeStart, onResizeTouchStart, onWheel,
  createCroppedBlob, resetState,
} = useAvatarCrop({ cropContainerRef, previewUrl })

const getAvatarFromResponse = (res: UploadResponse): string | undefined =>
  res?.data?.avatar || res?.avatar || res?.data?.data?.avatar

const updateUserAvatar = (avatar: string): boolean => {
  if (!avatar) return false
  userStore.updateAvatar(avatar)
  return true
}

const clearSelection = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  selectedFile.value = null
  previewUrl.value = ''
  resetState()
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
  border: '2px solid #e5e7eb',
  position: 'relative' as const,
}))

const cancel = () => {
  visible.value = false
  clearSelection()
}

const resetCrop = () => {
  clearSelection()
}

const onDialogOpen = () => { }

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
}

const handleUpload = async () => {
  uploading.value = true
  try {
    const blob = await createCroppedBlob()
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
      ElMessage.error(extractMessage(error, '上传失败，请稍后重试'))
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
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
  border-radius: 4px;
  user-select: none;
  touch-action: none;
}

.crop-container img {
  pointer-events: auto;
}

.crop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;
  z-index: 1;
}

.crop-box {
  position: absolute;
  border: 2px solid #fff;
  z-index: 2;
  box-sizing: border-box;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  z-index: 3;
  cursor: pointer;
}

.handle-nw {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

.handle-ne {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

.handle-sw {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}

.handle-se {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}

.handle-n {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.handle-s {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.handle-w {
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.handle-e {
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.crop-grid {
  position: absolute;
  background: transparent;
  border: 0 solid rgba(255, 255, 255, 0.6);
}

.grid-h {
  top: 33.33%;
  left: 0;
  right: 0;
  height: 0;
  border-top-width: 1px;
}

.grid-v {
  left: 33.33%;
  top: 0;
  bottom: 0;
  width: 0;
  border-left-width: 1px;
}

.grid-h-2 {
  top: 66.66%;
  left: 0;
  right: 0;
  height: 0;
  border-top-width: 1px;
}

.grid-v-2 {
  left: 66.66%;
  top: 0;
  bottom: 0;
  width: 0;
  border-left-width: 1px;
}

.crop-preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.zoom-tip {
  color: #94a3b8;
  font-size: 11px;
  margin: 0;
  text-align: center;
  max-width: 120px;
  line-height: 1.4;
}

.crop-preview-round img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
