<template>
  <div class="customer-management">
    <el-card shadow="never">
      <template #header>
        <CardHeader title="客户管理">
          <template #actions>
            <el-button v-if="canCreate" type="primary" :icon="Plus" @click="handleAdd">
              新增客户
            </el-button>
          </template>
        </CardHeader>
      </template>

      <div class="stats-row">
        <div
          class="stat-card"
          :class="{
            active:
              !filterCooperationStatus &&
              !filterPaymentStatus &&
              !filterOrderStatus &&
              !filterInstallationStatus &&
              !filterCustomerType,
          }"
          @click="handleStatClick('')"
        >
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">全部客户</div>
        </div>
        <div
          class="stat-card stat-undealt"
          :class="{ active: filterCooperationStatus === '未合作' }"
          @click="handleStatClick('未成交')"
        >
          <div class="stat-value">{{ stats.undealt }}</div>
          <div class="stat-label">未成交</div>
        </div>
        <div
          class="stat-card stat-dealt"
          :class="{ active: filterCooperationStatus === '已合作' && !filterOrderStatus }"
          @click="handleStatClick('成交')"
        >
          <div class="stat-value">{{ stats.dealt }}</div>
          <div class="stat-label">成交</div>
        </div>
        <div
          class="stat-card stat-pending"
          :class="{ active: filterPaymentStatus === '待催款' }"
          @click="handleStatClick('待催款')"
        >
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待催款</div>
        </div>
        <div
          class="stat-card stat-settled"
          :class="{ active: filterPaymentStatus === '已结款' }"
          @click="handleStatClick('已结款')"
        >
          <div class="stat-value">{{ stats.settled }}</div>
          <div class="stat-label">已结款</div>
        </div>
        <div
          class="stat-card stat-not-ordered"
          :class="{ active: filterOrderStatus === '未下单' }"
          @click="handleStatClick('未下单')"
        >
          <div class="stat-value">{{ stats.notOrdered }}</div>
          <div class="stat-label">未下单</div>
        </div>
        <div
          class="stat-card stat-ordered"
          :class="{ active: filterOrderStatus === '已下单' && !filterInstallationStatus }"
          @click="handleStatClick('已下单')"
        >
          <div class="stat-value">{{ stats.ordered }}</div>
          <div class="stat-label">下单</div>
        </div>
        <div
          class="stat-card stat-installed"
          :class="{ active: filterInstallationStatus === '已安装' }"
          @click="handleStatClick('已安装')"
        >
          <div class="stat-value">{{ stats.installed }}</div>
          <div class="stat-label">已安装</div>
        </div>
        <div
          class="stat-card stat-dealer"
          :class="{ active: filterCustomerType === '经销商' }"
          @click="handleStatClick('经销商')"
        >
          <div class="stat-value">{{ stats.dealer }}</div>
          <div class="stat-label">经销商</div>
        </div>
        <div
          class="stat-card stat-terminal"
          :class="{ active: filterCustomerType === '终端' }"
          @click="handleStatClick('终端')"
        >
          <div class="stat-value">{{ stats.terminal }}</div>
          <div class="stat-label">终端</div>
        </div>
      </div>

      <div class="search-filter-row">
        <SearchBar
          v-model="searchKeyword"
          placeholder="搜索公司名称、客户姓名、联系方式、货架类型"
          @search="handleSearch"
        />
      </div>

      <CardList
        :data="customerList"
        :loading="loading"
        :total="total"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :columns="2"
        empty-description="暂无客户数据"
        :empty-image-size="120"
        @page-change="() => loadList()"
      >
        <template #card="{ item }">
          <div class="customer-card">
            <div class="card-header">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <h3 class="company-name" style="margin: 0; line-height: 1.2;">{{ item.companyName }}</h3>
                <div class="header-actions" style="display: flex; gap: 8px;">
                  <template v-if="!isGuest">
                    <el-button
                      v-if="canEdit"
                      type="warning"
                      size="small"
                      plain
                      @click.stop="handleEdit(item as CustomerListItem)"
                      >编辑</el-button
                    >
                    <el-button
                      v-if="canDelete"
                      type="danger"
                      size="small"
                      plain
                      @click.stop="handleDelete(item as CustomerListItem)"
                      >删除</el-button
                    >
                  </template>
                </div>
              </div>
              <div class="tags">
                <!-- 报价状态 -->
                <el-tag
                  :type="item.hasQuotation ? 'success' : 'info'"
                  size="small"
                  :plain="!item.hasQuotation"
                >
                  {{ item.hasQuotation ? "已报价" : "未报价" }}
                </el-tag>
                <!-- 合作状态 -->
                <el-tag
                  :type="item.cooperationStatus === '已合作' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ item.cooperationStatus || "未合作" }}
                </el-tag>
                <!-- 客户类型 -->
                <el-tag
                  :type="item.customerType === '经销商' ? 'primary' : 'info'"
                  size="small"
                >
                  {{ item.customerType || "终端" }}
                </el-tag>
                <!-- 结款状态 -->
                <el-tag
                  :type="
                    item.paymentStatus === '已结款'
                      ? 'success'
                      : item.paymentStatus === '待催款'
                      ? 'danger'
                      : 'info'
                  "
                  size="small"
                >
                  {{ item.paymentStatus || "未有款项" }}
                </el-tag>
                <!-- 下单状态 -->
                <el-tag
                  :type="item.orderStatus === '已下单' ? 'primary' : 'info'"
                  size="small"
                  :effect="item.orderStatus === '已下单' ? 'dark' : 'plain'"
                >
                  {{ item.orderStatus || "未下单" }}
                </el-tag>
                <!-- 安装状态 -->
                <el-tag
                  :type="item.installationStatus === '已安装' ? 'success' : 'info'"
                  size="small"
                  :effect="item.installationStatus === '已安装' ? 'dark' : 'plain'"
                >
                  {{ item.installationStatus || "待安装" }}
                </el-tag>
              </div>
            </div>

            <div class="card-body">
              <div class="info-row two-col">
                <div class="col-item">
                  <span class="label">客户姓名：</span>
                  <span class="value">{{ item.customerName || "-" }}</span>
                </div>
                <div class="col-item">
                  <span class="label">联系方式：</span>
                  <span class="value">{{ item.contactInfo || "-" }}</span>
                </div>
              </div>

              <div class="info-row">
                <span class="label">货架类型：</span>
                <span class="value">{{ item.shelfType || "-" }}</span>
              </div>

              <div class="info-row">
                <span class="label">优惠点：</span>
                <span class="value" style="color: #f56c6c; font-weight: 600;">{{ (item.discountPoints && item.discountPoints.trim()) ? item.discountPoints : '—' }}</span>
              </div>

              <div class="info-row">
                <span class="label">备注：</span>
                <span class="value remark-text">{{ item.remark || "-" }}</span>
              </div>

              <div class="info-row delivery-info">
                <span class="label">实际工期：</span>
                <span class="delivery-days-value">{{ item.deliveryDays && item.deliveryDays > 0 ? item.deliveryDays + '天' : '—' }}</span>
                <span class="delivery-arrow">→</span>
                <span class="delivery-date-label">预计完成：</span>
                <span class="delivery-date-value">{{ item.deliveryDate || '—' }}</span>
              </div>
              <div class="info-row delivery-info">
                <span class="label">车间工期：</span>
                <span class="delivery-days-value">{{ item.workshopDeliveryDays && item.workshopDeliveryDays > 0 ? item.workshopDeliveryDays + '天' : '—' }}</span>
                <span class="delivery-arrow">→</span>
                <span class="delivery-date-label">预计完成：</span>
                <span class="delivery-date-value">{{ item.workshopDeliveryDate || '—' }}</span>
              </div>

              <div v-if="item.latestFollowUp" class="info-row follow-up-info">
                <span class="label">最新跟进：</span>
                <div class="follow-up-content">
                  <span
                    class="follow-up-text"
                    >{{ (item.latestFollowUp as FollowUpData).content }}</span
                  >
                  <span class="follow-up-meta">
                    <span class="follow-up-time">{{ formatDate((item.latestFollowUp as FollowUpData).createdAt as
                      string) }}</span>
                  </span>
                </div>
              </div>
              <div
                v-else-if="Number(item.followUpCount) > 0"
                class="info-row follow-up-info"
              >
                <span class="label">跟进记录：</span>
                <el-tag size="small" type="info"
                  >{{ Number(item.followUpCount) }} 条记录</el-tag
                >
              </div>
              <div
                v-else
                class="info-row follow-up-info follow-up-empty"
                @click.stop="handleViewFollowUps(item as CustomerListItem)"
              >
                <span class="label">最新跟进：</span>
                <div class="follow-up-content">
                  <span class="follow-up-text follow-up-empty-text">暂无跟进记录，点击添加跟进</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="action-buttons">
                <el-button
                  type="primary"
                  size="small"
                  round
                  plain
                  @click.stop="handleViewFollowUps(item as CustomerListItem)"
                  >跟进记录</el-button
                >
                <el-button
                  v-if="item.cooperationStatus === '已合作'"
                  type="primary"
                  size="small"
                  round
                  plain
                  @click.stop="handleRepurchase(item as CustomerListItem)"
                  >复购记录</el-button
                >
                <el-button
                  v-if="item.hasQuotation"
                  type="success"
                  size="small"
                  round
                  @click.stop="handleGoToQuotation(item as CustomerListItem)"
                  >查看报价单{{ Number(item.quotationCount) > 1 ? ` (${item.quotationCount})` : '' }}</el-button
                >

              </div>
            </div>
          </div>
        </template>

        <template #empty-action>
          <el-button v-if="canCreate" type="primary" @click="handleAdd"
            >立即添加客户</el-button
          >
        </template>
      </CardList>
    </el-card>

    <CustomerFormDrawer
      v-model="dialogVisible"
      :form-data="formData"
      :is-edit="editingId !== null"
      :delivery-start-date="editingDeliveryStartDate"
      :workshop-delivery-start-date="editingWorkshopDeliveryStartDate"
      @submit="handleFormSubmit"
    />

    <OrderHistoryDrawer
      v-model="orderHistoryVisible"
      :customer-id="currentCustomer?.id || 0"
      :customer-name="currentCustomer?.companyName || ''"
      :cooperation-status="currentCustomer?.cooperationStatus || ''"
      :orders="currentCustomer?.orders || []"
      :can-create="canCreate"
      :is-guest="isGuest"
      @order-change="handleOrderChange"
    />

    <FollowUpHistoryDrawer
      v-model="followUpHistoryVisible"
      :customer-id="currentCustomer?.id || 0"
      :customer-name="currentCustomer?.companyName || ''"
      :follow-ups="currentCustomer?.followUps || []"
      :can-create="canCreate"
      :is-guest="isGuest"
      @follow-up-change="handleFollowUpChange"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import customerApi from "@/api/customer";
