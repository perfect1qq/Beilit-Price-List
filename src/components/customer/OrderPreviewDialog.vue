<template>
  <el-dialog
    v-model="visible"
    :title="`车间下单详情 - ${detail?.name || detail?.customerName || ''}`"
    width="920px"
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <div v-loading="loading" style="min-height: 180px;">
      <template v-if="detail">
        <!-- 基础信息概要 -->
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="下单名称">
            <b>{{ detail.name || '-' }}</b>
          </el-descriptions-item>
          <el-descriptions-item label="客户公司">
            {{ detail.customerName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="业务员">
            {{ detail.ownerName || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="联系人">
            {{ detail.contactPerson || '-' }}
            <span v-if="detail.phone" style="color: #909399; margin-left: 4px;">({{ detail.phone }})</span>
          </el-descriptions-item>
          <el-descriptions-item label="下单日期">
            {{ detail.orderDate || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="交货工期">
            <span style="color: #e6a23c; font-weight: bold;">{{ detail.deliveryDays || '协商确定' }}</span>
            <span v-if="calculatedDeliveryDate" style="color: #909399; font-size: 12px; margin-left: 6px;">
              (预计交货：{{ calculatedDeliveryDate }})
            </span>
          </el-descriptions-item>

          <el-descriptions-item label="交货地址" :span="3">
            {{ detail.deliveryAddress || '-' }}
          </el-descriptions-item>

          <el-descriptions-item v-if="detail.remark" label="备注条款" :span="3">
            {{ detail.remark }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 车间生产产品明细表格 -->
        <div class="table-section-title">产品生产明细</div>
        <el-table
          :data="orderItems"
          border
          stripe
          size="small"
          style="width: 100%; max-height: 380px; overflow-y: auto;"
        >
          <el-table-column type="index" label="序号" width="55" align="center" />
          <AutoFitColumn :data="orderItems" prop="name" label="品名" :min="140" :max="260" align="left" show-overflow-tooltip>
            <template #default="{ row }">
              <b>{{ row.name || '-' }}</b>
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="orderItems" prop="spec" label="规格型号" :min="160" :max="300" align="left" show-overflow-tooltip />
          <AutoFitColumn :data="orderItems" prop="qty" label="数量" :min="80" :max="120" align="center">
            <template #default="{ row }">
              <span style="font-weight: 600; color: #409eff;">{{ row.qty || '-' }}</span>
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="orderItems" prop="material" label="用料" :min="110" :max="200" align="left" show-overflow-tooltip />
          <AutoFitColumn :data="orderItems" prop="color" label="颜色" :min="80" :max="120" align="center" />
          <AutoFitColumn :data="orderItems" prop="other" label="备注" :min="110" :max="240" align="left" show-overflow-tooltip />
        </el-table>

        <!-- 配套配件明细 -->
        <div v-if="orderAccessories.length > 0" class="accessories-card">
          <div class="sub-block-title">【配套配件明细】</div>
          <div class="accessories-grid">
            <div v-for="(acc, index) in orderAccessories" :key="index" class="accessory-badge">
              <span class="acc-idx">{{ index + 1 }}.</span>
              <span class="acc-name">{{ acc.name }}</span>
              <span class="acc-sep">=</span>
              <span class="acc-qty">{{ acc.qty }}</span>
            </div>
          </div>
        </div>

        <!-- 附件材料 -->
        <div v-if="hasAttachments" class="attachments-card">
          <div class="sub-block-title">【附件材料】</div>
          <AttachmentList :raw="detail.attachments" empty-text="暂无附件" />
        </div>
      </template>
    </div>

    <template #footer>
      <FormButtons
        cancel-text="关闭"
        submit-text="前往下单完整页面"
        submit-type="primary"
        @cancel="visible = false"
        @submit="goToOrderPage"
      />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import orderApi, { type OrderItem, type AccessoryItem } from '@/api/order'
import AutoFitColumn from '@/components/common/AutoFitColumn.vue'
import FormButtons from '@/components/common/FormButtons.vue'
import AttachmentList from '@/components/common/AttachmentList.vue'
import { calculateDeliveryDate as calcDeliveryDate } from '@/utils/date'

const props = defineProps<{
  modelValue: boolean
  orderId?: number | string | null
  initialData?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'navigate', order: any): void
}>()

const router = useRouter()
const visible = ref(props.modelValue)
const loading = ref(false)
const detail = ref<any>(props.initialData || null)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    if (props.initialData) {
      detail.value = props.initialData
    }
    if (props.orderId) {
      loadDetail(props.orderId)
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.initialData, (val) => {
  if (val) {
    detail.value = val
  }
})

watch(() => props.orderId, (newId) => {
  if (visible.value && newId) {
    loadDetail(newId)
  }
})

const loadDetail = async (id: number | string) => {
  loading.value = true
  try {
    const res: any = await orderApi.getDetail(Number(id))
    if (res?.order) {
      detail.value = res.order
    } else if (res) {
      detail.value = res
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '获取车间下单详情失败')
  } finally {
    loading.value = false
  }
}

const calculatedDeliveryDate = computed(() => {
  return calcDeliveryDate(detail.value?.orderDate, detail.value?.deliveryDays)
})

const orderItems = computed<OrderItem[]>(() => {
  if (!detail.value?.items) return []
  const raw = detail.value.items
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return []
})

const orderAccessories = computed<AccessoryItem[]>(() => {
  if (!detail.value?.accessories) return []
  const raw = detail.value.accessories
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return []
})

const hasAttachments = computed(() => {
  if (!detail.value?.attachments) return false
  const raw = detail.value.attachments
  if (Array.isArray(raw)) return raw.length > 0
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0
    } catch {
      return raw.trim().length > 0
    }
  }
  return false
})

const handleClosed = () => {
  if (!props.initialData) {
    detail.value = null
  }
}

const goToOrderPage = () => {
  if (!detail.value?.id) return
  const current = detail.value
  visible.value = false
  emit('navigate', current)
  router.push({
    path: '/order',
    query: { id: current.id, mode: 'view' }
  })
}
</script>

<style scoped>
.table-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary, #409eff);
}

.sub-block-title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.accessories-card,
.attachments-card {
  margin-top: 14px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 14px;
}

.accessories-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.accessory-badge {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 13px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.acc-idx {
  color: #94a3b8;
  margin-right: 4px;
}

.acc-name {
  font-weight: 500;
  color: #1e293b;
}

.acc-sep {
  margin: 0 4px;
  color: #64748b;
}

.acc-qty {
  font-weight: bold;
  color: #2563eb;
}
</style>
