<template>
  <el-drawer
    v-model="visible"
    :title="title"
    size="500px"
    append-to-body
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="localData"
      :rules="formRules"
      label-width="100px"
      :disabled="loading"
    >
      <el-form-item label="公司名称" prop="companyName">
        <el-input
          v-model="localData.companyName"
          placeholder="请输入公司名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input
          v-model="localData.customerName"
          placeholder="请输入客户姓名"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="联系方式" prop="contactInfo">
        <el-input
          v-model="localData.contactInfo"
          placeholder="请输入联系方式（电话、微信等）"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <!-- 合作状态 -->
      <el-form-item label="合作状态" prop="cooperationStatus">
        <el-select
          v-model="localData.cooperationStatus"
          placeholder="选择合作状态"
          style="width: 100%"
          @change="handleCooperationStatusChange"
        >
          <el-option label="未合作" value="未合作" />
          <el-option label="已合作" value="已合作" />
        </el-select>
        <span v-if="autoCooperationReason" style="font-size: 12px; color: #909399; margin-top: 4px; display: block;">
          💡 依据参考：名下已有 {{ autoCooperationReason }}（可手动自选）
        </span>
      </el-form-item>

      <el-form-item label="客户类型" prop="customerType">
        <el-select
          v-model="localData.customerType"
          placeholder="选择客户类型"
          style="width: 100%"
        >
          <el-option label="终端" value="终端" />
          <el-option label="经销商" value="经销商" />
          <el-option label="待确认" value="待确认" />
        </el-select>
      </el-form-item>

      <!-- 结款状态 -->
      <el-form-item label="结款状态" prop="paymentStatus">
        <el-select
          v-model="localData.paymentStatus"
          placeholder="选择结款状态"
          style="width: 100%"
          @change="handlePaymentStatusChange"
        >
          <el-option label="未有款项" value="未有款项" />
          <el-option label="待催款" value="待催款" />
          <el-option label="已结款" value="已结款" />
        </el-select>
        <span v-if="autoPaymentDescription && autoPaymentDescription !== '未有款项'" style="font-size: 12px; color: #909399; margin-top: 4px; display: block;">
          💡 账目参考：{{ autoPaymentDescription }}（可手动自选）
        </span>
      </el-form-item>

      <!-- 下单状态：待排产 / 已下单 -->
      <el-form-item label="下单与复购" prop="orderStatus">
        <el-select
          v-model="localData.orderStatus"
          placeholder="选择状态"
          style="width: 100%"
          @change="handleOrderStatusChange"
        >
          <el-option label="待排产" value="待排产" />
          <el-option label="已下单" value="已下单" />
        </el-select>
        <span v-if="autoOrderDescription" style="font-size: 12px; color: #909399; margin-top: 4px; display: block;">
          💡 订单参考：{{ autoOrderDescription }}（可手动自选）
        </span>
      </el-form-item>

      <el-form-item label="货架类型" prop="shelfType">
        <el-input
          v-model="localData.shelfType"
          placeholder="请输入货架类型"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="优惠点" prop="discountPoints">
        <el-input
          v-model="localData.discountPoints"
          placeholder="请输入优惠点（例如：5个点或9折等）"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="localData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息（可选）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

    </el-form>
    
    <template #footer>
      <FormButtons submit-text="确定" :loading="loading" @cancel="visible = false" @submit="handleSubmit" />
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from "vue";
import type { PropType } from "vue";
import type { FormInstance } from "element-plus";
import FormButtons from "@/components/common/FormButtons.vue";
import {
  createRequiredRule,
  createMaxLengthRule,
} from "@/utils/formRules";
import { addDays, formatDate } from "@/utils/date";
import type { CustomerCreatePayload, CustomerUpdatePayload } from "@/types";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  formData: {
    type: Object as PropType<CustomerCreatePayload & CustomerUpdatePayload>,
    required: true,
  },
  isEdit: { type: Boolean, default: false },
  deliveryStartDate: { type: String, default: "" },
  workshopDeliveryStartDate: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const formRef = ref<FormInstance>();
const loading = ref(false);

const INITIAL_LOCAL: CustomerCreatePayload & CustomerUpdatePayload = {
  companyName: "",
  customerName: "",
  contactInfo: "",
  cooperationStatus: "未合作",
  customerType: "终端",
  deliveryDays: null,
  workshopDeliveryDays: null,
  shelfType: "",
  discountPoints: "",
  remark: "",
  paymentStatus: "未有款项",
  orderStatus: "待排产",
  installationStatus: "待安装",
};