import { to } from "@/utils/async";
import { formatDate } from "@/utils/date";
import { showError, showSuccess } from "@/utils/message";
import { usePermissions } from "@/composables/usePermissions";
import {
  useCustomerList,
  useCustomerForm,
  useFollowUp,
  useCustomerStats,
  buildListPatchFromDetail,
} from "@/composables/useCustomer";
import type {
  CustomerCreatePayload,
  CustomerUpdatePayload,
  FollowUpData,
} from "@/types";
import type { CustomerListItem } from "@/composables/useCustomer";

import SearchBar from "@/components/common/SearchBar.vue";
import CardHeader from "@/components/common/CardHeader.vue";
import CardList from "@/components/common/CardList.vue";
import CustomerFormDrawer from "@/components/customer/CustomerFormDrawer.vue";
import OrderHistoryDrawer from "@/components/customer/OrderHistoryDrawer.vue";
import FollowUpHistoryDrawer from "@/components/customer/FollowUpHistoryDrawer.vue";

const router = useRouter();
const { isGuest, canCreate, canEdit, canDelete } = usePermissions();

const {
  loading,
  customerList,
  searchKeyword,
  filterCooperationStatus,
  filterCustomerType,
  filterPaymentStatus,
  filterOrderStatus,
  filterInstallationStatus,
  page,
  pageSize,
  total,
  loadList,
  handleSearch,
  handleResetFilter,
  updateLocalItem,
  removeLocalItem,
} = useCustomerList();

