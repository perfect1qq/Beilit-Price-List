<template>
  <AsyncDialog ref="dialogRef" :model-value="visible" @update:model-value="$emit('update:modelValue', $event)"
    :title="title" :width="width" :append-to-body="appendToBody" @open="handleOpen">
    <el-form ref="formRef" :model="formData" :rules="rules" :label-width="labelWidth" :label-position="labelPosition"
      :disabled="loading" v-bind="$attrs">
      <slot />
    </el-form>

    <template #footer="{ loading }">
      <slot name="footer" :loading="loading" :validate="handleValidate" :submit="handleSubmit">
        <el-button :disabled="loading" @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ submitText }}
        </el-button>
      </slot>
    </template>
  </AsyncDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { PropType } from 'vue'
import type { FormInstance } from 'element-plus'
import AsyncDialog from './AsyncDialog.vue'
import type { FormRules } from '@/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '表单'
  },
  width: {
    type: [String, Number],
    default: '500px'
  },
  labelWidth: {
    type: String,
    default: '100px'
  },
  labelPosition: {
    type: String,
    default: 'right',
    validator: (val: unknown) => ['left', 'right', 'top'].includes(val as string)
  },
  appendToBody: {
    type: Boolean,
    default: false
  },
  submitText: {
    type: String,
    default: '确定'
  },
  formData: {
    type: Object as PropType<Record<string, unknown>>,
    required: true
  },
  rules: {
    type: Object as PropType<FormRules>,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'open', 'submit', 'cancel', 'validate-success', 'validate-error'])

const visible = ref(false)
const dialogRef = ref<InstanceType<typeof AsyncDialog> | null>(null)
const formRef = ref<FormInstance | null>(null)

const loading = ref(false)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleCancel = () => {
  formRef.value?.resetFields()
  emit('cancel')
  visible.value = false
}

const handleOpen = async () => {
  emit('open')
  await nextTick()
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleValidate = async () => {
  if (!formRef.value) return false

  try {
    await formRef.value.validate()
    emit('validate-success')
    return true
  } catch (error) {
    emit('validate-error', error)
    return false
  }
}

const handleSubmit = async () => {
  const isValid = await handleValidate()
  if (!isValid) return false

  const result = await dialogRef.value?.load(async () => {
    emit('submit', props.formData)
    return props.formData
  })
  return result
}

defineExpose({
  loading,
  formData: props.formData,
  validate: handleValidate,
  submit: handleSubmit,
  resetFields: () => formRef.value?.resetFields(),
  clearValidate: () => formRef.value?.clearValidate()
})
</script>
