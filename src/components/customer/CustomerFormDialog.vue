<template>
  <FormDialog ref="formDialogRef" :model-value="visible" @update:model-value="$emit('update:modelValue', $event)"
    :title="title" :width="500" :form-data="localData" :rules="formRules" label-width="100px"
    @submit="$emit('submit', $event)">
    <el-form-item label="公司名称" prop="companyName">
      <el-input v-model="localData.companyName" placeholder="请输入公司名称" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="客户姓名" prop="customerName">
      <el-input v-model="localData.customerName" placeholder="请输入客户姓名" maxlength="50" show-word-limit />
    </el-form-item>
    <el-form-item label="联系方式" prop="contactInfo">
      <el-input v-model="localData.contactInfo" placeholder="请输入联系方式（电话、微信等）" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="合作状态" prop="cooperationStatus">
      <el-select v-model="localData.cooperationStatus" placeholder="选择合作状态" style="width: 100%">
        <el-option label="未合作" value="未合作" />
        <el-option label="已合作" value="已合作" />
      </el-select>
    </el-form-item>
    <el-form-item label="客户类型" prop="customerType">
      <el-select v-model="localData.customerType" placeholder="选择客户类型" style="width: 100%">
        <el-option label="终端" value="终端" />
        <el-option label="经销商" value="经销商" />
        <el-option label="待确认" value="待确认" />
      </el-select>
    </el-form-item>
    <el-form-item label="结款状态" prop="paymentStatus">
      <el-select v-model="localData.paymentStatus" placeholder="选择结款状态" style="width: 100%"
        :disabled="localData.cooperationStatus === '未合作'">
        <el-option label="未有款项" value="未有款项" />
        <el-option label="待催款" value="待催款" />
        <el-option label="已结款" value="已结款" />
      </el-select>
    </el-form-item>
    <el-form-item label="下单状态" prop="orderStatus">
      <el-select v-model="localData.orderStatus" placeholder="选择下单状态" style="width: 100%"
        :disabled="localData.cooperationStatus !== '已合作'">
        <el-option label="未下单" value="未下单" />
        <el-option label="已下单" value="已下单" />
      </el-select>
    </el-form-item>
    <el-form-item label="工期" prop="deliveryDays">
      <div class="delivery-input-row">
        <el-input-number v-model="localData.deliveryDays" :min="1" :max="365" controls-position="right" placeholder="天数"
          style="width: 140px" />
        <span class="delivery-unit">天</span>
        <span v-if="localData.deliveryDays && localData.deliveryDays > 0" class="delivery-preview">
          → 预计完成：{{ getDeliveryDate(localData.deliveryDays) }}
        </span>
      </div>
    </el-form-item>
    <el-form-item label="货架类型" prop="shelfType">
      <el-input v-model="localData.shelfType" placeholder="请输入货架类型" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="备注" prop="remark">
      <el-input v-model="localData.remark" type="textarea" :rows="3" placeholder="请输入备注信息（可选）" maxlength="500"
        show-word-limit />
    </el-form-item>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { PropType } from 'vue'
import FormDialog from '@/components/common/FormDialog.vue'
import { createRequiredRule, createMaxLengthRule, noSpaceValidator } from '@/utils/formRules'
import { addDays, formatDate } from '@/utils/date'
import type { CustomerCreatePayload, CustomerUpdatePayload } from '@/types'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  formData: { type: Object as PropType<CustomerCreatePayload & CustomerUpdatePayload>, required: true },
  isEdit: { type: Boolean, default: false },
  deliveryStartDate: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const INITIAL_LOCAL: CustomerCreatePayload & CustomerUpdatePayload = {
  companyName: '',
  customerName: '',
  contactInfo: '',
  cooperationStatus: '未合作',
  customerType: '终端',
  deliveryDays: null,
  shelfType: '',
  remark: '',
  paymentStatus: '未有款项',
  orderStatus: '未下单'
}

const localData = reactive<CustomerCreatePayload & CustomerUpdatePayload>({ ...INITIAL_LOCAL })

watch(() => props.formData, (newVal) => {
  Object.assign(localData, newVal)
}, { deep: true })

watch(() => localData.cooperationStatus, (val) => {
  if (val === '未合作') {
    localData.paymentStatus = '未有款项'
  }
  if (val !== '已合作') {
    localData.orderStatus = '未下单'
  }
})

watch(visible, (val) => {
  if (!val) {
    Object.assign(localData, INITIAL_LOCAL)
  }
})

const title = computed(() => props.isEdit ? '编辑客户' : '新增客户')

const formRules = {
  companyName: [
    createRequiredRule('公司名称'),
    createMaxLengthRule(100, '公司名称'),
    noSpaceValidator('公司名称')
  ],
  customerName: [
    createRequiredRule('客户姓名'),
    createMaxLengthRule(50, '客户姓名'),
    noSpaceValidator('客户姓名')
  ],
  contactInfo: [
    createMaxLengthRule(100, '联系方式')
  ]
}

const getDeliveryDate = (days: number): string => {
  if (!days || days <= 0) return ''
  // 编辑时从 deliveryStartDate 算，新增时从当天算
  const fromDate = props.isEdit && props.deliveryStartDate ? new Date(props.deliveryStartDate) : new Date()
  const endDate = addDays(days, fromDate)
  return formatDate(endDate)
}
</script>

<style scoped>
.delivery-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delivery-unit {
  color: #606266;
  font-size: 14px;
}

.delivery-preview {
  color: #e6a23c;
  font-size: 13px;
  font-weight: 600;
}
</style>
