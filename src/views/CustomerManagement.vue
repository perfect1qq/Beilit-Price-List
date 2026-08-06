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
            active: activeStat === ''
          }"
          @click="handleStatClick('')"
        >
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">全部客户</div>
        </div>
        <div
          class="stat-card stat-undealt"
          :class="{ active: activeStat === '未成交' }"
          @click="handleStatClick('未成交')"
        >
          <div class="stat-value">{{ stats.undealt }}</div>
          <div class="stat-label">未成交</div>
        </div>
        <div
          class="stat-card stat-dealt"
          :class="{ active: activeStat === '成交' }"
          @click="handleStatClick('成交')"
        >
          <div class="stat-value">{{ stats.dealt }}</div>
          <div class="stat-label">成交</div>
        </div>
        <div
          class="stat-card stat-pending"
          :class="{ active: activeStat === '待催款' }"
          @click="handleStatClick('待催款')"
        >
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待催款</div>
        </div>
        <div
          class="stat-card stat-settled"
          :class="{ active: activeStat === '已结款' }"
          @click="handleStatClick('已结款')"
        >
          <div class="stat-value">{{ stats.settled }}</div>
          <div class="stat-label">已结款</div>
        </div>
        <div
          class="stat-card stat-not-ordered"
          :class="{ active: activeStat === '未下单' }"
          @click="handleStatClick('未下单')"
        >
          <div class="stat-value">{{ stats.notOrdered }}</div>
          <div class="stat-label">未下单</div>
        </div>
        <div
          class="stat-card stat-ordered"
          :class="{ active: activeStat === '已下单' }"
          @click="handleStatClick('已下单')"
        >
          <div class="stat-value">{{ stats.ordered }}</div>
          <div class="stat-label">已下单</div>
        </div>
        <div
          class="stat-card stat-installed"
          :class="{ active: activeStat === '已安装' }"
          @click="handleStatClick('已安装')"
        >
          <div class="stat-value">{{ stats.installed }}</div>
          <div class="stat-label">已安装</div>
        </div>
        <div
          class="stat-card stat-dealer"
          :class="{ active: activeStat === '经销商' }"
          @click="handleStatClick('经销商')"
        >
          <div class="stat-value">{{ stats.dealer }}</div>
          <div class="stat-label">经销商</div>
        </div>
        <div
          class="stat-card stat-terminal"
          :class="{ active: activeStat === '终端' }"
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
                      type="primary"
                      size="small"
                      plain
                      @click.stop="handleInvoiceInfo(item)"
                      >开票信息</el-button
                    >
                    <el-button
                      v-if="canEdit"
                      type="warning"
                      size="small"
                      plain
                      :icon="Edit"
                      @click.stop="handleEdit(item)"
                      >编辑</el-button
                    >
                    <el-button
                      v-if="canDelete"
                      type="danger"
                      size="small"
                      plain
                      :icon="Delete"
                      @click.stop="handleDelete(item)"
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
                >
                  {{ item.orderStatus || "未下单" }}
                </el-tag>
                <!-- 安装状态 -->
                <el-tag
                  :type="item.installationStatus === '已安装' ? 'success' : 'info'"
                  size="small"
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
                @click.stop="handleViewFollowUps(item)"
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
                  @click.stop="handleViewFollowUps(item)"
                  >跟进记录</el-button
                >
                <el-button
                  v-if="item.cooperationStatus === '已合作'"
                  type="primary"
                  size="small"
                  round
                  plain
                  @click.stop="handleRepurchase(item)"
                  >复购记录</el-button
                >
                <el-button
                  v-if="item.hasQuotation"
                  type="primary"
                  size="small"
                  round
                  plain
                  @click.stop="handleNavigateTo('quotation', item.companyName)"
                  >查看报价单{{ Number(item.quotationCount) > 1 ? ` (${item.quotationCount})` : '' }}</el-button
                >
                <el-button
                  v-if="item.hasContract"
                  type="primary"
                  size="small"
                  round
                  plain
                  @click.stop="handleNavigateTo('contract', item.companyName)"
                  >查看合同{{ Number(item.contractCount) > 1 ? ` (${item.contractCount})` : '' }}</el-button
                >
                <el-button
                  v-if="item.hasPlacementOrder"
                  type="primary"
                  size="small"
                  round
                  plain
                  @click.stop="handleNavigateTo('order', item.companyName)"
                  >查看下单{{ Number(item.placementOrderCount) > 1 ? ` (${item.placementOrderCount})` : '' }}</el-button
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
      ref="customerFormDrawerRef"
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
      @order-change="handleRecordChange"
    />

    <FollowUpHistoryDrawer
      v-model="followUpHistoryVisible"
      :customer-id="currentCustomer?.id || 0"
      :customer-name="currentCustomer?.companyName || ''"
      :follow-ups="currentCustomer?.followUps || []"
      :can-create="canCreate"
      :is-guest="isGuest"
      @follow-up-change="handleRecordChange"
    />

    <el-dialog v-model="invoiceDialogVisible" title="开票信息" width="500px">
      <el-input
        v-model="invoiceText"
        type="textarea"
        :rows="8"
        placeholder="请在此粘贴客户发来的整段发票信息..."
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="invoiceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveInvoiceInfo" :loading="savingInvoice">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
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

