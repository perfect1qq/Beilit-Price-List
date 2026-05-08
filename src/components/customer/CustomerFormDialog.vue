<template>
  <FormDialog
    ref="formDialogRef"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="title"
    :width="500"
    :form-data="formData"
    :rules="formRules"
    label-width="100px"
    @submit="$emit('submit', $event)"
  >
    <el-form-item label="公司名称" prop="companyName">
      <el-input v-model="formData.companyName" placeholder="请输入公司名称" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="客户姓名" prop="customerName">
      <el-input v-model="formData.customerName" placeholder="请输入客户姓名" maxlength="50" show-word-limit />
    </el-form-item>
    <el-form-item label="联系方式" prop="contactInfo">
      <el-input v-model="formData.contactInfo" placeholder="请输入联系方式（电话、微信等）" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="合作状态" prop="cooperationStatus">
      <el-select v-model="formData.cooperationStatus" placeholder="选择合作状态" style="width: 100%">
        <el-option label="未合作" value="未合作" />
        <el-option label="已合作" value="已合作" />
      </el-select>
    </el-form-item>
    <el-form-item label="客户类型" prop="customerType">
      <el-select v-model="formData.customerType" placeholder="选择客户类型" style="width: 100%">
        <el-option label="终端" value="终端" />
        <el-option label="经销商" value="经销商" />
        <el-option label="待确认" value="待确认" />
      </el-select>
    </el-form-item>
    <el-form-item label="备注" prop="remark">
      <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注信息（可选）" maxlength="500" show-word-limit />
    </el-form-item>
  </FormDialog>
</template>

<script setup>
import { computed } from 'vue'
import FormDialog from '@/components/common/FormDialog.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  formData: { type: Object, required: true },
  isEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const title = computed(() => props.isEdit ? '编辑客户' : '新增客户')

const formRules = {
  companyName: [
    { required: true, message: '请输入公司名称', trigger: 'blur' },
    { min: 2, message: '公司名称至少2个字符', trigger: 'blur' }
  ],
  customerName: [
    { required: true, message: '请输入客户姓名', trigger: 'blur' },
    { min: 2, message: '客户姓名至少2个字符', trigger: 'blur' }
  ]
}
</script>
