<template>
  <div class="quotation-history-page">
    <div v-if="viewState === 'list'" class="history-list-view">
      <el-card shadow="never" class="card">
        <template #header>
          <CardHeader title="报价单历史">
            <template #actions>
              <div class="history-toolbar">
                <SearchBar v-model="searchKeyword" placeholder="按公司名称 / 名称搜索" style="max-width: 340px"
                  @search="onKeywordInput" />
                <el-tag type="info">
                  共 {{ totalRecords }} 条记录 /
                  {{ groupedHistoryList.length }} 个年份</el-tag>
              </div>
            </template>
          </CardHeader>
        </template>

        <div class="history-content-wrap">
          <el-skeleton v-if="loading" animated :rows="8" />

          <template v-else>
            <el-empty v-if="!groupedHistoryList.length" :description="searchKeyword?.trim() ? '未搜索到匹配的报价单记录' : '暂无历史报价单'
              " />

            <GroupedHistoryList v-else :data="groupedHistoryList">
              <template #default="{ records }">
                <AutoFitColumn :data="records" label="名称" :getter="(row: any) => row.name || row.companyName || '-'" :min="130" :max="460">
                  <template #default="{ row }">
                    {{ row.name || row.companyName || "-" }}
                  </template>
                </AutoFitColumn>
                <el-table-column prop="ownerName" label="提交人" min-width="70" align="center" v-if="isAdmin" />
                <el-table-column prop="finalPrice" label="成交价" min-width="85" align="center">
                  <template #default="{ row }">¥ {{ formatMoney(row.finalPrice) }}</template>
                </el-table-column>
                <el-table-column prop="createDate" label="报价时间" min-width="95" align="center" />
                <el-table-column label="操作" min-width="220" align="center">
                  <template #default="{ row }: { row: HistoryRecord }">
                    <div class="action-btns">
                      <AppButton variant="view" size="small" @click="openDetail(row, 'view')">查看</AppButton>
                      <template v-if="!isGuest">
                        <AppButton v-if="canModify(row)" variant="edit" :loading="isActionLoading(row.id)" @click="openDetail(row, 'edit')">修改</AppButton>
                        <AppButton variant="delete" v-if="canDelete(row)" size="small" :loading="isActionLoading(row.id)" @click="deleteHistory(row)">删除</AppButton>
                      </template>
                    </div>
                  </template>
                </el-table-column>
              </template>
            </GroupedHistoryList>
          </template>
        </div>
      </el-card>
    </div>

    <div v-else class="history-detail-view">
      <el-card shadow="never" class="card">
        <template #header>
          <CardHeader title="报价单详情">
            <template #actions>
              <div class="toolbar">
                <AppButton @click="backToList">返回列表</AppButton>
                <AppButton variant="add" v-if="!isViewMode" @click="addRow">手动添加一行</AppButton>
                <AppButton variant="delete" size="default" v-if="!isViewMode" @click="clearRows">清空当前表格</AppButton>
                <AppButton variant="save" v-if="!isViewMode" type="success" @click="handleSubmit" :loading="isSubmitting">确认保存报价单</AppButton>
              </div>
            </template>
          </CardHeader>
        </template>

        <QuotationEditor ref="formRef" :is-view-mode="isViewMode" :rules-disabled="rulesDisabled"
          :editing-history-id="editingHistoryId" :form-model="formModel" v-model:remark="remark"
          v-model:discount="discount" v-model:final-price="finalPrice" v-model:raw-text="rawText"
          v-model:quotation-date="quotationDate" :subtotal="subtotal"
          :discount-amount="discountAmount" :auto-final-price="autoFinalPrice"
          :is-manual-final-price="isManualFinalPrice" :items="items" :visible-columns="visibleColumns"
          :hide-action-column="isGuest" @handle-discount-change="handleDiscountChange"
          @handle-manual-final-price-change="handleManualFinalPriceChange"
          @restore-auto-final-price="restoreAutoFinalPrice" @update-row-total="updateRowTotal" @remove-row="removeRow">
          <template #parse-action>
            <AppButton variant="primary" v-if="!isViewMode" :icon="MagicStick" @click="handleParseText" :loading="parsing">智能解析粘贴内容</AppButton>
          </template>
        </QuotationEditor>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
defineOptions({ name: "QuotationHistory" });
import { Delete, Check, MagicStick, Plus, Setting } from "@element-plus/icons-vue";
import type { UploadFile, UploadFiles } from 'element-plus'
import SearchBar from '@/components/common/SearchBar.vue'
import AppButton from '@/components/common/AppButton.vue'
import { usePermissions } from "@/composables/usePermissions";
import { useUserStore } from "@/stores/user";
import { formatMoney } from "@/utils/number";
import { TABLE_HEADER_STYLE } from "@/constants/table";
import QuotationEditor from "@/components/quotation/QuotationEditor.vue";
import GroupedHistoryList from "@/components/common/GroupedHistoryList.vue";
import { useQuotationHistoryPage } from "@/composables/useQuotationHistoryPage";
import type { HistoryRecord } from "@/composables/useQuotationHistory";

const { isAdmin, isGuest } = usePermissions();
const userStore = useUserStore();
const route = useRoute();
const currentUserId = computed(() => userStore.user?.id);

const {
  parsing,
  isSubmitting,
  rulesDisabled,
  viewState,
  formRef,
  formModel,
  remark,
  discount,
  finalPrice,
  isManualFinalPrice,
  rawText,
  items,
  visibleColumns,
  quotationDate,
  editingHistoryId,
  isViewMode,
  subtotal,
  autoFinalPrice,
  discountAmount,
  addRow,
  removeRow,
  clearRows,
  updateRowTotal,
  restoreAutoFinalPrice,
  groupedHistoryList,
  searchKeyword,
  loading,
  isActionLoading,
  onKeywordInput,
  deleteHistory,
  handleManualFinalPriceChange,
  handleDiscountChange,
  handleParseText,
  handleSubmit,
  openDetail,
  backToList,
} = useQuotationHistoryPage();

const totalRecords = computed(() =>
  groupedHistoryList.value.reduce((sum, group) => sum + group.count, 0)
);

// 已通过状态：仅管理员可修改/删除；其它状态：管理员或本人可操作
const canModify = (row: HistoryRecord) => {
  if (row.status === "approved") return isAdmin.value;
  return isAdmin.value || row.ownerId === currentUserId.value;
};

const canDelete = (row: HistoryRecord) => {
  if (row.status === "approved") return isAdmin.value;
  return isAdmin.value || row.ownerId === currentUserId.value;
};



</script>

<style scoped>
.quotation-history-page {
  padding: 0;
}

.card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

.history-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.history-content-wrap {
  overflow: visible;
}

.history-list-view,
.history-detail-view {
  width: 100%;
}

.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}



/* ========== 表格样式 ========== */

:deep(.smart-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.smart-table .el-table__header th) {
  background-color: #f8fafc !important;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
}

/* ========== 表单 ========== */

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__error) {
  font-size: 11px;
  line-height: 1.6;
  padding-top: 2px;
}

/* ========== 响应式 ========== */

@media (max-width: 768px) {
  .history-toolbar {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 8px;
  }

  .history-toolbar :deep(.el-input),
  .history-toolbar :deep(.el-input__wrapper) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar :deep(.el-button) {
    width: 100%;
    margin: 0 !important;
  }
}
</style>

