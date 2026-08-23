<template>
  <div class="customer-management">
    <el-card shadow="never">
      <template #header>
        <CardHeader title="客户管理">
          <template #actions>
            <AppButton variant="add" v-if="canCreate" @click="handleAdd">
              新增客户
            </AppButton>
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
                    <AppButton
                      v-if="canDelete"
                      type="danger"
                      size="small"
                      plain
                      :icon="Delete"
                      @click.stop="handleDelete(item)"
                      >删除</AppButton
                    >
                    <AppButton
                      type="success"
                      size="small"
                      @click.stop="openCustomer360(item.id)"
                      >进入全景管家</AppButton
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

              <div class="financial-summary-box" v-if="item.totalAmount && item.totalAmount > 0">
                <div class="financial-item">
                  <span class="label">订单总额</span>
                  <span class="value">¥{{ item.totalAmount.toLocaleString() }}</span>
                </div>
                <div class="financial-item">
                  <span class="label">已付/预付</span>
                  <span class="value">¥{{ (item.totalPaidAmount || 0).toLocaleString() }}</span>
                </div>
                <div class="financial-item debt">
                  <span class="label">剩余欠款</span>
                  <span class="value">¥{{ ((item.totalAmount || 0) - (item.totalPaidAmount || 0)).toLocaleString() }}</span>
                </div>
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
                <span v-if="item.deliveryDate" class="delivery-remaining" :class="getRemainingClass(item.deliveryDate)">({{ getRemainingText(item.deliveryDate) }})</span>
              </div>
              <div class="info-row delivery-info">
                <span class="label">车间工期：</span>
                <span class="delivery-days-value">{{ item.workshopDeliveryDays && item.workshopDeliveryDays > 0 ? item.workshopDeliveryDays + '天' : '—' }}</span>
                <span class="delivery-arrow">→</span>
                <span class="delivery-date-label">预计完成：</span>
                <span class="delivery-date-value">{{ item.workshopDeliveryDate || '—' }}</span>
                <span v-if="item.workshopDeliveryDate" class="delivery-remaining" :class="getRemainingClass(item.workshopDeliveryDate)">({{ getRemainingText(item.workshopDeliveryDate) }})</span>
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

          </div>
        </template>

        <template #empty-action>
          <AppButton v-if="canCreate" type="primary" @click="handleAdd"
            >立即添加客户</AppButton
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
          <AppButton @click="invoiceDialogVisible = false">取消</AppButton>
          <AppButton variant="save" @click="saveInvoiceInfo" :loading="savingInvoice">保存</AppButton>
        </span>
      </template>
    </el-dialog>

    <Customer360Drawer
      v-model="customer360Visible"
      :customer-id="selectedCustomer360Id"
      @data-changed="handleRecordChange"
      @edit="handleEdit"
      @invoice="handleInvoiceInfo"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
import { to } from "@/utils/async";
import { formatDate, getRemainingDays } from "@/utils/date";
import { showError, showSuccess } from "@/utils/message";
import { usePermissions } from "@/composables/usePermissions";
import { useCustomerForm } from "@/composables/useCustomer";
import {
  useCustomerListQuery,
  useCustomerStatsQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useCreateCustomerMutation,
  type CustomerListFilters,
} from "@/composables/useCustomerQueries";
import type {
  CustomerCreatePayload,
  CustomerUpdatePayload,
  CustomerListItem,
  FollowUpData,
} from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/constants/table";

import SearchBar from "@/components/common/SearchBar.vue";
import CardHeader from "@/components/common/CardHeader.vue";
import CardList from "@/components/common/CardList.vue";
import CustomerFormDrawer from "@/components/customer/CustomerFormDrawer.vue";
import FollowUpHistoryDrawer from "@/components/customer/FollowUpHistoryDrawer.vue";
import Customer360Drawer from "@/components/customer/Customer360Drawer.vue";

const router = useRouter();
const { isGuest, isAdmin, canCreate, canEdit, canDelete } = usePermissions();

const customer360Visible = ref(false);
const selectedCustomer360Id = ref<number | null>(null);

