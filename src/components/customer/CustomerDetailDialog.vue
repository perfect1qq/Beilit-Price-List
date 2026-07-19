<template>
  <AsyncDialog ref="detailDialogRef" :model-value="visible" @update:model-value="$emit('update:modelValue', $event)"
    title="客户详情" width="800px" @open="$emit('open')">
    <div v-if="customer" class="detail-content">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="公司名称">{{ customer.companyName }}</el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ customer.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系方式">{{ customer.contactInfo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ customer.ownerName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="货架类型">{{ customer.shelfType || '—' }}</el-descriptions-item>
        <el-descriptions-item label="优惠点">{{ customer.discountPoints || '—' }}</el-descriptions-item>
        <el-descriptions-item label="结款状态">
          <el-tag :type="customer.paymentStatus === '已结款' ? 'success' : customer.paymentStatus === '待催款' ? 'danger' : 'info'" size="small">
            {{ customer.paymentStatus || '未有款项' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="实际工期">
          <template v-if="customer.deliveryDays && customer.deliveryDays > 0">
            {{ customer.deliveryDays }}天
            <span class="delivery-date-sub">（预计完成：{{ getComputedDate(customer.deliveryDays, customer.deliveryStartDate, customer.createdAt) }}）</span>
          </template>
          <template v-else>—</template>
        </el-descriptions-item>
        <el-descriptions-item label="车间工期">
          <template v-if="customer.workshopDeliveryDays && customer.workshopDeliveryDays > 0">
            {{ customer.workshopDeliveryDays }}天
            <span class="delivery-date-sub">（预计完成：{{ getComputedDate(customer.workshopDeliveryDays, customer.workshopDeliveryStartDate, customer.createdAt) }}）</span>
          </template>
          <template v-else>—</template>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ customer.remark || '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(customer.createdAt || '') }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(customer.updatedAt || '') }}</el-descriptions-item>
      </el-descriptions>

      <div class="orders-section">
        <div class="section-header">
          <span class="section-title">合作/复购项目记录 ({{ customer.orders?.length || 0 }})</span>
          <el-button v-if="canCreate" type="primary" size="small" :icon="Plus" @click="handleAddOrder">
            新增复购项目
          </el-button>
        </div>

        <div v-if="(customer.orders?.length ?? 0) > 0" class="orders-list">
          <el-card v-for="order in customer.orders" :key="order.id" shadow="hover" class="order-card">
            <div class="order-header">
              <span class="order-name">{{ order.orderName }}</span>
              <div class="order-tags">
                <el-tag size="small" :type="order.orderStatus === '已下单' ? 'success' : 'info'">{{ order.orderStatus }}</el-tag>
                <el-tag size="small" :type="order.paymentStatus === '已结款' ? 'success' : order.paymentStatus === '待催款' ? 'danger' : 'info'">{{ order.paymentStatus }}</el-tag>
                <el-tag size="small" :type="order.installationStatus === '已安装' ? 'success' : 'warning'">{{ order.installationStatus }}</el-tag>
              </div>
              <div v-if="!isGuest" class="order-actions">
                <el-button type="primary" link size="small" @click="handleEditOrder(order)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDeleteOrder(order)">删除</el-button>
              </div>
            </div>
            <div class="order-details">
              <span v-if="order.orderAmount != null" class="detail-item">
                <span class="detail-label">成交金额:</span> ¥{{ order.orderAmount }}
              </span>
              <span class="detail-item">
                <span class="detail-label">实际工期:</span>
                <template v-if="order.deliveryDays && order.deliveryDays > 0">
                  {{ order.deliveryDays }}天 <span class="delivery-date-sub">（预计完成：{{ getComputedDate(order.deliveryDays, order.deliveryStartDate, order.createdAt) }}）</span>
                </template>
                <template v-else>—</template>
              </span>
              <span class="detail-item">
                <span class="detail-label">车间工期:</span>
                <template v-if="order.workshopDeliveryDays && order.workshopDeliveryDays > 0">
                  {{ order.workshopDeliveryDays }}天 <span class="delivery-date-sub">（预计完成：{{ getComputedDate(order.workshopDeliveryDays, order.workshopDeliveryStartDate, order.createdAt) }}）</span>
                </template>
                <template v-else>—</template>
              </span>
            </div>
            <div v-if="order.remark" class="order-remark">
              备注: {{ order.remark }}
            </div>
            <div class="order-footer">
              <span>操作人: {{ order.operatorName }}</span>
              <span>下单时间: {{ formatDate(order.createdAt) }}</span>
            </div>
          </el-card>
        </div>

        <el-empty v-else description="暂无合作项目记录" :image-size="70" />
      </div>

      <div class="follow-up-section">
        <div class="section-header">
          <span class="section-title">跟进记录 ({{ customer.followUps?.length || 0 }})</span>
          <el-button v-if="canCreate" type="primary" size="small" :icon="Plus" @click="$emit('add-follow-up')">
            添加跟进
          </el-button>
        </div>

        <el-timeline v-if="(customer.followUps?.length ?? 0) > 0">
          <el-timeline-item v-for="item in customer.followUps" :key="item.id"
            :timestamp="formatDateTime(item.createdAt || '')" placement="top">
            <el-card shadow="hover" class="follow-up-card">
              <div class="follow-up-header">
                <span class="operator-name">{{ item.operatorName }}</span>
                <el-button v-if="!isGuest" type="danger" link size="small" @click="$emit('delete-follow-up', item)"
                  style="margin-left: auto">
                  删除
                </el-button>
              </div>
              <p class="follow-up-content">{{ item.content }}</p>
              <p v-if="item.nextTime" class="next-time">
                下次跟进时间：{{ formatDate(item.nextTime) }}
              </p>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <el-empty v-else description="暂无跟进记录" :image-size="80" />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </AsyncDialog>

  <OrderFormDialog
    ref="orderDialogRef"
    v-model="orderFormVisible"
    :customer-id="customer?.id || 0"
    :order-data="currentOrder"
    @submit="handleOrderSubmit"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AsyncDialog from '@/components/common/AsyncDialog.vue'
import OrderFormDialog from './OrderFormDialog.vue'
import customerApi from '@/api/customer'
import { formatDate, formatDateTime, addDays } from '@/utils/date'
import type { CustomerDetailData, CustomerOrderData, CustomerOrderCreatePayload, CustomerOrderUpdatePayload } from '@/types'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  customer: { type: Object as PropType<CustomerDetailData | null>, default: null },
  canCreate: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'open', 'add-follow-up', 'delete-follow-up', 'order-change'])

