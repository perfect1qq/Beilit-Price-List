<!--
  @file views/QuotationHistory.vue
  @description 报价单历史记录页面

  功能说明：
  - 展示所有历史报价单记录（按公司名称分组）
  - 支持按公司名/提交人搜索
  - 分页展示（支持 10/20/50/60 条每页）
  - 查看详情 / 编辑 / 删除操作
  - 可折叠的分组面板（类似手风琴效果）

  页面布局：
  ┌──────────────────────────────────────────────────────────────┐
  │  QuotationHistory (报价单历史)                                │
  │                                                              │
  │  Toolbar: [搜索框] [统计标签: X个公司/Y条记录]               │
  │                                                              │
  │  Collapse (公司分组)                                         │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │ ▼ 武汉测试公司 (3条) 最新: 2024-01-15                  │  │
  │  │ ┌───────────────────────────────────────────────────┐  │  │
  │  │ │ 报价单号 | 提交人 | 成交价 | 创建时间 | 操作      │  │  │
  │  │ ├───────────────────────────────────────────────────┤  │  │
  │  │ │ QT001   | 张三  | ¥1000 | 01-10  |[查看][修改]  │  │  │
  │  │ │ QT002   | 张三  | ¥2000 | 01-12  |[查看][修改]  │  │  │
  │  │ └───────────────────────────────────────────────────┘  │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  Pagination: [共X条] [< 1 2 3 >] [每页: ▼10条]             │
  └──────────────────────────────────────────────────────────────┘

  数据结构：
  - 原始数据：扁平的报价单列表
  - 分组后：按 companyName 聚合，每个分组包含：
    * companyName: 公司名称
    * count: 该公司的报价单数量
    * latestDate: 最新一条的创建时间
    * records: 该公司的所有报价单数组

  权限控制：
  - admin/user: 可查看、编辑、删除
  - guest: 仅可查看（无修改和删除按钮）

  API 调用：
  - GET /api/quotations/history?keyword=&page=&pageSize= → 获取历史记录
  - DELETE /api/quotations/:id → 删除指定报价单

  特性说明：
  - 使用 el-collapse 实现可折叠分组
  - 支持实时搜索过滤（防抖处理）
  - 使用 useInstantListActions 实现乐观更新
-->

