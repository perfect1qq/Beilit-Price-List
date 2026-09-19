<template>
  <div class="customer-management">
    <el-card shadow="never">
      <template #header>
        <CardHeader title="客户管理">
          <template #actions>
            <AppButton @click="handleViewYearlyOrders" plain type="warning">查看所有订单</AppButton>
            <AppButton variant="add" v-if="canCreate" @click="handleAdd">
              新增客户
            </AppButton>
          </template>
        </CardHeader>
      </template>

      <CustomerStats :stats="stats" :active-stat="activeStat" @stat-click="handleStatClick" />
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
                  :type="item.cooperationStatus === CooperationStatus.COOPERATED ? 'success' : 'warning'"
                  size="small"
                >
                  {{ item.cooperationStatus || "未合作" }}
                </el-tag>
                <!-- 客户类型 -->
                <el-tag
                  :type="item.customerType === CustomerType.DEALER ? 'primary' : 'info'"
                  size="small"
                >
                  {{ item.customerType || "终端" }}
                </el-tag>
                <!-- 结款状态：基于剩余欠款金额动态计算 -->
                <el-tag :type="getPaymentStatus(item).type" size="small">
                  {{ getPaymentStatus(item).text }}
                </el-tag>
                <!-- 下单状态 -->
                <el-tag
                  :type="item.orderStatus === OrderStatus.ORDERED ? 'primary' : 'info'"
                  size="small"
                >
                  {{ item.orderStatus || "未下单" }}
                </el-tag>
                <!-- 安装状态 -->
                <el-tag
                  :type="item.installationStatus === InstallationStatus.INSTALLED ? 'success' : 'info'"
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
                <span v-if="item.deliveryDate" class="delivery-remaining" :class="getRemainingClass(item.deliveryDate, item.installationStatus)">({{ getRemainingText(item.deliveryDate, item.installationStatus) }})</span>
              </div>
              <div class="info-row delivery-info">
                <span class="label">车间工期：</span>
                <span class="delivery-days-value">{{ item.workshopDeliveryDays && item.workshopDeliveryDays > 0 ? item.workshopDeliveryDays + '天' : '—' }}</span>
                <span class="delivery-arrow">→</span>
                <span class="delivery-date-label">预计完成：</span>
                <span class="delivery-date-value">{{ item.workshopDeliveryDate || '—' }}</span>
                <span v-if="item.workshopDeliveryDate" class="delivery-remaining" :class="getRemainingClass(item.workshopDeliveryDate, item.installationStatus)">({{ getRemainingText(item.workshopDeliveryDate, item.installationStatus) }})</span>
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
    <el-dialog v-model="yearlyDialogVisible" title="所有订单明细与欠款统计" width="1050px" top="8vh">
      <!-- 顶部筛选与搜索栏 -->
      <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <el-radio-group v-model="arrearsFilterType" size="default">
            <el-radio-button value="all">全部 ({{ rawYearlyList.length }})</el-radio-button>
            <el-radio-button value="hasArrears">
              <span style="color: #f56c6c; font-weight: 600;">仅看欠款 ({{ countWithArrears }})</span>
            </el-radio-button>
            <el-radio-button value="settled">已结清 ({{ countSettled }})</el-radio-button>
          </el-radio-group>

          <el-date-picker
            v-model="orderFilterDate"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="YYYY-MM"
            @change="fetchYearlyOrders"
            clearable
            style="width: 240px;"
          />
        </div>

        <el-input
          v-model="orderSearchKeyword"
          placeholder="搜索客户/公司/订单..."
          :prefix-icon="Search"
          clearable
          style="width: 220px;"
        />
      </div>

      <!-- 表格 -->
      <el-table
        :data="filteredYearlyList"
        v-loading="yearlyLoading"
        border
        stripe
        max-height="480"
        :default-sort="{ prop: 'arrears', order: 'descending' }"
      >
        <el-table-column type="index" label="#" width="55" align="center" />
        <el-table-column prop="customerName" label="客户名称" min-width="110" show-overflow-tooltip sortable />
        <el-table-column prop="companyName" label="公司名称" min-width="180" show-overflow-tooltip sortable />
        <el-table-column prop="orderName" label="订单名称" min-width="120" show-overflow-tooltip />
        
        <el-table-column prop="orderAmount" label="订单金额" align="right" min-width="120" sortable>
          <template #default="{ row }">
            <span style="font-weight: 500;">¥ {{ Number(row.orderAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已收金额" align="right" min-width="120" sortable>
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: 500;">¥ {{ Number(row.paidAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="arrears" label="欠款金额" align="right" min-width="130" sortable>
          <template #default="{ row }">
            <span v-if="row.arrears > 0" style="color: #f56c6c; font-weight: bold; background: #fef0f0; padding: 3px 8px; border-radius: 4px; border: 1px solid #fde2e2;">
              ¥ {{ Number(row.arrears || 0).toFixed(2) }}
            </span>
            <span v-else style="color: #67c23a; font-weight: 500; background: #f0f9eb; padding: 3px 8px; border-radius: 4px; border: 1px solid #e1f3d8;">
              已结清
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部统计栏（支持点击快捷过滤） -->
      <div class="yearly-summary-bar">
        <div
          class="summary-card clickable"
          :class="{ active: arrearsFilterType === 'all' }"
          @click="arrearsFilterType = 'all'"
          title="点击查看全部订单"
        >
          <span class="summary-lbl">订单数</span>
          <span class="summary-val" style="color: #409EFF">{{ currentSummary.orderCount }} 笔</span>
        </div>
        <div class="summary-card">
          <span class="summary-lbl">总金额</span>
          <span class="summary-val" style="color: #e6a23c">¥ {{ Number(currentSummary.totalOrderAmount || 0).toFixed(2) }}</span>
        </div>
        <div
          class="summary-card clickable"
          :class="{ active: arrearsFilterType === 'settled' }"
          @click="arrearsFilterType = 'settled'"
          title="点击仅看已结清"
        >
          <span class="summary-lbl">已收总额</span>
          <span class="summary-val" style="color: #67c23a">¥ {{ Number(currentSummary.totalPaidAmount || 0).toFixed(2) }}</span>
        </div>
        <div
          class="summary-card clickable"
          :class="{ active: arrearsFilterType === 'hasArrears' }"
          @click="arrearsFilterType = 'hasArrears'"
          title="点击快速筛选仅看欠款"
        >
          <span class="summary-lbl" style="color: #f56c6c;">欠款合计 (点击仅看欠款)</span>
          <span class="summary-val" style="color: #f56c6c">¥ {{ Number(currentSummary.totalArrears || 0).toFixed(2) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { CooperationStatus, CustomerType, PaymentStatus, OrderStatus, InstallationStatus } from '@/constants/enums';
import CustomerStats from './customer/CustomerStats.vue';
import PagePagination from '@/components/common/PagePagination.vue';
import { onMounted, ref, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Search } from "@element-plus/icons-vue";
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
} from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/constants/table";

import SearchBar from "@/components/common/SearchBar.vue";
import CardHeader from "@/components/common/CardHeader.vue";
import CardList from "@/components/common/CardList.vue";
import CustomerFormDrawer from "@/components/customer/CustomerFormDrawer.vue";
import Customer360Drawer from "@/components/customer/Customer360Drawer.vue";

const router = useRouter();
const { isGuest, isAdmin, canCreate, canEdit, canDelete } = usePermissions();

const activeStat = ref("");
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

// 根据剩余欠款金额动态计算结款状态：
//   无订单款项 → 未有款项（info）
//   剩余欠款 > 0 → 待催款（danger）
//   剩余欠款 = 0 → 已结款（success）
const getPaymentStatus = (item: CustomerListItem): { text: string; type: 'info' | 'danger' | 'success' } => {
  const total = item.totalAmount || 0;
  const paid = item.totalPaidAmount || 0;
  if (total === 0) return { text: PaymentStatus.NONE, type: 'info' };
  return total - paid > 0 ? { text: '待催款', type: 'danger' } : { text: PaymentStatus.PAID, type: 'success' };
};

const getRemainingClass = (dateStr: string, installationStatus?: string) => {
  if (installationStatus === InstallationStatus.INSTALLED) return "text-success";
  const days = getRemainingDays(dateStr);
  if (days === null) return "";
  if (days < 0) return "overdue";
  if (days <= 3) return "urgent";
  return "normal";
};

const getRemainingText = (dateStr: string, installationStatus?: string) => {
  if (installationStatus === InstallationStatus.INSTALLED) return "已完工";
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

const yearlyDialogVisible = ref(false);
const yearlyLoading = ref(false);
const rawYearlyList = ref<any[]>([]);
const orderFilterDate = ref<[string, string] | null>(null);
const arrearsFilterType = ref<'all' | 'hasArrears' | 'settled'>('all');
const orderSearchKeyword = ref('');

const countWithArrears = computed(() => {
  return rawYearlyList.value.filter(item => Number(item.arrears || 0) > 0).length;
});

const countSettled = computed(() => {
  return rawYearlyList.value.filter(item => Number(item.arrears || 0) <= 0).length;
});

const filteredYearlyList = computed(() => {
  let list = rawYearlyList.value;

  if (arrearsFilterType.value === 'hasArrears') {
    list = list.filter(item => Number(item.arrears || 0) > 0);
  } else if (arrearsFilterType.value === 'settled') {
    list = list.filter(item => Number(item.arrears || 0) <= 0);
  }

  const kw = orderSearchKeyword.value.trim().toLowerCase();
  if (kw) {
    list = list.filter(item => 
      String(item.customerName || '').toLowerCase().includes(kw) ||
      String(item.companyName || '').toLowerCase().includes(kw) ||
      String(item.orderName || '').toLowerCase().includes(kw)
    );
  }

  return list;
});

const currentSummary = computed(() => {
  const list = filteredYearlyList.value;
  return list.reduce((acc, cur) => {
    const orderAmount = Number(cur.orderAmount || 0);
    const paidAmount = Number(cur.paidAmount || 0);
    const arrears = Math.max(0, orderAmount - paidAmount);

    acc.orderCount += 1;
    acc.totalOrderAmount += orderAmount;
    acc.totalPaidAmount += paidAmount;
    acc.totalArrears += arrears;
    return acc;
  }, {
    orderCount: 0,
    totalOrderAmount: 0,
    totalPaidAmount: 0,
    totalArrears: 0
  });
});

const fetchYearlyOrders = async () => {
  yearlyLoading.value = true;
  try {
    const customerApi = (await import("@/api/customer")).default;
    const params: any = {};
    if (orderFilterDate.value && orderFilterDate.value.length === 2) {
      params.startMonth = orderFilterDate.value[0];
      params.endMonth = orderFilterDate.value[1];
    }
    const res = await customerApi.getYearlyOrderStats(params);
    rawYearlyList.value = res?.list || [];
  } catch (err) {
    showError(err, "加载订单明细失败");
  } finally {
    yearlyLoading.value = false;
  }
};

const handleViewYearlyOrders = async (defaultFilter: 'all' | 'hasArrears' | 'settled' = 'all') => {
  yearlyDialogVisible.value = true;
  orderFilterDate.value = null;
  arrearsFilterType.value = defaultFilter;
  orderSearchKeyword.value = '';
  await fetchYearlyOrders();
};
const STATS_FILTER_MAP: Record<string, any> = {
  '未成交': { cooperationStatus: CooperationStatus.UNCOOPERATED },
  '成交': { cooperationStatus: CooperationStatus.COOPERATED },
  '待催款': { paymentStatus: '待催款', cooperationStatus: CooperationStatus.COOPERATED },
  [PaymentStatus.PAID]: { paymentStatus: PaymentStatus.PAID, cooperationStatus: CooperationStatus.COOPERATED },
  [OrderStatus.NOT_ORDERED]: { cooperationStatus: CooperationStatus.COOPERATED, orderStatus: OrderStatus.NOT_ORDERED },
  [OrderStatus.ORDERED]: { orderStatus: OrderStatus.ORDERED, cooperationStatus: CooperationStatus.COOPERATED },
  [InstallationStatus.INSTALLED]: { orderStatus: OrderStatus.ORDERED, installationStatus: InstallationStatus.INSTALLED, cooperationStatus: CooperationStatus.COOPERATED },
  [CustomerType.DEALER]: { customerType: CustomerType.DEALER },
  '终端': { customerType: '终端' },
};

const handleStatClick = (type: string) => {
  activeStat.value = type;
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

.yearly-summary-bar {
  margin-top: 15px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 12px;
}
.yearly-summary-bar .summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
}
.yearly-summary-bar .summary-card.clickable {
  cursor: pointer;
  border: 1px solid transparent;
}
.yearly-summary-bar .summary-card.clickable:hover {
  background: #e2e8f0;
}
.yearly-summary-bar .summary-card.active {
  background: #eff6ff;
  border-color: #93c5fd;
}
.yearly-summary-bar .summary-lbl {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
.yearly-summary-bar .summary-val {
  font-size: 16px;
  font-weight: 700;
}
</style>


