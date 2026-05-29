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
            <el-button type="primary" size="large">选择图片</el-button>
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
      <el-button @click="cancel">取消</el-button>
      <el-button v-if="selectedFile" @click="resetCrop">重新选择</el-button>
      <el-button type="primary" :loading="uploading" @click="handleUpload" :disabled="!selectedFile">确认上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import authApi from '@/api/auth'
import { useUserStore } from '@/stores/user'

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

const CONTAINER_SIZE = 280
const CROP_BOX_MIN = 60
const CROP_BOX_MAX = 280
const CROP_BOX_DEFAULT = 150
const MIN_SCALE = 0.5
const MAX_SCALE = 5
const ZOOM_STEP = 0.1

const imageState = ref({
  naturalWidth: 0,
  naturalHeight: 0,
  scale: 1,
  x: 0,
  y: 0,
})

const cropBoxPos = ref({ x: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2, y: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2 })
const cropBoxSize = ref(CROP_BOX_DEFAULT)

type DragTarget = 'image' | 'cropbox' | 'resize' | null
const dragTarget = ref<DragTarget>(null)
let dragStartX = 0
let dragStartY = 0
let dragStartValX = 0
let dragStartValY = 0
let dragStartW = 0
let dragStartH = 0
let resizeDir = ''

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

const resetState = () => {
  imageState.value = { naturalWidth: 0, naturalHeight: 0, scale: 1, x: 0, y: 0 }
  cropBoxPos.value = { x: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2, y: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2 }
  cropBoxSize.value = CROP_BOX_DEFAULT
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

const imageStyle = computed(() => {
  const s = imageState.value
  return {
    position: 'absolute' as const,
    width: `${s.naturalWidth * s.scale}px`,
    height: `${s.naturalHeight * s.scale}px`,
    left: `${s.x}px`,
    top: `${s.y}px`,
    transition: dragTarget.value ? 'none' : '',
    cursor: dragTarget.value === 'image' ? 'grabbing' : 'grab',
    userSelect: 'none' as const,
    maxWidth: 'none',
    maxHeight: 'none',
  }
})

const cropBoxStyle = computed(() => ({
  width: `${cropBoxSize.value}px`,
  height: `${cropBoxSize.value}px`,
  left: `${cropBoxPos.value.x}px`,
  top: `${cropBoxPos.value.y}px`,
  cursor: dragTarget.value === 'cropbox' ? 'grabbing' : 'move',
}))

const previewImgStyle = computed(() => {
  const s = imageState.value
  if (!s.naturalWidth || !s.naturalHeight || !previewUrl.value) return { display: 'none' }

  const cb = cropBoxPos.value
  const boxSize = cropBoxSize.value
  const imgLeftInContainer = s.x
  const imgTopInContainer = s.y
  const imgDisplayW = s.naturalWidth * s.scale
  const imgDisplayH = s.naturalHeight * s.scale

  const previewSize = 100
  const ratio = previewSize / boxSize

  const offsetX = (imgLeftInContainer - cb.x) * ratio
  const offsetY = (imgTopInContainer - cb.y) * ratio
  const scaledW = imgDisplayW * ratio
  const scaledH = imgDisplayH * ratio

  return {
    position: 'absolute' as const,
    top: `${offsetY}px`,
    left: `${offsetX}px`,
    width: `${scaledW}px`,
    height: `${scaledH}px`,
    transformOrigin: '0 0',
  }
})

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

const clampCropBox = (x: number, y: number, w: number = cropBoxSize.value): [number, number] => {
  return [
    Math.max(0, Math.min(x, CONTAINER_SIZE - w)),
    Math.max(0, Math.min(y, CONTAINER_SIZE - w)),
  ]
}

const clampImage = (scale: number, x: number, y: number): [number, number, number] => {
  const imgW = imageState.value.naturalWidth * scale
  const imgH = imageState.value.naturalHeight * scale
  let cx = x
  let cy = y
  if (imgW <= CONTAINER_SIZE) cx = (CONTAINER_SIZE - imgW) / 2
  else cx = Math.max(CONTAINER_SIZE - imgW, Math.min(cx, 0))
  if (imgH <= CONTAINER_SIZE) cy = (CONTAINER_SIZE - imgH) / 2
  else cy = Math.max(CONTAINER_SIZE - imgH, Math.min(cy, 0))
  return [scale, cx, cy]
}

const onImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  const naturalW = img.naturalWidth
  const naturalH = img.naturalHeight

  const fitScale = Math.min(CONTAINER_SIZE / naturalW, CONTAINER_SIZE / naturalH)
  const scale = fitScale > 1 ? 1 : fitScale

  const displayW = naturalW * scale
  const displayH = naturalH * scale
  const x = (CONTAINER_SIZE - displayW) / 2
  const y = (CONTAINER_SIZE - displayH) / 2

  imageState.value = { naturalWidth: naturalW, naturalHeight: naturalH, scale, x, y }
  cropBoxPos.value = { x: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2, y: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2 }
  cropBoxSize.value = CROP_BOX_DEFAULT
}

function startDrag(target: DragTarget, clientX: number, clientY: number) {
  dragTarget.value = target
  dragStartX = clientX
  dragStartY = clientY
  if (target === 'image') {
    dragStartValX = imageState.value.x
    dragStartValY = imageState.value.y
  } else {
    dragStartValX = cropBoxPos.value.x
    dragStartValY = cropBoxPos.value.y
  }
  document.addEventListener('mousemove', onGlobalMove)
  document.addEventListener('mouseup', onGlobalUp)
  document.addEventListener('touchmove', onGlobalTouchMove, { passive: false })
  document.addEventListener('touchend', onGlobalTouchEnd)
}

