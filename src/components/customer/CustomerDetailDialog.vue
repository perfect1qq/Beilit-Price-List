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
        <el-descriptions-item label="工期">
          <template v-if="customer.deliveryDays && customer.deliveryDays > 0">
            {{ customer.deliveryDays }}天
          </template>
          <template v-else>—</template>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ customer.remark || '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(customer.createdAt || '') }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(customer.updatedAt || '') }}</el-descriptions-item>
      </el-descriptions>

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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import AsyncDialog from '@/components/common/AsyncDialog.vue'
import { formatDate, formatDateTime } from '@/utils/date'
import type { CustomerDetailData } from '@/types'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  customer: { type: Object as PropType<CustomerDetailData | null>, default: null },
  canCreate: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'open', 'add-follow-up', 'delete-follow-up'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<style scoped>
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
</style>