<template>
  <div class="quotation-history-page">
    <div v-if="viewState === 'list'" class="history-list-view">
      <el-card shadow="never" class="card">
        <div class="history-toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="按公司名称 / 名称搜索"
            clearable
            style="max-width: 340px"
            @input="onKeywordInput"
          />
          <div class="toolbar-right">
            <el-tag type="info">
              共 {{ totalRecords }} 条记录 /
              {{ groupedHistoryList.length }} 个年份</el-tag
            >
            <el-button type="primary" size="small" @click="showAddYearDialog = true"
              >添加年份</el-button
            >
          </div>
        </div>

        <!-- 添加年份对话框 -->
        <el-dialog
          v-model="showAddYearDialog"
          title="添加年份"
          width="360px"
          :close-on-click-modal="false"
        >
          <el-form @submit.prevent="confirmAddYear">
            <el-form-item label="年份">
              <el-input-number
                v-model="newYear"
                :min="2000"
                :max="2099"
                :controls="false"
                placeholder="如 2027"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item>
              <div class="year-dialog-hint">
                <el-icon>
                  <InfoFilled />
                </el-icon>
                <span>提示：添加的年份若暂无数据，将显示"该年份暂无报价单记录"</span>
              </div>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showAddYearDialog = false">取消</el-button>
            <el-button type="primary" @click="confirmAddYear">确定</el-button>
          </template>
        </el-dialog>

        <!-- 移动到年份对话框 -->
        <el-dialog
          v-model="showMoveYearDialog"
          title="移动到其他年份"
          width="360px"
          :close-on-click-modal="false"
        >
          <el-form @submit.prevent="confirmMoveToYear">
            <el-form-item label="目标年份">
              <el-select
                v-model="targetMoveYear"
                placeholder="选择目标年份"
                style="width: 100%"
              >
                <el-option
                  v-for="year in availableYears"
                  :key="year"
                  :label="year + ' 年'"
                  :value="year"
                />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showMoveYearDialog = false">取消</el-button>
            <el-button
              type="primary"
              @click="confirmMoveToYear"
              :loading="!!movingRecord?.id && isActionLoading(movingRecord.id)"
              >确定</el-button
            >
          </template>
        </el-dialog>

        <div class="history-content-wrap">
          <el-skeleton v-if="loading" animated :rows="8" />

          <template v-else>
            <el-empty
              v-if="!groupedHistoryList.length"
              :description="
                searchKeyword?.trim() ? '未搜索到匹配的报价单记录' : '暂无历史报价单'
              "
            />

            <el-collapse v-else v-model="activePanels" accordion class="year-collapse">
              <el-collapse-item
                v-for="yearGroup in groupedHistoryList"
                :key="yearGroup.year"
                :name="String(yearGroup.year)"
              >
                <template #title>
                  <div class="group-title">
                    <div class="group-title-main">
                      <span class="group-company">{{ yearGroup.year }} 年</span>
                      <el-tag size="small" type="primary"
                        >{{ yearGroup.count }} 条</el-tag
                      >
                      <el-tag size="small" type="info"
                        >{{ yearGroup.companyGroups.length }} 个公司</el-tag
                      >
                    </div>
                    <div class="group-title-meta">
                      <span>最新：{{ yearGroup.latestDate || "-" }}</span>
                      <el-button
                        v-if="isCustomYear(yearGroup.year)"
                        link
                        type="danger"
                        size="small"
                        @click.stop="handleRemoveYear(yearGroup.year)"
                        >删除年份</el-button
                      >
                    </div>
                  </div>
                </template>

                <!-- 内层：按公司折叠（分页） -->
                <el-empty
                  v-if="!yearGroup.companyGroups.length"
                  description="该年份暂无报价单记录"
                  :image-size="60"
                />
                <template v-else>
                  <el-collapse
                    v-model="activeCompanyPanels"
                    accordion
                    class="company-collapse-inner"
                  >
                    <el-collapse-item
                      v-for="group in getPagedCompanies(yearGroup)"
                      :key="group.companyName"
                      :name="group.companyName"
                    >
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

                      <el-table
                        :data="group.records"
                        stripe
                        border
                        :header-cell-style="TABLE_HEADER_STYLE"
                        class="smart-table"
                        style="width: 100%"
                      >
                        <el-table-column
                          label="名称"
                          min-width="120"
                          show-overflow-tooltip
                          align="center"
                        >
                          <template #default="{ row }">
                            {{ row.name || row.companyName || "-" }}
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="ownerName"
                          label="提交人"
                          min-width="80"
                          align="center"
                          v-if="isAdmin"
                        />
                        <el-table-column
                          prop="finalPrice"
                          label="成交价"
                          min-width="90"
                          align="center"
                        >
                          <template #default="{ row }"
                            >¥ {{ formatMoney(row.finalPrice) }}</template
                          >
                        </el-table-column>
                        <el-table-column
                          prop="createDate"
                          label="创建时间"
                          min-width="100"
                          align="center"
                        />
                        <el-table-column
                          label="操作"
                          fixed="right"
                          min-width="180"
                          align="center"
                        >
                          <template #default="{ row }: { row: HistoryRecord }">
                            <div class="action-btns">
                              <template v-if="!isGuest">
                                <el-button
                                  type="warning"
                                  size="small"
                                  text
                                  :loading="isActionLoading(row.id)"
                                  @click="openDetail(row, 'edit')"
                                >
                                  修改
                                </el-button>
                                <el-button
                                  type="success"
                                  size="small"
                                  text
                                  @click="openMoveYearDialog(row)"
                                >
                                  移动年份
                                </el-button>
                                <el-button
                                  type="danger"
                                  size="small"
                                  text
                                  :loading="isActionLoading(row.id)"
                                  @click="deleteHistory(row)"
                                >
                                  删除
                                </el-button>
                              </template>
                            </div>
                          </template>
                        </el-table-column>
                      </el-table>
                    </el-collapse-item>
                  </el-collapse>

                  <!-- 年份内分页 -->
                  <div
                    class="year-pager-wrap"
                    v-if="getYearTotalPages(yearGroup.companyGroups.length) > 1"
                  >
                    <el-pagination
                      :current-page="getYearPage(yearGroup.year)"
                      :page-size="DEFAULT_PAGE_SIZE"
                      :total="yearGroup.companyGroups.length"
                      layout="prev, pager, next, jumper"
                      @current-change="(val: number) => handleYearPageChange(yearGroup.year, val)"
                      small
                    />
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
        <div class="toolbar">
          <el-button @click="backToList">返回列表</el-button>
          <el-button
            type="primary"
            plain
            :icon="Plus"
            @click="addRow"
            :disabled="isViewMode"
            >手动添加一行</el-button
          >
          <el-button :icon="Refresh" @click="clearRows" :disabled="isViewMode"
            >清空当前表格</el-button
          >
          <el-button
            type="success"
            :icon="DocumentAdd"
            @click="handleSubmit"
            :loading="isSubmitting"
            :disabled="isViewMode"
            >确认保存报价单</el-button
          >
        </div>

        <QuotationEditor
          ref="formRef"
          :is-view-mode="isViewMode"
          :rules-disabled="rulesDisabled"
          :editing-history-id="editingHistoryId"
          :form-model="formModel"
          v-model:remark="remark"
          v-model:discount="discount"
          v-model:final-price="finalPrice"
          v-model:raw-text="rawText"
          :subtotal="subtotal"
          :discount-amount="discountAmount"
          :auto-final-price="autoFinalPrice"
          :is-manual-final-price="isManualFinalPrice"
          :items="items"
          :visible-columns="visibleColumns"
          :hide-action-column="isGuest"
          @handle-discount-change="handleDiscountChange"
          @handle-manual-final-price-change="handleManualFinalPriceChange"
          @restore-auto-final-price="restoreAutoFinalPrice"
          @update-row-total="updateRowTotal"
          @remove-row="removeRow"
        >
          <template #parse-action>
            <el-button
              v-if="!isViewMode"
              type="primary"
              :icon="DocumentAdd"
              @click="handleParseText"
              :loading="parsing"
              >智能解析粘贴内容</el-button
            >
          </template>
        </QuotationEditor>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