const { stats, loadStats } = useCustomerStats();

const {
  dialogVisible,
  editingId,
  editingDeliveryStartDate,
  editingWorkshopDeliveryStartDate,
  formData,
  handleAdd,
  handleEdit,
  withSubmitLock,
  resetForm,
} = useCustomerForm();

const {
  currentCustomer,
  refreshCurrentCustomer,
} = useFollowUp();

const handleOrderChange = async () => {
  const id = currentCustomer.value?.id;
  if (!id) return;
  const detail = await refreshCurrentCustomer(id);
  if (detail) {
    const current = customerList.value.find((c) => c.id === id);
    updateLocalItem(id, buildListPatchFromDetail(detail, current));
  }
};

// 复购记录抽屉
const orderHistoryVisible = ref(false);

const handleRepurchase = async (item: CustomerListItem) => {
  try {
    const res = await customerApi.getDetail(item.id);
    currentCustomer.value = res?.customer || null;
    orderHistoryVisible.value = true;
  } catch (err) {
    showError(err, "加载复购记录失败");
  }
};

// 跟进记录抽屉
const followUpHistoryVisible = ref(false);

const handleViewFollowUps = async (item: CustomerListItem) => {
  try {
    const res = await customerApi.getDetail(item.id);
    currentCustomer.value = res?.customer || null;
    followUpHistoryVisible.value = true;
  } catch (err) {
    showError(err, "加载跟进记录失败");
  }
};

