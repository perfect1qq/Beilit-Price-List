<template>
  <el-form :model="form" label-width="100px">
    <el-form-item label="横梁名称">
      <el-input v-model="form.name" :disabled="readonly" />
    </el-form-item>

    <el-form-item label="长度(mm)">
      <el-input v-model="form.length" :disabled="readonly" />
    </el-form-item>

    <el-form-item label="规格(mm)">
      <el-input v-model="form.spec" :disabled="readonly" />
    </el-form-item>

    <el-form-item label="最大载重(kg)">
      <el-input v-model="form.maxLoad" :disabled="readonly" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  formData: Object,
  readonly: Boolean
})

const form = reactive({
  name: '',
  length: '',
  spec: '',
  maxLoad: ''
})

watch(() => props.formData, (val) => {
  if (val) Object.assign(form, val)
}, { immediate: true })

defineExpose({ form })
</script>