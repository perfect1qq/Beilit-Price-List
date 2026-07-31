<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑复购项目' : '新增复购项目'"
    width="540px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      :model="localData"
      :rules="rules"
      label-width="110px"
      @submit.prevent
    >
      <el-form-item label="项目名称" prop="orderName">
        <el-input
          v-model="localData.orderName"
          placeholder="例如：首次合作项目、第2期复购项目等"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="成交金额(元)" prop="orderAmount">
        <el-input
          v-model="localData.orderAmount"
          placeholder="选填，记录该项目合同/成交价"
          type="number"
        />
      </el-form-item>

      <el-form-item label="下单状态" prop="orderStatus">
        <el-radio-group v-model="localData.orderStatus">
          <el-radio label="已下单">已下单</el-radio>
          <el-radio label="未下单">未下单</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="结款状态" prop="paymentStatus">
        <el-radio-group v-model="localData.paymentStatus">
          <el-radio label="待催款">待催款</el-radio>
          <el-radio label="已结款">已结款</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="安装状态" prop="installationStatus">
        <el-radio-group
          v-model="localData.installationStatus"
          :disabled="localData.orderStatus !== '已下单'"
        >
          <el-radio label="待安装">待安装</el-radio>
          <el-radio label="已安装">已安装</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="实际工期" prop="deliveryDays">
        <el-input
          v-model.number="localData.deliveryDays"
          placeholder="对客户承诺的交期，例如 15"
          type="number"
          min="0"
        >
          <template #append>天</template>
        </el-input>
      </el-form-item>

      <el-form-item label="车间工期" prop="workshopDeliveryDays">
        <el-input
          v-model.number="localData.workshopDeliveryDays"
          placeholder="给到工厂车间的工期，例如 12"
          type="number"
          min="0"
        >
          <template #append>天</template>
        </el-input>
      </el-form-item>

      <el-form-item label="项目备注" prop="remark">
        <el-input
          v-model="localData.remark"
          type="textarea"
          :rows="3"
          placeholder="选填，记录特殊生产或安装要求"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CustomerOrderData, CustomerOrderCreatePayload, CustomerOrderUpdatePayload } from '@/types'

const props = defineProps<{
  modelValue: boolean
  customerId: number
  orderData?: CustomerOrderData | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: { isEdit: boolean; data: CustomerOrderCreatePayload | CustomerOrderUpdatePayload; orderId?: number }): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const isEdit = computed(() => !!props.orderData && !!props.orderData.id)

const localData = reactive({
  orderName: '复购项目',
  orderAmount: '' as string | number | null,
  orderStatus: '已下单',
  paymentStatus: '待催款',
  installationStatus: '待安装',
  deliveryDays: null as number | null,
  workshopDeliveryDays: null as number | null,
  remark: '',
})

const rules: FormRules = {
  orderName: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
  ],
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.orderData) {
        localData.orderName = props.orderData.orderName || '复购项目'
        localData.orderAmount = props.orderData.orderAmount ?? ''
        localData.orderStatus = props.orderData.orderStatus || '已下单'
        localData.paymentStatus = (props.orderData.paymentStatus && props.orderData.paymentStatus !== '未有款项') ? props.orderData.paymentStatus : '待催款'
        localData.installationStatus = props.orderData.installationStatus || '待安装'
        localData.deliveryDays = props.orderData.deliveryDays ?? null
        localData.workshopDeliveryDays = props.orderData.workshopDeliveryDays ?? null
        localData.remark = props.orderData.remark || ''
      } else {
        localData.orderName = '复购项目'
        localData.orderAmount = ''
        localData.orderStatus = '已下单'
        localData.paymentStatus = '待催款'
        localData.installationStatus = '待安装'
        localData.deliveryDays = null
        localData.workshopDeliveryDays = null
        localData.remark = ''
      }
    }
  },
  { immediate: true },
)

watch(
  () => localData.orderStatus,
  (newVal) => {
    if (newVal !== '已下单') {
      localData.installationStatus = '待安装'
    }
  },
)

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    // 校验失败：Element Plus 已自动显示字段级错误，无需额外提示
    return
  }

  const payload: CustomerOrderCreatePayload | CustomerOrderUpdatePayload = {
    orderName: localData.orderName.trim(),
    orderAmount: localData.orderAmount === '' || localData.orderAmount === null ? null : Number(localData.orderAmount),
    orderStatus: localData.orderStatus,
    paymentStatus: localData.paymentStatus,
    installationStatus: localData.installationStatus,
    // 工期清空（''、null、undefined、负数、0）一律存 null，避免误存 0 天
    deliveryDays: (localData.deliveryDays === null || localData.deliveryDays === undefined || localData.deliveryDays === '' || Number(localData.deliveryDays) <= 0) ? null : Number(localData.deliveryDays),
    workshopDeliveryDays: (localData.workshopDeliveryDays === null || localData.workshopDeliveryDays === undefined || localData.workshopDeliveryDays === '' || Number(localData.workshopDeliveryDays) <= 0) ? null : Number(localData.workshopDeliveryDays),
    remark: localData.remark.trim(),
  }

  emit('submit', {
    isEdit: isEdit.value,
    data: payload,
    orderId: props.orderData?.id,
  })
}

defineExpose({
  setSubmitting: (val: boolean) => {
    submitting.value = val
  },
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