const orderFormVisible = ref(false)
const currentOrder = ref<CustomerOrderData | null>(null)
const orderDialogRef = ref<InstanceType<typeof OrderFormDialog> | null>(null)

const handleAddOrder = () => {
  currentOrder.value = null
  orderFormVisible.value = true
}

const handleEditOrder = (order: CustomerOrderData) => {
  currentOrder.value = order
  orderFormVisible.value = true
}

const handleDeleteOrder = async (order: CustomerOrderData) => {
  try {
    await ElMessageBox.confirm(`确定要删除合作项目“${order.orderName}”吗？`, '提示', {
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
  if (!props.customer) return
  try {
    orderDialogRef.value?.setSubmitting(true)
    if (payload.isEdit && payload.orderId) {
      await customerApi.updateOrder(payload.orderId, payload.data as CustomerOrderUpdatePayload)
      ElMessage.success('合作项目更新成功')
    } else {
      await customerApi.addOrder(props.customer.id, payload.data as CustomerOrderCreatePayload)
      ElMessage.success('合作项目添加成功')
    }
    orderFormVisible.value = false
    emit('order-change')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    orderDialogRef.value?.setSubmitting(false)
  }
}

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const getComputedDate = (days: number | null, startDate: string | null, fallbackDate: string): string => {
  if (!days || days <= 0) return ''
  const from = startDate || fallbackDate || new Date()
  return formatDate(addDays(days, from))
}
</script>

<style scoped>
.delivery-date-sub {
  color: #e6a23c;
  font-size: 13px;
  font-weight: 500;
  margin-left: 4px;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.follow-up-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.follow-up-card {
  margin-bottom: 8px;
}

.follow-up-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.operator-name {
  color: #909399;
  font-size: 13px;
}

.follow-up-content {
  margin: 8px 0;
  color: #303133;
  line-height: 1.6;
}

.next-time {
  color: #e6a23c;
  font-size: 13px;
  margin-top: 8px;
}

.orders-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  border-radius: 8px;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.order-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.order-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.order-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.order-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.detail-item {
  display: inline-flex;
  align-items: center;
}

.detail-label {
  color: #909399;
  margin-right: 4px;
}

.order-remark {
  font-size: 13px;
  color: #606266;
  background-color: #f8f9fb;
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #a8abb2;
  border-top: 1px dashed #ebeef5;
  padding-top: 8px;
}
</style>