const handleFollowUpChange = async () => {
  const id = currentCustomer.value?.id;
  if (!id) return;
  const detail = await refreshCurrentCustomer(id);
  if (detail) {
    const current = customerList.value.find((c) => c.id === id);
    updateLocalItem(id, buildListPatchFromDetail(detail, current));
  }
};

const handleFormSubmit = async (data: CustomerCreatePayload & CustomerUpdatePayload) => {
  await withSubmitLock(async () => {
    if (editingId.value) {
      const id = editingId.value;
      const [err, updateResult] = await to(customerApi.update(id, { ...data }));
      if (err) {
        showError(err, "更新客户失败");
        throw err;
      }
      // 局部更新当前卡片，报价单字段用 update 返回值（基于新公司名重算）
      const detail = await refreshCurrentCustomer(id);
      if (detail) {
        const current = customerList.value.find((c) => c.id === id);
        updateLocalItem(id, buildListPatchFromDetail(detail, current, updateResult?.customer));
      }
      showSuccess("客户更新成功");
    } else {
      const [err] = await to(customerApi.create({ ...data }));
      if (err) {
        showError(err, "创建客户失败");
        throw err;
      }
      showSuccess("客户创建成功");
      loadList();
    }
    dialogVisible.value = false;
    resetForm();
    loadStats();
  });
};

