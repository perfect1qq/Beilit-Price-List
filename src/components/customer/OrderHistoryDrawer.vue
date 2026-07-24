<template>
  <el-drawer
    :model-value="modelValue"
    :title="drawerTitle"
    direction="rtl"
    size="560px"
    destroy-on-close
    append-to-body
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="order-drawer">
      <div class="drawer-toolbar">
        <span class="record-count">
          共 <b>{{ orders.length }}</b> 条复购记录
        </span>
        <el-button v-if="canCreate && cooperationStatus === '已合作'" type="primary" size="small" :icon="Plus" @click="handleAdd">
          新增复购
        </el-button>
      </div>

      <div v-if="orders.length > 0" class="order-list">
        <div v-for="order in orders" :key="order.id" class="order-item">
          <div class="order-item-header">
            <span class="order-name">{{ order.orderName }}</span>
            <div class="order-tags">
              <el-tag size="small" :type="order.orderStatus === '已下单' ? 'success' : 'info'">
                {{ order.orderStatus }}
              </el-tag>
              <el-tag size="small" :type="order.paymentStatus === '已结款' ? 'success' : order.paymentStatus === '待催款' ? 'danger' : 'info'">
                {{ order.paymentStatus }}
              </el-tag>
              <el-tag size="small" :type="order.installationStatus === '已安装' ? 'success' : 'warning'">
                {{ order.installationStatus }}
              </el-tag>
            </div>
          </div>

          <div class="order-item-body">
            <div v-if="order.orderAmount != null" class="meta-row">
              <span class="meta-label">成交金额</span>
              <span class="meta-value amount">¥{{ order.orderAmount }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">实际工期</span>
              <span class="meta-value">
                <template v-if="order.deliveryDays && order.deliveryDays > 0">
                  {{ order.deliveryDays }}天
                  <span class="delivery-sub">（{{ getComputedDate(order.deliveryDays, order.deliveryStartDate, order.createdAt) }}）</span>
                </template>
                <template v-else>—</template>
              </span>
            </div>
            <div class="meta-row">
              <span class="meta-label">车间工期</span>
              <span class="meta-value">
                <template v-if="order.workshopDeliveryDays && order.workshopDeliveryDays > 0">
                  {{ order.workshopDeliveryDays }}天
                  <span class="delivery-sub">（{{ getComputedDate(order.workshopDeliveryDays, order.workshopDeliveryStartDate, order.createdAt) }}）</span>
                </template>
                <template v-else>—</template>
              </span>
            </div>
            <div v-if="order.remark" class="order-remark">{{ order.remark }}</div>
          </div>

          <div class="order-item-footer">
            <span class="footer-meta">操作人：{{ order.operatorName }}</span>
            <span class="footer-meta">{{ formatDate(order.createdAt) }}</span>
            <div v-if="!isGuest" class="footer-actions">
              <el-button type="primary" link size="small" @click="handleEdit(order)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(order)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无复购记录" :image-size="100" />
    </div>

    <OrderFormDialog
      ref="orderDialogRef"
      v-model="orderFormVisible"
      :customer-id="customerId"
      :order-data="currentOrder"
      @submit="handleOrderSubmit"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import OrderFormDialog from './OrderFormDialog.vue'
import customerApi from '@/api/customer'
import { formatDate, addDays } from '@/utils/date'
import type { CustomerOrderData, CustomerOrderCreatePayload, CustomerOrderUpdatePayload } from '@/types'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  customerId: { type: Number, default: 0 },
  customerName: { type: String, default: '' },
  cooperationStatus: { type: String, default: '' },
  orders: { type: Array as PropType<CustomerOrderData[]>, default: () => [] },
  canCreate: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'order-change'])

const orderFormVisible = ref(false)
const currentOrder = ref<CustomerOrderData | null>(null)
const orderDialogRef = ref<InstanceType<typeof OrderFormDialog> | null>(null)

const drawerTitle = computed(() => {
  const name = props.customerName || '客户'
  return `${name} · 复购记录`
})

const getComputedDate = (days: number | null, startDate: string | null, fallbackDate: string): string => {
  if (!days || days <= 0) return ''
  const from = startDate || fallbackDate || new Date()
  return formatDate(addDays(days, from))
}

const handleAdd = () => {
  currentOrder.value = null
  orderFormVisible.value = true
}

const handleEdit = (order: CustomerOrderData) => {
  currentOrder.value = order
  orderFormVisible.value = true
}

const handleDelete = async (order: CustomerOrderData) => {
  try {
    await ElMessageBox.confirm(`确定要删除复购项目“${order.orderName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await customerApi.deleteOrder(order.id)
    ElMessage.success('删除成功')
    emit('order-change')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleOrderSubmit = async (payload: { isEdit: boolean; data: CustomerOrderCreatePayload | CustomerOrderUpdatePayload; orderId?: number }) => {
  if (!props.customerId) return
  try {
    orderDialogRef.value?.setSubmitting(true)
    if (payload.isEdit && payload.orderId) {
      await customerApi.updateOrder(payload.orderId, payload.data as CustomerOrderUpdatePayload)
      ElMessage.success('复购项目更新成功')
    } else {
      await customerApi.addOrder(props.customerId, payload.data as CustomerOrderCreatePayload)
      ElMessage.success('复购项目添加成功')
    }
    orderFormVisible.value = false
    emit('order-change')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    orderDialogRef.value?.setSubmitting(false)
  }
}
</script>

<style scoped>
.order-drawer {
  padding: 0 4px;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.record-count {
  font-size: 13px;
  color: #64748b;
}

.record-count b {
  color: #3b82f6;
  font-size: 15px;
  margin: 0 2px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.order-item:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
}

.order-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.order-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.order-tags {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.order-item-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
}

.meta-label {
  color: #909399;
  min-width: 64px;
  flex-shrink: 0;
}

.meta-value {
  color: #303133;
  flex: 1;
}

.meta-value.amount {
  color: #ef4444;
  font-weight: 600;
}

.delivery-sub {
  color: #e6a23c;
  font-size: 12px;
  margin-left: 4px;
}

.order-remark {
  font-size: 13px;
  color: #606266;
  background-color: #f8f9fb;
  padding: 8px 10px;
  border-radius: 6px;
  margin-top: 4px;
  line-height: 1.5;
}

.order-item-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #a8abb2;
  border-top: 1px dashed #ebeef5;
  padding-top: 8px;
  margin-top: 8px;
}

.footer-meta {
  white-space: nowrap;
}

.footer-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
</style>
