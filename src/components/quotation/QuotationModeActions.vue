<template>
  <AppButton v-if="isEditing && !isViewMode" variant="add" label="新建空白单" @click="$emit('reset')" />
  <AppButton v-if="isViewMode" variant="edit" label="编辑当前记录" @click="$emit('switch-edit')" />
</template>

<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'

defineProps({
  isEditing: { type: Boolean, default: false },
  isViewMode: { type: Boolean, default: false }
})

defineEmits(['reset', 'switch-edit'])
</script>