// 客户表单抽屉引用：用于父组件完成异步后关闭按钮 loading
const customerFormDrawerRef = ref<{ resetLoading: () => void } | null>(null);

// 局部同步：刷新客户详情并更新列表中对应项（跟进/复购/编辑后调用）
const syncCustomerToList = async (
  id: number,
  updateResult?: Awaited<ReturnType<typeof customerApi.update>> | null,
) => {
  const detail = await refreshCurrentCustomer(id);
  if (detail) {
    const current = customerList.value.find((c) => c.id === id);
    updateLocalItem(id, buildListPatchFromDetail(detail, current, updateResult?.customer));
  }
};

const handleRecordChange = async () => {
  const id = currentCustomer.value?.id;
  if (!id) return;
  await syncCustomerToList(id);
};

const openDrawerWithDetail = async (item: CustomerListItem, drawerRef: { value: boolean }, errorMsg: string) => {
  try {
    const res = await customerApi.getDetail(item.id);
    currentCustomer.value = res?.customer || null;
    drawerRef.value = true;
  } catch (err) {
    showError(err, errorMsg);
  }
};

// 复购记录抽屉
const orderHistoryVisible = ref(false);
const handleRepurchase = (item: CustomerListItem) => openDrawerWithDetail(item, orderHistoryVisible, "加载复购记录失败");

// 跟进记录抽屉
const followUpHistoryVisible = ref(false);
const handleViewFollowUps = (item: CustomerListItem) => openDrawerWithDetail(item, followUpHistoryVisible, "加载跟进记录失败");