const onImgPointerDown = (e: MouseEvent) => startDrag('image', e.clientX, e.clientY)
const onImgTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) startDrag('image', e.touches[0].clientX, e.touches[0].clientY)
}
const onCropBoxPointerDown = (e: MouseEvent) => startDrag('cropbox', e.clientX, e.clientY)
const onCropBoxTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) startDrag('cropbox', e.touches[0].clientX, e.touches[0].clientY)
}

const onGlobalMove = (e: MouseEvent) => {
  if (!dragTarget.value) return
  e.preventDefault()
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  applyDrag(dx, dy)
}

const onGlobalTouchMove = (e: TouchEvent) => {
  if (!dragTarget.value || !e.touches.length) return
  e.preventDefault()
  const dx = e.touches[0].clientX - dragStartX
  const dy = e.touches[0].clientY - dragStartY
  applyDrag(dx, dy)
}

const applyDrag = (dx: number, dy: number) => {
  if (dragTarget.value === 'image') {
    const [, newX, newY] = clampImage(imageState.value.scale, dragStartValX + dx, dragStartValY + dy)
    imageState.value = { ...imageState.value, x: newX, y: newY }
  } else if (dragTarget.value === 'cropbox') {
    const [newX, newY] = clampCropBox(dragStartValX + dx, dragStartValY + dy)
    cropBoxPos.value = { x: newX, y: newY }
  } else if (dragTarget.value === 'resize') {
    let nx = dragStartValX
    let ny = dragStartValY
    let nw = dragStartW
    let nh = dragStartH

    const d = resizeDir
    if (d.includes('e')) nw = Math.max(CROP_BOX_MIN, Math.min(CROP_BOX_MAX, dragStartW + dx))
    if (d.includes('w')) {
      nw = Math.max(CROP_BOX_MIN, Math.min(CROP_BOX_MAX, dragStartW - dx))
      nx = dragStartValX + dragStartW - nw
    }
    if (d.includes('s')) nh = Math.max(CROP_BOX_MIN, Math.min(CROP_BOX_MAX, dragStartH + dy))
    if (d.includes('n')) {
      nh = Math.max(CROP_BOX_MIN, Math.min(CROP_BOX_MAX, dragStartH - dy))
      ny = dragStartValY + dragStartH - nh
    }

    const size = Math.max(nw, nh)
    if (size !== cropBoxSize.value) {
      cropBoxSize.value = size
      if (nw < size) nx -= (size - nw) / 2
      if (nh < size) ny -= (size - nh) / 2
    }

    const [cx, cy] = clampCropBox(nx, ny, size)
    cropBoxPos.value = { x: cx, y: cy }
  }
}

const onGlobalUp = () => endDrag()
const onGlobalTouchEnd = () => endDrag()

const endDrag = () => {
  dragTarget.value = null
  document.removeEventListener('mousemove', onGlobalMove)
  document.removeEventListener('mouseup', onGlobalUp)
  document.removeEventListener('touchmove', onGlobalTouchMove)
  document.removeEventListener('touchend', onGlobalTouchEnd)
}

const onResizeStart = (e: MouseEvent, dir: string) => {
  startResize(dir, e.clientX, e.clientY)
}

const onResizeTouchStart = (e: TouchEvent, dir: string) => {
  if (e.touches.length === 1) startResize(dir, e.touches[0].clientX, e.touches[0].clientY)
}

const startResize = (dir: string, clientX: number, clientY: number) => {
  dragTarget.value = 'resize'
  resizeDir = dir
  dragStartX = clientX
  dragStartY = clientY
  dragStartValX = cropBoxPos.value.x
  dragStartValY = cropBoxPos.value.y
  dragStartW = cropBoxSize.value
  dragStartH = cropBoxSize.value
  document.addEventListener('mousemove', onGlobalMove)
  document.addEventListener('mouseup', onGlobalUp)
  document.addEventListener('touchmove', onGlobalTouchMove, { passive: false })
  document.addEventListener('touchend', onGlobalTouchEnd)
}

const onWheel = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, imageState.value.scale + delta))

  if (cropContainerRef.value && newScale !== imageState.value.scale) {
    const rect = cropContainerRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const ratio = newScale / imageState.value.scale
    const newX = mouseX - (mouseX - imageState.value.x) * ratio
    const newY = mouseY - (mouseY - imageState.value.y) * ratio

    const [, clampedX, clampedY] = clampImage(newScale, newX, newY)
    imageState.value = { ...imageState.value, scale: newScale, x: clampedX, y: clampedY }
  }
}

watch(previewUrl, () => resetState())

const createCroppedBlob = (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!previewUrl.value) {
      reject(new Error('No image'))
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const outputSize = cropBoxSize.value
      canvas.width = outputSize
      canvas.height = outputSize
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }

      const s = imageState.value
      const cb = cropBoxPos.value
      const boxS = cropBoxSize.value

      const sx = (cb.x - s.x) / s.scale
      const sy = (cb.y - s.y) / s.scale
      const sw = boxS / s.scale
      const sh = boxS / s.scale

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputSize, outputSize)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        },
        'image/png',
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = previewUrl.value
  })
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