const handleDelete = async (row: { id?: number | string; companyName: string }) => {
  const [confirmErr] = await to(
    ElMessageBox.confirm(
      `确定要删除客户"${row.companyName}"吗？此操作将同时删除所有跟进记录。`,
      "删除确认",
      { type: "warning", confirmButtonText: "确定删除", cancelButtonText: "取消" }
    )
  );
  if (confirmErr) return;

  const [err] = await to(customerApi.remove(row.id!));
  if (err) {
    showError(err, "删除客户失败");
    return;
  }
  showSuccess("客户删除成功");
  removeLocalItem(row.id as number);
  loadStats();
};

const getCustomerTypeTagType = (type?: string | null) => {
  const map: Record<string, string> = {
    终端: "info",
    经销商: "primary",
    待确认: "warning",
  };
  return map[type || ""] || "info";
};

const handleGoToQuotation = (item: { companyName: string }) => {
  router.push({
    path: "/quotation/history",
    query: { expandCompany: item.companyName } as Record<string, string>,
  });
};

const handleStatClick = (type: string) => {
  filterCooperationStatus.value = "";
  filterPaymentStatus.value = "";
  filterOrderStatus.value = "";
  filterInstallationStatus.value = "";
  filterCustomerType.value = "";
  if (type === "未成交") {
    filterCooperationStatus.value = "未合作";
  } else if (type === "成交") {
    filterCooperationStatus.value = "已合作";
  } else if (type === "待催款") {
    filterPaymentStatus.value = "待催款";
  } else if (type === "已结款") {
    filterPaymentStatus.value = "已结款";
  } else if (type === "已下单") {
    filterOrderStatus.value = "已下单";
  } else if (type === "未下单") {
    filterCooperationStatus.value = "已合作";
    filterOrderStatus.value = "未下单";
  } else if (type === "已安装") {
    filterOrderStatus.value = "已下单";
    filterInstallationStatus.value = "已安装";
  } else if (type === "经销商") {
    filterCustomerType.value = "经销商";
  } else if (type === "终端") {
    filterCustomerType.value = "终端";
  }
  handleSearch();
};

onMounted(() => {
  loadList();
  loadStats();
});
</script>

<style scoped>
.customer-management {
  padding: 20px;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 100px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.stat-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.stat-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.stat-undealt .stat-value {
  color: #64748b;
}

.stat-dealt .stat-value {
  color: #3b82f6;
}

.stat-pending .stat-value {
  color: #ef4444;
}

.stat-settled .stat-value {
  color: #22c55e;
}

.stat-ordered .stat-value {
  color: #8b5cf6;
}

.stat-not-ordered .stat-value {
  color: #94a3b8;
}

.stat-installed .stat-value {
  color: #10b981;
}

.stat-dealer .stat-value {
  color: #f59e0b;
}

.stat-terminal .stat-value {
  color: #06b6d4;
}

.search-filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.search-filter-row .search-bar {
  flex: 1;
  min-width: 300px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}


.quotation-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quotation-date {
  color: #67c23a;
  font-size: 13px;
  font-weight: 500;
}

.follow-up-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 4px;
}

.follow-up-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.follow-up-text {
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-up-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.follow-up-time {
  color: #909399;
  font-size: 12px;
}

/* 无跟进记录时的提示块 */
.follow-up-empty {
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.follow-up-empty:hover {
  background-color: #eff6ff;
}

.follow-up-empty-text {
  color: #3b82f6;
  font-weight: 500;
}

.delivery-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.delivery-days-value {
  color: #3b82f6;
  font-weight: 600;
  font-size: 13px;
}

.delivery-arrow {
  color: #3b82f6;
  font-weight: bold;
}

.delivery-date-label {
  color: #606266;
  font-size: 13px;
}

.delivery-date-value {
  color: #e6a23c;
  font-weight: 600;
  font-size: 13px;
}

.two-col {
  display: flex !important;
  align-items: flex-start;
  gap: 20px;
}

.two-col .col-item {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.two-col .quotation-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .two-col {
    flex-direction: column !important;
    gap: 8px !important;
  }
  .two-col .col-item {
    width: 100% !important;
    flex: none !important;
  }
}
</style>