const handleFormSubmit = async (data: CustomerCreatePayload & CustomerUpdatePayload) => {
  await withSubmitLock(async () => {
    try {
      if (editingId.value) {
        const id = editingId.value;
        const [err, updateResult] = await to(customerApi.update(id, { ...data }));
        if (err) {
          showError(err, "更新客户失败");
          return;
        }
        // 局部更新当前卡片，报价单字段用 update 返回值（基于新公司名重算）
        await syncCustomerToList(id, updateResult);
        showSuccess("客户更新成功");
      } else {
        const [err] = await to(customerApi.create({ ...data }));
        if (err) {
          showError(err, "创建客户失败");
          return;
        }
        showSuccess("客户创建成功");
        loadList();
      }
      dialogVisible.value = false;
      resetForm();
      loadStats();
    } finally {
      customerFormDrawerRef.value?.resetLoading();
    }
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

const handleNavigateTo = (type: 'quotation' | 'contract' | 'order', companyName: string) => {
  const routeMap = {
    quotation: { path: '/quotation/history', queryKey: 'keyword' },
    contract: { path: '/contract/history', queryKey: 'keyword' },
    order: { path: '/order/history', queryKey: 'keyword' }
  }
  const config = routeMap[type]
  if (config) {
    router.push({
      path: config.path,
      query: { [config.queryKey]: companyName } as Record<string, string>
    })
  }
}

const invoiceDialogVisible = ref(false);
const invoiceText = ref("");
const savingInvoice = ref(false);

const handleInvoiceInfo = async (item: CustomerListItem) => {
  try {
    const res = await customerApi.getDetail(item.id);
    currentCustomer.value = res?.customer || null;
    invoiceText.value = res?.customer?.invoiceInfo || "";
    invoiceDialogVisible.value = true;
  } catch (err) {
    showError(err, "加载客户信息失败");
  }
};

const saveInvoiceInfo = async () => {
  const id = currentCustomer.value?.id;
  if (!id) return;
  savingInvoice.value = true;
  const [err, updateResult] = await to(customerApi.update(id, { invoiceInfo: invoiceText.value }));
  savingInvoice.value = false;
  if (err) {
    showError(err, "保存开票信息失败");
    return;
  }
  showSuccess("开票信息保存成功");
  invoiceDialogVisible.value = false;
  await syncCustomerToList(id, updateResult);
};

const STATS_FILTER_MAP: Record<string, any> = {
  '未成交': { cooperationStatus: '未合作' },
  '成交': { cooperationStatus: '已合作' },
  '待催款': { paymentStatus: '待催款' },
  '已结款': { paymentStatus: '已结款' },
  '未下单': { cooperationStatus: '已合作', orderStatus: '未下单' },
  '已下单': { orderStatus: '已下单' },
  '已安装': { orderStatus: '已下单', installationStatus: '已安装' },
  '经销商': { customerType: '经销商' },
  '终端': { customerType: '终端' },
};

const activeStat = computed(() => {
  const c = filterCooperationStatus.value;
  const p = filterPaymentStatus.value;
  const o = filterOrderStatus.value;
  const i = filterInstallationStatus.value;
  const t = filterCustomerType.value;

  if (!c && !p && !o && !i && !t) return '';
  if (c === '未合作' && !p && !o && !i && !t) return '未成交';
  if (c === '已合作' && !p && !o && !i && !t) return '成交';
  if (p === '待催款' && !c && !o && !i && !t) return '待催款';
  if (p === '已结款' && !c && !o && !i && !t) return '已结款';
  if (c === '已合作' && o === '未下单' && !p && !i && !t) return '未下单';
  if (o === '已下单' && !c && !p && !i && !t) return '已下单';
  if (o === '已下单' && i === '已安装' && !c && !p && !t) return '已安装';
  if (t === '经销商' && !c && !p && !o && !i) return '经销商';
  if (t === '终端' && !c && !p && !o && !i) return '终端';
  return null;
});

const handleStatClick = (type: string) => {
  filterCooperationStatus.value = "";
  filterPaymentStatus.value = "";
  filterOrderStatus.value = "";
  filterInstallationStatus.value = "";
  filterCustomerType.value = "";
  
  const map = STATS_FILTER_MAP[type];
  if (map) {
    if (map.cooperationStatus) filterCooperationStatus.value = map.cooperationStatus;
    if (map.paymentStatus) filterPaymentStatus.value = map.paymentStatus;
    if (map.orderStatus) filterOrderStatus.value = map.orderStatus;
    if (map.installationStatus) filterInstallationStatus.value = map.installationStatus;
    if (map.customerType) filterCustomerType.value = map.customerType;
  }
  
  handleSearch();
};

onMounted(async () => {
  await Promise.allSettled([
    loadList(),
    loadStats()
  ]);
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
  color: #409eff;
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
