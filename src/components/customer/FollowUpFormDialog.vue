<template>
  <FormDialog
    ref="followUpDialogRef"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="添加跟进记录"
    :width="500"
    :form-data="formData"
    :rules="formRules"
    label-width="100px"
    :append-to-body="true"
    @submit="$emit('submit', $event)"
  >
    <el-form-item label="跟进内容" prop="content">
      <el-input v-model="formData.content" type="textarea" :rows="4" placeholder="请输入跟进内容" maxlength="1000" show-word-limit />
    </el-form-item>
    <el-form-item label="下次跟进" prop="nextTime">
      <el-date-picker v-model="formData.nextTime" type="date" placeholder="选择下次跟进时间" format="YYYY-MM-DD"
        value-format="YYYY-MM-DD" style="width: 100%" />
    </el-form-item>
  </FormDialog>
</template>

<script setup>
import { computed } from 'vue'
import FormDialog from '@/components/common/FormDialog.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  formData: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRules = {
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
}
</script>
