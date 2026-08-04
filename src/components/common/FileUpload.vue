<template>
  <el-upload
    class="upload-demo"
    drag
    :action="uploadUrl"
    :with-credentials="true"
    v-model:file-list="innerFileList"
    :headers="uploadHeaders"
    :on-success="handleUploadSuccess"
    :on-error="handleUploadError"
    :on-remove="handleRemoveFile"
    :multiple="multiple"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      将文件拖到此处，或 <em>点击上传</em>
    </div>
  </el-upload>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
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
  // 简单比对，避免触发死循环
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
  if (file.response?.data?.url || file.url) {
    try {
      await request.delete('/api/upload/file', { data: { url: file.response?.data?.url || file.url } })
    } catch (e) {
      console.warn('删除物理文件失败', e)
    }
  }
}
</script>
