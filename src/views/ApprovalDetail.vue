<template>
  <el-card shadow="never" class="card">
    <template #header>
      <CardHeader :title="companyName || meta.name || '审批详情'">
        <template #actions>
          <el-tag :type="tagType(meta.status)" effect="dark">{{ statusLabel(meta.status) }}</el-tag>
          <AppButton @click="goBackToList">返回列表</AppButton>
          <AppButton v-if="!isHistoryRoute && meta.status === 'pending'" type="success" :loading="actionLoading"
            :disabled="!canApprove" @click="approve">
            {{ approveButtonText }}
          </AppButton>
          <AppButton v-if="!isHistoryRoute && meta.status === 'pending'" type="danger" :loading="actionLoading"
            @click="reject">驳回</AppButton>
          <AppButton v-if="!isHistoryRoute && meta.status !== 'approved'" type="warning" :loading="actionLoading"
            :disabled="!editMode" @click="save">保存当前修改</AppButton>
        </template>
      </CardHeader>
    </template>

    <div class="sub">名称：{{ meta.name || '-' }} ｜ 公司名称：{{ meta.companyName || '-' }} ｜ 发起人：{{ meta.ownerName || '-' }}
    </div>

    <el-form class="form" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="公司名称">
            <el-input v-model="companyName" :disabled="!editMode || isHistoryRoute" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="折扣 (%)">
            <el-input-number :model-value="safeDiscount" :disabled="!editMode || isHistoryRoute" :min="0" :max="100"
              controls-position="right" style="width: 100%" @change="handleDiscountInput" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="成交价">
            <el-input-number :model-value="safeFinalPrice" :disabled="!editMode || isHistoryRoute" :min="0"
              controls-position="right" style="width: 100%" @input="handleFinalPriceInput" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注">
        <el-input v-model="remark" type="textarea" :rows="2" :disabled="!editMode || isHistoryRoute" />
      </el-form-item>
    </el-form>

    <div class="table-container">
      <el-table :data="items" border stripe style="width:100%" :header-cell-style="TABLE_HEADER_STYLE"
        class="smart-table">
        <el-table-column label="项目名称" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.name" :disabled="!editMode || isHistoryRoute" />
          </template>
        </el-table-column>
        <el-table-column label="规格型号" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.spec" :disabled="!editMode || isHistoryRoute" />
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template #default="{ row }">
            <el-input v-model="row.quantity" :disabled="!editMode || isHistoryRoute" @change="updateRowTotal(row)" />
          </template>
        </el-table-column>
        <el-table-column label="单价" width="150">
          <template #default="{ row }">
            <el-input-number :model-value="toNumber(row.unitPrice)" :disabled="!editMode || isHistoryRoute" :min="0"
              controls-position="right" style="width:100%"
              @change="(val: number | undefined) => handleUnitPriceChange(row, val)" />
          </template>
        </el-table-column>
        <el-table-column label="总价" width="150" align="right">
          <template #default="{ row }">
            <span class="row-total">¥ {{ Number(row.totalPrice || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="summary-bar">
      <div class="summary-item">合计小计：<span>¥ {{ Number(subtotal || 0).toFixed(2) }}</span></div>
      <div class="summary-item">优惠金额：<span>¥ {{ Number(discountAmount || 0).toFixed(2) }}</span></div>
      <div class="summary-item main">最终成交价：<strong>¥ {{ Number(finalPrice || 0).toFixed(2) }}</strong></div>
      <AppButton variant="primary" v-if="editMode && !isHistoryRoute && isManualFinalPrice" @click="restoreAutoFinalPrice">恢复自动计算</AppButton>
    </div>

    <el-divider />
    <h3 class="section-title">审批流水 & 日志</h3>
    <el-timeline class="logs">
      <el-timeline-item v-for="log in logs" :key="log.id" :timestamp="new Date(log.createdAt).toLocaleString()"
        :type="log.action === 'approve' ? 'success' : (log.action === 'reject' ? 'danger' : 'info')">
        <span class="log-op">{{ log.operatorName }}</span>
        <el-tag size="small" :type="tagType(log.action)" class="log-tag">{{ log.action }}</el-tag>
        <span class="log-comment">{{ log.comment }}</span>
      </el-timeline-item>
    </el-timeline>
  </el-card>
</template>

<script setup lang="ts">
import { TABLE_HEADER_STYLE } from '@/constants/table'
import { useApprovalDetail } from '@/composables/useApprovalDetail'
import CardHeader from '@/components/common/CardHeader.vue'

defineOptions({ name: 'ApprovalDetail' })

const {
  isHistoryRoute,
  editMode,
  logs,
  actionLoading,
  meta,
  companyName,
  remark,
  finalPrice,
  items,
  subtotal,
  discountAmount,
  isManualFinalPrice,
  safeDiscount,
  safeFinalPrice,
  canApprove,
  approveButtonText,
  tagType,
  statusLabel,
  toNumber,
  handleDiscountInput,
  handleFinalPriceInput,
  handleUnitPriceChange,
  updateRowTotal,
  restoreAutoFinalPrice,
  goBackToList,
  save,
  approve,
  reject,
} = useApprovalDetail()
</script>

<style scoped>
.card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.sub {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 16px;
}

.form {
  margin-top: 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}

.table-container {
  margin-bottom: 20px;
}

.row-total {
  font-weight: 700;
  color: #334155;
}

.summary-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding: 16px 24px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 15px;
  border: 1px solid #e5e7eb;
}

.summary-item span {
  color: #475569;
  font-weight: 700;
  margin-left: 6px;
}

.summary-item.main strong {
  color: #ef4444;
  font-size: 20px;
  font-weight: 800;
  margin-left: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-top: 28px;
  margin-bottom: 20px;
  line-height: 1;
}

.log-op {
  font-weight: 700;
  color: #1e293b;
}

.log-tag {
  margin: 0 10px;
}

.log-comment {
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 768px) {
  .sub {
    line-height: 1.6;
  }

  .form {
    padding: 12px;
  }

  .summary-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
  }

  .summary-item.main strong {
    font-size: 17px;
  }
}
</style>

