<template>
  <div class="quotation-history-page">
    <div v-if="viewState === 'list'" class="history-list-view">
      <el-card shadow="never" class="card">
        <template #header>
          <CardHeader title="报价单历史">
            <template #actions>
              <div class="history-toolbar">
                <el-input v-model="searchKeyword" placeholder="按公司名称 / 名称搜索" clearable style="max-width: 340px"
                  @input="onKeywordInput" />
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

            <el-collapse v-else v-model="activePanels" class="year-collapse">
              <el-collapse-item v-for="yearGroup in groupedHistoryList" :key="yearGroup.year"
                :name="String(yearGroup.year)">
                <template #title>
                  <div class="group-title">
                    <div class="group-title-main">
                      <span class="group-company">{{ yearGroup.year }} 年</span>
                      <el-tag size="small" type="primary">{{ yearGroup.count }} 条</el-tag>
                      <el-tag size="small" type="info">{{ yearGroup.companyGroups.length }} 个公司</el-tag>
                    </div>
                    <div class="group-title-meta">
                      <span>最新：{{ yearGroup.latestDate || "-" }}</span>
                    </div>
                  </div>
                </template>


                <el-empty v-if="!yearGroup.companyGroups.length" description="该年份暂无报价单记录" :image-size="60" />
                <template v-else>
                  <el-collapse v-model="activeCompanyPanels" class="company-collapse-inner">
                    <el-collapse-item v-for="group in getPagedCompanies(yearGroup)" :key="group.companyName"
                      :name="group.companyName">
                      <template #title>
                        <div class="group-title group-title-sub">
                          <div class="group-title-main">
                            <span class="group-company">{{ group.companyName }}</span>
                            <el-tag size="small">{{ group.count }} 条</el-tag>
                          </div>
                          <div class="group-title-meta">
                            <span>最新：{{ group.latestDate || "-" }}</span>
                          </div>
                        </div>
                      </template>

                      <el-table :data="group.records" stripe border :header-cell-style="TABLE_HEADER_STYLE"
                        class="smart-table nowrap-table" style="width: 100%">
                        <AutoFitColumn :data="group.records" label="名称" :getter="(row: any) => row.name || row.companyName || '-'" :min="130" :max="460">
                          <template #default="{ row }">
                            {{ row.name || row.companyName || "-" }}
                          </template>
                        </AutoFitColumn>
                        <el-table-column prop="ownerName" label="提交人" min-width="70" align="center" v-if="isAdmin" />
                        <el-table-column prop="finalPrice" label="成交价" min-width="85" align="center">
                          <template #default="{ row }">¥ {{ formatMoney(row.finalPrice) }}</template>
                        </el-table-column>
                        <el-table-column prop="createDate" label="创建时间" min-width="95" align="center" />
                        <el-table-column label="操作" width="220" align="center">
                          <template #default="{ row }: { row: HistoryRecord }">
                            <div class="action-btns">
                              <el-button type="primary" size="small" plain
                                @click="openDetail(row, 'view')">查看</el-button>
                              <template v-if="!isGuest">
                                <el-button type="warning" size="small" plain :loading="isActionLoading(row.id)"
                                  @click="openDetail(row, 'edit')">修改</el-button>
                                <el-button type="danger" size="small" plain :loading="isActionLoading(row.id)"
                                  @click="deleteHistory(row)">删除</el-button>
                              </template>
                            </div>
                          </template>
                        </el-table-column>
                      </el-table>
                    </el-collapse-item>
                  </el-collapse>


                  <div class="year-pager-wrap" v-if="getYearTotalPages(yearGroup.companyGroups.length) > 1">
                    <el-pagination :current-page="getYearPage(yearGroup.year)" :page-size="DEFAULT_PAGE_SIZE"
                      :total="yearGroup.companyGroups.length" layout="prev, pager, next, jumper"
                      @current-change="(val: number) => handleYearPageChange(yearGroup.year, val)" small />
                  </div>
                </template>
              </el-collapse-item>
            </el-collapse>
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
                <el-button @click="backToList">返回列表</el-button>
                <el-button v-if="!isViewMode" type="primary" plain :icon="Plus" @click="addRow">手动添加一行</el-button>
                <el-button v-if="!isViewMode" :icon="Refresh" @click="clearRows">清空当前表格</el-button>
                <el-button v-if="!isViewMode" type="success" :icon="DocumentAdd" @click="handleSubmit"
                  :loading="isSubmitting">确认保存报价单</el-button>
              </div>
            </template>
          </CardHeader>
        </template>

        <QuotationEditor ref="formRef" :is-view-mode="isViewMode" :rules-disabled="rulesDisabled"
          :editing-history-id="editingHistoryId" :form-model="formModel" v-model:remark="remark"
          v-model:discount="discount" v-model:final-price="finalPrice" v-model:raw-text="rawText" :subtotal="subtotal"
          :discount-amount="discountAmount" :auto-final-price="autoFinalPrice"
          :is-manual-final-price="isManualFinalPrice" :items="items" :visible-columns="visibleColumns"
          :hide-action-column="isGuest" @handle-discount-change="handleDiscountChange"
          @handle-manual-final-price-change="handleManualFinalPriceChange"
          @restore-auto-final-price="restoreAutoFinalPrice" @update-row-total="updateRowTotal" @remove-row="removeRow">
          <template #parse-action>
            <el-button v-if="!isViewMode" type="primary" :icon="DocumentAdd" @click="handleParseText"
              :loading="parsing">智能解析粘贴内容</el-button>
          </template>
        </QuotationEditor>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
