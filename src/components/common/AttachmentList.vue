<template>
  <div v-if="files.length" class="attachment-list">
    <div v-for="(file, index) in files" :key="file.url || index" class="attachment-item">
      <el-icon class="attachment-icon"><Document /></el-icon>
      <el-link type="primary" :underline="false" @click.prevent="handleDownload(file)">
        {{ file.name || '未命名附件' }}
      </el-link>
    </div>
  </div>
  <span v-else class="attachment-empty">{{ emptyText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Document } from '@element-plus/icons-vue'
import downloadFile from '@/utils/downloadFile'

interface AttachmentFile {
  url: string
  name?: string
}

const props = withDefaults(defineProps<{
  /** 后端返回的附件字段，可能是 JSON 字符串、数组或对象 */
  raw?: string | AttachmentFile[] | null
  /** 无附件时的占位文案 */
  emptyText?: string
}>(), {
  raw: '',
  emptyText: '无',
})

const files = computed<AttachmentFile[]>(() => {
  if (!props.raw) return []
  if (Array.isArray(props.raw)) return props.raw as AttachmentFile[]
  try {
    const parsed = JSON.parse(props.raw as string)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

const handleDownload = (file: AttachmentFile) => {
  downloadFile({ url: file.url, name: file.name })
}
</script>

<style scoped>
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.attachment-icon {
  color: #909399;
  flex-shrink: 0;
}

.attachment-empty {
  color: #999;
}
</style>