// ---- 查询过滤器（响应式，变化时自动重新请求） ----
const filters = reactive<CustomerListFilters>({
  keyword: "",
  cooperationStatus: "",
  customerType: "",
  paymentStatus: "",
  orderStatus: "",
  installationStatus: "",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
});

// 模板里仍用扁平变量，这里做一层映射
const searchKeyword = computed({
  get: () => filters.keyword,
  set: (v: string) => { filters.keyword = v },
});
const filterCooperationStatus = computed({
  get: () => filters.cooperationStatus,
  set: (v: string) => { filters.cooperationStatus = v; filters.page = 1 },
});
const filterCustomerType = computed({
  get: () => filters.customerType,
  set: (v: string) => { filters.customerType = v; filters.page = 1 },
});
const filterPaymentStatus = computed({
  get: () => filters.paymentStatus,
  set: (v: string) => { filters.paymentStatus = v; filters.page = 1 },
});
const filterOrderStatus = computed({
  get: () => filters.orderStatus,
  set: (v: string) => { filters.orderStatus = v; filters.page = 1 },
});
const filterInstallationStatus = computed({
  get: () => filters.installationStatus,
  set: (v: string) => { filters.installationStatus = v; filters.page = 1 },
});
const page = computed({
  get: () => filters.page,
  set: (v: number) => { filters.page = v },
});
const pageSize = computed({
  get: () => filters.pageSize,
  set: (v: number) => { filters.pageSize = v; filters.page = 1 },
});

// ---- vue-query 查询 ----
// filters 是 reactive，MaybeRefOrGetter 会通过 toValue 自动解包并追踪变化
const { data: listData, isLoading: loading, refetch: refetchList } = useCustomerListQuery(
  () => ({ ...filters }),
);
const { data: statsData, refetch: refetchStats } = useCustomerStatsQuery();

// 列表/统计 computed（给模板用，保持模板兼容）
const customerList = computed<CustomerListItem[]>(() => listData.value?.list || []);
const total = computed(() => listData.value?.total || 0);
const stats = computed(() => statsData.value || {
  total: 0, undealt: 0, dealt: 0, pending: 0, settled: 0,
  ordered: 0, notOrdered: 0, pendingInstall: 0, installed: 0,
  dealer: 0, terminal: 0,
});

const handleSearch = () => {
  filters.page = 1;
  void refetchList();
};

const handleResetFilter = () => {
  filters.keyword = "";
  filters.cooperationStatus = "";
  filters.customerType = "";
  filters.paymentStatus = "";
  filters.orderStatus = "";
  filters.installationStatus = "";
  filters.page = 1;
  void refetchList();
};

// ---- 表单状态（沿用旧 composable，只管 UI 状态） ----
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

// 客户表单抽屉引用
const customerFormDrawerRef = ref<{ resetLoading: () => void } | null>(null);

// ---- mutations ----
const updateMutation = useUpdateCustomerMutation();
const createMutation = useCreateCustomerMutation();
const deleteMutation = useDeleteCustomerMutation();

// 360 抽屉数据变更后，列表和统计会因 invalidateQueries 自动刷新
// 这里只需保证抽屉关闭时 refetchStats，统计数字同步
const handleRecordChange = () => {
  void refetchStats();
};

const openDrawerWithDetail = async (item: CustomerListItem, drawerRef: { value: boolean }, _errorMsg: string) => {
  // 详情由 360 抽屉自行用 useCustomerDetailQuery 加载，这里只控制显隐
  selectedCustomer360Id.value = item.id;
  drawerRef.value = true;
};

// 跟进记录抽屉
const followUpHistoryVisible = ref(false);
const handleViewFollowUps = (item: CustomerListItem) => openDrawerWithDetail(item, followUpHistoryVisible, "加载跟进记录失败");

const openCustomer360 = (id: number) => {
  selectedCustomer360Id.value = id;
  customer360Visible.value = true;
};

