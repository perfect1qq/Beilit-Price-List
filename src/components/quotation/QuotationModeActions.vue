<template>
  <el-button v-if="isEditing && !isViewMode" type="warning" @click="$emit('reset')">新建空白单</el-button>
  <el-button v-if="isViewMode" type="info" :icon="Edit" @click="$emit('switch-edit')">编辑当前记录</el-button>
</template>

<script setup>
import { Edit } from '@element-plus/icons-vue'

defineProps({
  isEditing: { type: Boolean, default: false },
  isViewMode: { type: Boolean, default: false }
})

defineEmits(['reset', 'switch-edit'])
</script>