defineOptions({ name: "QuotationHistory" });
import { DocumentAdd, Plus, Refresh } from "@element-plus/icons-vue";
import { usePermissions } from "@/composables/usePermissions";
import { formatMoney } from "@/utils/number";
import { TABLE_HEADER_STYLE } from "@/constants/table";
import QuotationEditor from "@/components/quotation/QuotationEditor.vue";
import { useQuotationHistoryPage } from "@/composables/useQuotationHistoryPage";
import type { HistoryRecord } from "@/composables/useQuotationHistory";

const { isAdmin, isGuest } = usePermissions();
const route = useRoute();

const {
  parsing,
  isSubmitting,
  rulesDisabled,
  viewState,
  activePanels,
  activeCompanyPanels,
  formRef,
  formModel,
  remark,
  discount,
  finalPrice,
  isManualFinalPrice,
  rawText,
  items,
  visibleColumns,
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
  DEFAULT_PAGE_SIZE,
  getYearPage,
  getPagedCompanies,
  getYearTotalPages,
  handleYearPageChange,
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


watch(
  () => [groupedHistoryList.value, searchKeyword.value, route.query.expandCompany] as const,
  ([groups, keyword, expandCompany]) => {
    if (!keyword?.trim()) {
      activePanels.value = groups.map(group => String(group.year));
      if (expandCompany) {
        const target = String(expandCompany).trim().toLowerCase();
        const foundCompanies: string[] = [];
        for (const group of groups) {
          for (const cg of group.companyGroups) {
            if (cg.companyName.toLowerCase().includes(target)) {
              foundCompanies.push(cg.companyName);
            }
          }
        }
        activeCompanyPanels.value = foundCompanies;
      }
      return;
    }

    const matchedYears: string[] = [];
    const matchedCompanies: string[] = [];

    for (const group of groups) {
      let yearMatched = false;
      for (const companyGroup of group.companyGroups) {
        const companyMatched = companyGroup.companyName
          .toLowerCase()
          .includes(keyword.toLowerCase().trim());
        if (companyMatched) {
          matchedCompanies.push(companyGroup.companyName);
          yearMatched = true;
          continue;
        }

        for (const record of companyGroup.records) {
          const name = (record.name || record.companyName || "").toLowerCase();
          if (name.includes(keyword.toLowerCase().trim())) {
            matchedCompanies.push(companyGroup.companyName);
            yearMatched = true;
            break;
          }
        }
        if (yearMatched) break;
      }

      if (yearMatched) {
        matchedYears.push(String(group.year));
      }
    }

    if (matchedYears.length > 0) {
      activePanels.value = matchedYears;
      activeCompanyPanels.value = matchedCompanies;
    }
  },
  { deep: true }
);
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

/* ========== 年份内分页 ========== */

.year-pager-wrap {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

/* ========== 折叠面板样式 ========== */

.year-collapse {
  border: none;
}

:deep(.year-collapse > .el-collapse-item) {
  border: none;
  margin-bottom: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

:deep(.year-collapse .el-collapse-item__header) {
  background-color: #fff;
  font-weight: 700;
  font-size: 15px;
  height: auto !important;
  min-height: 50px;
  line-height: 1.4;
  padding: 12px 16px;
  border-bottom: none;
  color: #1e293b;
}

:deep(.year-collapse .el-collapse-item__header.is-active) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.year-collapse .el-collapse-item__wrap) {
  border: none;
  background-color: #fff;
}

:deep(.year-collapse .el-collapse-item__content) {
  padding: 16px 16px;
}

.company-collapse-inner {
  border: none;
}

:deep(.company-collapse-inner > .el-collapse-item) {
  border: none;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
}

:deep(.company-collapse-inner .el-collapse-item__header) {
  background-color: transparent;
  font-size: 14px;
  height: auto !important;
  min-height: 44px;
  line-height: 1.4;
  padding: 10px 14px;
  border-bottom: none;
  color: #334155;
}

:deep(.company-collapse-inner .el-collapse-item__header.is-active) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.company-collapse-inner .el-collapse-item__wrap) {
  background-color: transparent;
  border: none;
}

:deep(.company-collapse-inner .el-collapse-item__content) {
  padding: 12px 0 4px;
}

/* ========== 分组标题样式 ========== */

.group-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-right: 8px;
  line-height: 1.4;
}

.group-title-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.group-company {
  font-weight: 700;
  color: #1e293b;
  word-break: break-all;
}

.group-title-meta {
  color: #94a3b8;
  font-size: 13px;
  white-space: nowrap;
  flex-shrink: 0;
}

.group-title-sub {
  padding-left: 0;
}

.group-title-sub .group-company {
  font-weight: 600;
  color: #334155;
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

  .year-pager-wrap {
    justify-content: center;
  }

  .group-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 0;
  }

  .group-title-main {
    width: 100%;
    gap: 6px;
  }

  .group-company {
    white-space: normal;
  }

  .group-title-meta {
    white-space: normal;
    font-size: 12px;
  }
}
</style>