const handleFormSubmit = async (data: CustomerCreatePayload & CustomerUpdatePayload) => {
  await withSubmitLock(async () => {
    try {
      if (editingId.value) {
        const [err] = await to(updateMutation.mutateAsync({ id: editingId.value, data }));
        if (err) { showError(err, "更新客户失败"); return; }
        showSuccess("客户更新成功");
      } else {
        const [err] = await to(createMutation.mutateAsync({ ...data }));
        if (err) { showError(err, "创建客户失败"); return; }
        showSuccess("客户创建成功");
      }
      dialogVisible.value = false;
      resetForm();
      // vue-query 的 onSuccess 已 invalidate，这里手动 refetch 统计确保即时
      void refetchStats();
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

  const [err] = await to(deleteMutation.mutateAsync(row.id as number));
  if (err) { showError(err, "删除客户失败"); return; }
  showSuccess("客户删除成功");
  void refetchStats();
};

const getRemainingClass = (dateStr: string) => {
  const days = getRemainingDays(dateStr);
  if (days === null) return "";
  if (days < 0) return "overdue";
  if (days <= 3) return "urgent";
  return "normal";
};

const getRemainingText = (dateStr: string) => {
  const days = getRemainingDays(dateStr);
  if (days === null) return "";
  if (days < 0) return `逾期${Math.abs(days)}天`;
  if (days === 0) return "今天到期";
  return `剩${days}天`;
};

const invoiceDialogVisible = ref(false);
const invoiceText = ref("");
const savingInvoice = ref(false);

const handleInvoiceInfo = async (item: any) => {
  try {
    selectedCustomer360Id.value = item.id;
    const customerApi = (await import("@/api/customer")).default;
    const res = await customerApi.getDetail(item.id);
    invoiceText.value = res?.customer?.invoiceInfo || "";
    invoiceDialogVisible.value = true;
  } catch (err) {
    showError(err, "加载客户信息失败");
  }
};

const saveInvoiceInfo = async () => {
  const id = selectedCustomer360Id.value;
  if (!id) return;
  savingInvoice.value = true;
  const [err] = await to(updateMutation.mutateAsync({ id, data: { invoiceInfo: invoiceText.value } }));
  savingInvoice.value = false;
  if (err) { showError(err, "保存开票信息失败"); return; }
  showSuccess("开票信息保存成功");
  invoiceDialogVisible.value = false;
  void refetchStats();
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
  const c = filters.cooperationStatus;
  const p = filters.paymentStatus;
  const o = filters.orderStatus;
  const i = filters.installationStatus;
  const t = filters.customerType;

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
  filters.cooperationStatus = "";
  filters.paymentStatus = "";
  filters.orderStatus = "";
  filters.installationStatus = "";
  filters.customerType = "";

  const map = STATS_FILTER_MAP[type];
  if (map) {
    if (map.cooperationStatus) filters.cooperationStatus = map.cooperationStatus;
    if (map.paymentStatus) filters.paymentStatus = map.paymentStatus;
    if (map.orderStatus) filters.orderStatus = map.orderStatus;
    if (map.installationStatus) filters.installationStatus = map.installationStatus;
    if (map.customerType) filters.customerType = map.customerType;
  }
  filters.page = 1;
  void refetchList();
};

// 模板里使用的 loading / customerList / stats / total 已通过 computed 暴露
// vue-query 会在组件挂载时自动发起请求，无需 onMounted 手动触发
onMounted(() => {
  void refetchStats();
});
</script>

<style scoped>
.customer-management {
  height: 100%;
}

.financial-summary-box {
  display: flex;
  justify-content: space-between;
  background-color: #fff8e6;
  border: 1px solid #fae3b7;
  border-radius: 6px;
  padding: 10px 12px;
  margin: 10px 0;
}
.financial-summary-box .financial-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.financial-summary-box .financial-item .label {
  font-size: 12px;
  color: #909399;
}
.financial-summary-box .financial-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.financial-summary-box .financial-item.debt .value {
  color: #f56c6c;
  font-size: 15px;
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

.delivery-remaining {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 600;
}
.text-danger {
  color: #f56c6c;
}
.text-warning {
  color: #e6a23c;
}
.text-success {
  color: #67c23a;
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