defineOptions({ name: "QuotationHistory" });
import { DocumentAdd, Plus, Refresh, InfoFilled } from "@element-plus/icons-vue";
import { usePermissions } from "@/composables/usePermissions";
import { formatMoney } from "@/utils/number";
import { TABLE_HEADER_STYLE } from "@/constants/table";
import QuotationEditor from "@/components/quotation/QuotationEditor.vue";
import { useQuotationHistoryPage } from "@/composables/useQuotationHistoryPage";
import type { HistoryRecord } from "@/composables/useQuotationHistory";

const { isAdmin, isGuest } = usePermissions();

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
  yearPages,
  getYearPage,
  setYearPage,
  getPagedCompanies,
  getYearTotalPages,
  handleYearPageChange,
  isActionLoading,
  onKeywordInput,
  deleteHistory,
  addCustomYear,
  removeCustomYear,
  customYears,
  moveToYear,
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

const showAddYearDialog = ref(false);
const newYear = ref(new Date().getFullYear() + 1);

// 移动到年份相关状态
const showMoveYearDialog = ref(false);
const movingRecord = ref<HistoryRecord | null>(null);
const targetMoveYear = ref<number | null>(null);

// 可选年份列表（仅显示已有的年份）
const availableYears = computed(() => {
  return groupedHistoryList.value.map((g) => g.year).sort((a, b) => b - a);
});

function confirmAddYear() {
  const year = newYear.value;
  if (!year || year < 2000 || year > 2099) {
    ElMessage.warning("请输入有效的年份（2000-2099）");
    return;
  }
  // 检查年份是否已存在
  const exists = groupedHistoryList.value.some((g) => g.year === year);
  if (exists) {
    ElMessage.warning(`${year} 年已存在`);
    return;
  }
  // 添加空年份分组
  addCustomYear(year);
  showAddYearDialog.value = false;
  ElMessage.success(`已添加 ${year} 年`);
}

