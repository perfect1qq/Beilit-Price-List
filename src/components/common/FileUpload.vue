<template>
  <div class="stunning-upload-container">
    <el-upload
      class="custom-dragger"
      drag
      :action="uploadUrl"
      :with-credentials="true"
      v-model:file-list="innerFileList"
      :show-file-list="false"
      :headers="uploadHeaders"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :multiple="multiple"
    >
      <div class="dragger-content">
        <div class="icon-blob">
          <!-- 自定义插画风格的云端图标 -->
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="cloud-icon">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="text-main">将文件拖拽至此区域</div>
        <div class="text-sub">支持各类文档、图片等格式，单文件最大 50MB</div>
        <el-button type="primary" round class="browse-btn" @click.stop>
          <el-icon class="el-icon--left"><FolderOpened /></el-icon>
          浏览本地文件
        </el-button>
      </div>
    </el-upload>

    <!-- 极美的自定义文件列表 -->
    <TransitionGroup name="list" tag="div" class="custom-file-list">
      <div v-for="file in innerFileList" :key="file.uid || file.url" class="file-card">
        <div class="file-icon" :class="getFileType(file.name)">
          <el-icon v-if="getFileType(file.name) === 'image'"><Picture /></el-icon>
          <el-icon v-else-if="getFileType(file.name) === 'pdf'"><DataLine /></el-icon>
          <el-icon v-else><Document /></el-icon>
        </div>
        
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span class="file-status" :class="{'success': file.status === 'success' || !file.status, 'uploading': file.status === 'uploading', 'error': file.status === 'fail'}">
              {{ (file.status === 'success' || !file.status) ? '已上传' : (file.status === 'uploading' ? '上传中...' : '上传失败') }}
            </span>
          </div>
        </div>

        <div class="file-actions">
          <el-button v-if="file.url || (file.response && file.response.data && file.response.data.url)" type="primary" link @click="previewOrDownload(file)">
            查看
          </el-button>
          <el-button type="danger" link @click="handleRemoveFile(file)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>

        <!-- 进度条背景 -->
        <div v-if="file.status === 'uploading'" class="upload-progress" :style="{ width: (file.percentage || 0) + '%' }"></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FolderOpened, Picture, Document, DataLine, Delete } from '@element-plus/icons-vue'
import { showError, showSuccess } from '@/utils/message'
import request from '@/utils/request'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const innerFileList = ref<any[]>([...props.modelValue])

watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(innerFileList.value)) {
    innerFileList.value = newVal
  }
}, { deep: true })

watch(innerFileList, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

const uploadUrl = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '') + '/api/upload/file'
// @ts-ignore
const token = JSON.parse(localStorage.getItem('AUTH_STORE') || '{}')?.token || ''
const uploadHeaders = {
  Authorization: token ? `Bearer ${token}` : ''
}

const getFileType = (name: string) => {
  if (!name) return 'unknown'
  const ext = name.split('.').pop()?.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image'
  if (['pdf'].includes(ext || '')) return 'pdf'
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) return 'document'
  return 'unknown'
}

const handleUploadSuccess = (res: any, file: any, fileList: any[]) => {
  if ((res.success || res.code === 200 || res.code === 'OK') && res.data?.url) {
    showSuccess('文件上传成功')
  } else {
    showError(new Error(res.message || '上传失败'), '文件上传失败')
    const index = fileList.findIndex(f => f.uid === file.uid)
    if (index !== -1) {
      fileList.splice(index, 1)
    }
  }
}

const handleUploadError = (err: any, file: any, fileList: any[]) => {
  showError(err, '文件上传失败')
  const index = fileList.findIndex(f => f.uid === file.uid)
  if (index !== -1) {
    fileList.splice(index, 1)
  }
}

const handleRemoveFile = async (file: any) => {
  // 前端列表中移除
  const index = innerFileList.value.findIndex(f => f.uid === file.uid || f === file)
  if (index !== -1) {
    innerFileList.value.splice(index, 1)
  }
  
  const url = file.response?.data?.url || file.url
  if (url) {
    try {
      await request.delete('/api/upload/file', { data: { url } })
    } catch (e) {
      console.warn('删除物理文件失败', e)
    }
  }
}

const previewOrDownload = (file: any) => {
  const url = file.response?.data?.url || file.url
  if (!url) return
  const fullUrl = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '') + `/api/upload/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(file.name)}`
  window.open(fullUrl, '_blank')
}
</script>

<style scoped>
.stunning-upload-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 自定义拖拽区 */
.custom-dragger :deep(.el-upload-dragger) {
  padding: 0;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.custom-dragger :deep(.el-upload-dragger:hover),
.custom-dragger :deep(.el-upload-dragger.is-dragover) {
  border-color: #6366f1; /* Indigo-500 */
  background: #eef2ff; /* Indigo-50 */
}

.dragger-content {
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon-blob {
  width: 80px;
  height: 80px;
  background: #e0e7ff; /* Indigo-100 */
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: #4f46e5; /* Indigo-600 */
  transition: all 0.5s ease;
  animation: morph 8s ease-in-out infinite;
}

.custom-dragger :deep(.el-upload-dragger:hover) .icon-blob {
  background: #4f46e5;
  color: white;
  transform: scale(1.1);
}

.cloud-icon {
  width: 40px;
  height: 40px;
}

.text-main {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.text-sub {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 24px;
}

.browse-btn {
  pointer-events: none; /* 让按钮看起来可以点，但实际点击事件由el-upload接管 */
  padding: 10px 24px;
  font-weight: 600;
  background-color: #4f46e5;
  border-color: #4f46e5;
  transition: all 0.3s ease;
}

.custom-dragger :deep(.el-upload-dragger:hover) .browse-btn {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

@keyframes morph {
  0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
  67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
}

/* 自定义文件列表 */
.custom-file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.file-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.file-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
  flex-shrink: 0;
  z-index: 1;
}

.file-icon.image { background: #fce7f3; color: #ec4899; }
.file-icon.pdf { background: #fee2e2; color: #ef4444; }
.file-icon.document { background: #e0f2fe; color: #0ea5e9; }
.file-icon.unknown { background: #f1f5f9; color: #64748b; }

.file-info {
  flex-grow: 1;
  min-width: 0;
  z-index: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 12px;
}

.file-status {
  font-weight: 500;
}
.file-status.success { color: #10b981; }
.file-status.uploading { color: #6366f1; }
.file-status.error { color: #ef4444; }

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 1;
}

.file-card:hover .file-actions {
  opacity: 1;
}

.upload-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(99, 102, 241, 0.08); /* 极浅的底色作为进度条 */
  transition: width 0.3s linear;
  z-index: 0;
}

/* 动画效果 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