const localData = reactive<CustomerCreatePayload & CustomerUpdatePayload>({
  ...INITIAL_LOCAL,
});

// ---- 智能自动推导逻辑（根据合同与复购订单） ----
const isAutoCooperated = computed(() => {
  const c = props.formData as any;
  return (c?.contractCount || 0) > 0 || (c?.orderCount || 0) > 0 || (Number(c?.totalAmount) || 0) > 0;
});

const autoCooperationReason = computed(() => {
  const c = props.formData as any;
  const reasons: string[] = [];
  if ((c?.contractCount || 0) > 0) reasons.push(`${c.contractCount}份合同`);
  if ((c?.orderCount || 0) > 0) reasons.push(`${c.orderCount}笔订单`);
  if ((Number(c?.totalAmount) || 0) > 0) reasons.push(`成交额¥${c.totalAmount}`);
  return reasons.join('、');
});

const autoOrderDescription = computed(() => {
  const c = props.formData as any;
  const count = c?.orderCount || 0;
  if (count > 1) return `🔥 复购客户 (累计已下 ${count} 笔订单)`;
  if (count === 1) return `📦 首次合作客户 (已下 1 笔订单)`;
  return `⚪ 车间待排产`;
});

const autoPaymentDescription = computed(() => {
  const c = props.formData as any;
  const total = Number(c?.totalAmount) || 0;
  const paid = Number(c?.totalPaidAmount) || 0;
  const arrears = Math.max(0, total - paid);
  if (total <= 0) return '未有款项';
  if (arrears > 0) return `待催款 (累计总欠款 ¥${arrears.toLocaleString()})`;
  return '已结清 (所有款项已全部回笼)';
});

// ---- 人为控制大于智能匹配的交互联动函数 ----
// 1. 手动修改合作状态联动
const handleCooperationStatusChange = (val: string) => {
  if (val === "未合作") {
    // 客户未合作，联动重置款项为未有款项，下单为待排产
    localData.paymentStatus = "未有款项";
    localData.orderStatus = "待排产";
  } else if (val === "已合作") {
    // 刚转为已合作，若原状态为未有款项，智能预填为待催款（用户可再自行修改）
    if (localData.paymentStatus === "未有款项") {
      localData.paymentStatus = "待催款";
    }
  }
};

// 2. 手动修改结款状态联动
const handlePaymentStatusChange = (val: string) => {
  if (val === "待催款" || val === "已结款") {
    // 产生款项往来，代表必然已合作
    localData.cooperationStatus = "已合作";
  }
};

// 3. 手动修改下单状态联动
const handleOrderStatusChange = (val: string) => {
  if (val === "已下单") {
    // 已下单客户，联动为已合作
    localData.cooperationStatus = "已合作";
    if (localData.paymentStatus === "未有款项") {
      localData.paymentStatus = "待催款";
    }
  }
};

watch(
  () => props.formData,
  (newVal) => {
    Object.assign(localData, newVal);
    if (!localData.orderStatus || localData.orderStatus === "未下单") {
      localData.orderStatus = "待排产";
    }
    // 人为控制大于智能匹配：编辑时完全以回填数据为准，不强行覆盖用户的手动设定
    if (!props.isEdit && isAutoCooperated.value) {
      localData.cooperationStatus = "已合作";
      if ((newVal as any)?.orderCount > 0) {
        localData.orderStatus = "已下单";
      }
    }
  },
  { deep: true }
);

watch(visible, (val) => {
  if (!val) {
    Object.assign(localData, INITIAL_LOCAL);
    loading.value = false;
  }
});

const handleClose = () => {
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch (_err) {
    // 校验失败：Element Plus 已自动显示字段级错误，无需额外提示
    return;
  }
  loading.value = true;
  emit("submit", {
    ...localData,
  });
};

// 由父组件完成异步操作后调用，关闭按钮 loading
defineExpose({
  resetLoading: () => { loading.value = false; },
});

const title = computed(() => (props.isEdit ? "编辑客户" : "新增客户"));

const formRules = {
  companyName: [createRequiredRule('公司名称'), createMaxLengthRule(50, '公司名称')],
  customerName: [createRequiredRule('客户姓名'), createMaxLengthRule(50, '客户姓名')],
  cooperationStatus: [createRequiredRule('合作状态')],
  customerType: [createRequiredRule('客户类型')]
};
</script>