/** 判断是否为自定义年份 */
function isCustomYear(year: number): boolean {
  return customYears.value.includes(year);
}

/** 删除自定义年份 */
function handleRemoveYear(year: number) {
  ElMessageBox.confirm(
    `确定删除 ${year} 年？该年份下的报价单不会被删除，只是移除该年份分组。`,
    "删除年份",
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
  )
    .then(() => {
      removeCustomYear(year);
      ElMessage.success(`已删除 ${year} 年`);
    })
    .catch(() => {});
}

/** 打开移动年份对话框 */
function openMoveYearDialog(record: HistoryRecord) {
  movingRecord.value = record;
  // 获取当前记录的年份作为默认值
  const currentDate = record.createdAt || record.updatedAt || "";
  const currentYear = new Date(currentDate).getFullYear();
  targetMoveYear.value = Number.isNaN(currentYear) ? null : currentYear;
  showMoveYearDialog.value = true;
}

/** 确认移动到目标年份 */
async function confirmMoveToYear() {
  if (!movingRecord.value || !targetMoveYear.value) {
    ElMessage.warning("请选择目标年份");
    return;
  }

  const success = await moveToYear(movingRecord.value!, targetMoveYear.value);
  if (success) {
    showMoveYearDialog.value = false;
    movingRecord.value = null;
    targetMoveYear.value = null;
  }
}

/** 搜索时自动展开匹配的年份和公司面板 */
watch(
  () => [groupedHistoryList.value, searchKeyword.value] as const,
  ([groups, keyword]) => {
    if (!keyword?.trim()) {
      // 如果搜索关键词为空，不自动展开
      return;
    }

    // 自动展开匹配的年份面板
    const matchedYears: string[] = [];
    const matchedCompanies: string[] = [];

    for (const group of groups) {
      // 检查该年份下是否有匹配的记录
      let yearMatched = false;
      for (const companyGroup of group.companyGroups) {
        // 检查公司名称是否匹配
        const companyMatched = companyGroup.companyName
          .toLowerCase()
          .includes(keyword.toLowerCase().trim());
        if (companyMatched) {
          matchedCompanies.push(companyGroup.companyName);
          yearMatched = true;
          continue;
        }

        // 检查记录名称是否匹配
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

    // 如果有匹配结果，自动展开对应的面板
    if (matchedYears.length > 0) {
      activePanels.value = matchedYears;
      activeCompanyPanels.value =
        matchedCompanies.length > 0 ? [matchedCompanies[0]] : [];
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
  border-radius: 14px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.history-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
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
  margin-bottom: 20px;
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
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

:deep(.year-collapse .el-collapse-item__header) {
  background-color: #fff;
  font-weight: 700;
  font-size: 15px;
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
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
  padding: 16px 20px;
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
  height: 44px;
  line-height: 44px;
  padding: 0 16px;
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
}

.group-title-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.group-company {
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

:deep(.smart-table .el-table__body td) {
  font-size: 13px;
  padding: 10px 12px;
}

/* ========== 操作按钮 ========== */

.action-btns {
  display: flex;
  gap: 2px;
  justify-content: center;
  align-items: center;
}

.action-btns .el-button {
  padding: 0 6px;
  font-size: 13px;
}

/* ========== 弹窗提示 ========== */

.year-dialog-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
  font-size: 13px;
  line-height: 1.5;
}

.year-dialog-hint .el-icon {
  margin-top: 2px;
  color: #0284c7;
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
    margin-bottom: 12px;
    align-items: flex-start;
  }

  .history-toolbar :deep(.el-input),
  .history-toolbar :deep(.el-input__wrapper) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .toolbar {
    margin-bottom: 12px;
    gap: 8px;
  }

  .year-pager-wrap {
    justify-content: center;
  }

  .group-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .group-title-meta {
    white-space: normal;
  }

  .action-btns .el-button {
    padding: 0 4px;
    font-size: 12px;
  }
}
</style>
