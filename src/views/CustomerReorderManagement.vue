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

      <CustomerReorderStats :stats="stats" :active-stat="activeStat" @stat-click="handleStatClick" />
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
            <!-- 头部：公司名 + 合作徽章 + 快捷操作 -->
            <div class="card-header" style="padding-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <h3 class="company-name" style="margin: 0; font-size: 17px; font-weight: 700;">{{ item.companyName }}</h3>
                  <!-- 合作状态 -->
                  <el-tag
                    :type="item.cooperationStatus === '已合作' ? 'success' : 'info'"
                    size="small"
                  >
                    {{ item.cooperationStatus || '未合作' }}
                  </el-tag>
                  <!-- 订单/车间状态徽章：当客户名下同时存在待排产与未开票等状态时直观展示 -->
                  <template v-if="item.cooperationStatus === '已合作'">
                    <el-tag
                      v-if="item.hasPendingScheduleOrder || item.orderStatus === '待排产'"
                      type="warning"
                      size="small"
                    >
                      待排产
                    </el-tag>
                    <el-tag
                      v-if="item.hasUninvoicedOrder"
                      type="info"
                      size="small"
                    >
                      未开票
                    </el-tag>
                  </template>
                  <!-- 结款状态 -->
                  <el-tag
                    :type="getPaymentStatus(item).type"
                    size="small"
                  >
                    {{ getPaymentStatus(item).text }}
                  </el-tag>
                </div>

                <div class="header-actions" style="display: flex; gap: 8px;">
                  <template v-if="!isGuest">
                    <AppButton
                      variant="edit"
                      @click.stop="handleEdit(item)"
                    >
                      编辑资料
                    </AppButton>
                    <AppButton
                      v-if="canDelete"
                      variant="delete"
                      @click.stop="handleDelete(item)"
                    />
                  </template>
                </div>
              </div>

              <!-- 客户属性与偏好 -->
              <div style="display: flex; gap: 6px; align-items: center;">
                <el-tag size="small" type="info">{{ item.customerType || '终端' }}</el-tag>
                <span v-if="item.shelfType" style="color: #64748b; font-size: 12px; margin-left: 6px;">常做：{{ item.shelfType }}</span>
                <span v-if="item.discountPoints" style="color: #f56c6c; font-size: 12px; margin-left: 6px;">优惠点：{{ item.discountPoints }}</span>
              </div>
            </div>

            <!-- 身体：简洁联系信息 + 工期 + 核心账目 -->
            <div class="card-body" style="padding-top: 8px;">
              <div class="info-row two-col" style="margin-bottom: 8px;">
                <div class="col-item">
                  <span class="label">对接人：</span>
                  <span class="value" style="font-weight: 600;">{{ item.customerName || "—" }}</span>
                </div>
                <div class="col-item">
                  <span class="label">联系方式：</span>
                  <span class="value">{{ item.contactInfo || "—" }}</span>
                </div>
              </div>

              <!-- 极简财务两栏（总金额 vs 欠款） -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px;">
                <div>
                  <span style="font-size: 12px; color: #64748b;">累计成交</span>
                  <div style="font-size: 16px; font-weight: 700; color: #0f172a;">¥{{ formatMoney(item.totalAmount || 0) }}</div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 12px; color: #64748b;">当前账款</span>
                  <div v-if="((item.totalAmount || 0) - (item.totalPaidAmount || 0)) > 0" style="font-size: 16px; font-weight: 700; color: #ef4444;">
                    欠 ¥{{ formatMoney((item.totalAmount || 0) - (item.totalPaidAmount || 0)) }}
                  </div>
                  <div v-else style="font-size: 15px; font-weight: 700; color: #10b981;">
                    已全部结清 ✓
                  </div>
                </div>
              </div>

              <!-- 底部一键直达抽屉按钮 -->
              <AppButton
                type="success"
                style="width: 100%; justify-content: center;"
                @click.stop="openCustomer360(item.id)"
              >
                查看历次订单与全景进展 (共 {{ item.orderCount || 0 }} 笔) →
              </AppButton>
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

    <CustomerReorderFormDrawer
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
        <FormButtons
          submit-text="保存"
          :loading="savingInvoice"
          @cancel="invoiceDialogVisible = false"
          @submit="saveInvoiceInfo"
        />
      </template>
    </el-dialog>

    <CustomerReorder360Drawer
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

          <AppButton
            v-if="hasGroupedRows"
            size="small"
            plain
            @click="toggleExpandAll"
          >
            {{ isAllExpanded ? '全部折叠' : '全部展开' }}
          </AppButton>
        </div>

        <el-input
          v-model="orderSearchKeyword"
          placeholder="搜索公司/订单/合同时间..."
          :prefix-icon="Search"
          clearable
          style="width: 220px;"
        />
      </div>

      <!-- 表格 -->
      <el-table
        ref="yearlyTableRef"
        :data="groupedYearlyList"
        row-key="rowKey"
        v-loading="yearlyLoading"
        border
        stripe
        max-height="480"
        :default-sort="{ prop: 'contractDate', order: 'descending' }"
        :row-class-name="getTableRowClassName"
        @row-click="handleYearlyRowClick"
      >
        <el-table-column label="#" width="65" align="center">
          <template #default="scope">
            <span v-if="!scope.row.isChild" style="font-weight: 500;">
              {{ getRowDisplayIndex(scope.row, scope) }}
            </span>
            <span v-else style="color: #909399; font-size: 12px;">
              {{ getRowDisplayIndex(scope.row, scope) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="contractDate" label="合同时间" min-width="120" align="center" sortable>
          <template #default="{ row }">
            <span :style="row.isGroup ? 'font-weight: 600;' : ''">
              {{ formatDateOnly(row.contractDate || row.createdAt) || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="companyName" label="公司名称" min-width="200" show-overflow-tooltip sortable>
          <template #default="{ row }">
            <template v-if="row.isGroup">
              <span style="font-weight: bold; color: var(--el-color-primary);">{{ row.companyName }}</span>
              <el-tag size="small" type="primary" round style="margin-left: 6px;">{{ row.children?.length }} 笔</el-tag>
            </template>
            <template v-else-if="row.isChild">
              <span style="color: #909399; padding-left: 8px;">↳ {{ row.companyName }}</span>
            </template>
            <template v-else>
              <span>{{ row.companyName }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="orderName" label="订单名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.isGroup">
              <span style="color: #409eff; font-size: 13px;">
                多笔汇总 ({{ row.children?.length }} 笔订单)
              </span>
            </template>
            <template v-else>
              <span>{{ row.orderName }}</span>
            </template>
          </template>
        </el-table-column>
        
        <el-table-column prop="orderAmount" label="订单金额" align="right" min-width="120" sortable>
          <template #default="{ row }">
            <span :style="{ fontWeight: row.isGroup ? 'bold' : '500' }">¥ {{ Number(row.orderAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已收金额" align="right" min-width="120" sortable>
          <template #default="{ row }">
            <span style="color: #67c23a;" :style="{ fontWeight: row.isGroup ? 'bold' : '500' }">¥ {{ Number(row.paidAmount || 0).toFixed(2) }}</span>
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
import CustomerReorderStats from './customer/CustomerReorderStats.vue';
import { onMounted, ref, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Delete, Search } from "@element-plus/icons-vue";
import { to } from "@/utils/async";
import { formatDate, formatDateOnly, getRemainingDays } from "@/utils/date";
import { formatMoney } from "@/utils/number";
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
import FormButtons from "@/components/common/FormButtons.vue";
import CustomerReorderFormDrawer from "@/components/customer/CustomerReorderFormDrawer.vue";
import CustomerReorder360Drawer from "@/components/customer/CustomerReorder360Drawer.vue";

const router = useRouter();
const { isGuest, canCreate, canDelete } = usePermissions();

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
  reorderFilter: undefined,
  orderExecutionStatus: undefined,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
});

// 模板里仍用扁平变量，这里做一层映射
const searchKeyword = computed({
  get: () => filters.keyword,
  set: (v: string) => { filters.keyword = v },
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
      // 人为控制优先：保存后立即刷新统计与列表，确保移动至对应的位置
      void refetchStats();
      void refetchList();
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
  void refetchList();
};

// 订单/车间状态（人为控制优先，待排产 vs 已下单）
const getOrderStatusTag = (item: CustomerListItem): { text: string; type: 'info' | 'warning' | 'success' | 'primary' } => {
  if (item.orderStatus === '待排产') {
    return { text: '待排产', type: 'warning' };
  }
  if (item.orderStatus === '已下单') {
    return { text: '已下单', type: 'primary' };
  }
  if ((item.orderCount || 0) > 0) {
    return { text: '已下单', type: 'primary' };
  }
  return { text: '待排产', type: 'warning' };
};

// 结款状态（人为控制优先，无手动设置时按账单欠款推导）：
//   待催款（danger）
//   已结清（success）
//   未有款项（info）
const getPaymentStatus = (item: CustomerListItem): { text: string; type: 'info' | 'danger' | 'success' } => {
  if (item.paymentStatus === '待催款') return { text: '待催款', type: 'danger' };
  if (item.paymentStatus === '已结清' || item.paymentStatus === '已结款') return { text: '已结清', type: 'success' };
  if (item.paymentStatus === '未有款项') return { text: '未有款项', type: 'info' };

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
      String(item.companyName || '').toLowerCase().includes(kw) ||
      String(item.orderName || '').toLowerCase().includes(kw) ||
      String(item.contractDate || item.createdAt || '').toLowerCase().includes(kw) ||
      String(item.customerName || '').toLowerCase().includes(kw)
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

const yearlyTableRef = ref<any>(null);
const isAllExpanded = ref(false);

const groupedYearlyList = computed(() => {
  const list = filteredYearlyList.value;
  if (!list || list.length === 0) return [];

  // 按公司名称分组：相同公司名称的订单折叠收拢为树状结构
  const map = new Map<string, any[]>();
  for (const item of list) {
    const comp = (item.companyName || '未命名公司').trim();
    const arr = map.get(comp) || [];
    arr.push(item);
    map.set(comp, arr);
  }

  const result: any[] = [];
  let itemCounter = 1;

  for (const [companyName, items] of map.entries()) {
    if (items.length === 1) {
      result.push({
        ...items[0],
        rowKey: `order-${items[0].id || itemCounter++}`,
        isGroup: false,
      });
    } else {
      const totalOrderAmount = items.reduce((sum, it) => sum + Number(it.orderAmount || 0), 0);
      const totalPaidAmount = items.reduce((sum, it) => sum + Number(it.paidAmount || 0), 0);
      const totalArrears = Math.max(0, totalOrderAmount - totalPaidAmount);

      const dates = items
        .map(it => it.contractDate || it.createdAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const latestDate = dates[0] || '';

      const sortedChildren = [...items].sort((a, b) => {
        const da = new Date(a.contractDate || a.createdAt || 0).getTime();
        const db = new Date(b.contractDate || b.createdAt || 0).getTime();
        return db - da;
      });

      result.push({
        rowKey: `company-${companyName}-${itemCounter++}`,
        isGroup: true,
        companyName,
        contractDate: latestDate,
        orderName: `多笔汇总 (${items.length} 笔订单)`,
        orderAmount: totalOrderAmount,
        paidAmount: totalPaidAmount,
        arrears: totalArrears,
        children: sortedChildren.map((it, cIdx) => ({
          ...it,
          rowKey: `child-${it.id || itemCounter}-${cIdx}`,
          isChild: true,
          childIndex: cIdx + 1,
          parentCompanyName: companyName,
        }))
      });
    }
  }

  // 默认排序：按合同时间从近到远排序（最新排在最前）
  result.sort((a, b) => {
    const da = new Date(a.contractDate || a.createdAt || 0).getTime();
    const db = new Date(b.contractDate || b.createdAt || 0).getTime();
    return db - da;
  });

  return result;
});

const getRowDisplayIndex = (row: any, scope?: any) => {
  if (row.isChild) {
    return row.childIndex ? `↳ ${row.childIndex}` : '↳';
  }
  // 优先从当前表格排好序的顶层数据中获取行号，确保无论用户如何点击表头排序，序号永远是 1, 2, 3... 严格按顺序显示
  const storeData = scope?.store?.states?.data?.value || yearlyTableRef.value?.store?.states?.data?.value;
  if (Array.isArray(storeData) && storeData.length > 0) {
    const idx = storeData.findIndex((it: any) => it.rowKey === row.rowKey);
    if (idx !== -1) return idx + 1;
  }
  const fallbackIdx = groupedYearlyList.value.findIndex((it: any) => it.rowKey === row.rowKey);
  return fallbackIdx !== -1 ? fallbackIdx + 1 : 1;
};

const hasGroupedRows = computed(() => {
  return groupedYearlyList.value.some(it => it.isGroup);
});

const toggleExpandAll = () => {
  isAllExpanded.value = !isAllExpanded.value;
  if (!yearlyTableRef.value) return;
  const groups = groupedYearlyList.value.filter(it => it.isGroup);
  for (const g of groups) {
    yearlyTableRef.value.toggleRowExpansion(g, isAllExpanded.value);
  }
};

const handleYearlyRowClick = (row: any) => {
  if (row.isGroup && yearlyTableRef.value) {
    yearlyTableRef.value.toggleRowExpansion(row);
  }
};

const getTableRowClassName = ({ row }: { row: any }) => {
  if (row.isGroup) return 'table-group-row';
  if (row.isChild) return 'table-child-row';
  return '';
};

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
  isAllExpanded.value = false;
  await fetchYearlyOrders();
};
const STATS_FILTER_MAP: Record<string, any> = {
  '已合作': { cooperationStatus: '已合作' },
  '未合作': { cooperationStatus: '未合作' },
  '待排产': { cooperationStatus: '已合作', orderStatus: '待排产' },
  '未开票': { cooperationStatus: '已合作', reorderFilter: 'uninvoiced' },
  '已下单': { cooperationStatus: '已合作', reorderFilter: 'uninvoiced' },
  '待催款': { paymentStatus: '待催款', cooperationStatus: '已合作' },
  '已结清': { paymentStatus: '已结清', cooperationStatus: '已合作' },
  '待现场安装': { orderExecutionStatus: 'pendingInstall' },
  '经销商': { customerType: '经销商' },
  '终端': { customerType: '终端' },
};

const handleStatClick = (type: string) => {
  // 支持再次点击已选卡片取消筛选（切回“全部客户”）
  if (activeStat.value === type) {
    activeStat.value = "";
    type = "";
  } else {
    activeStat.value = type;
  }

  filters.cooperationStatus = "";
  filters.paymentStatus = "";
  filters.orderStatus = "";
  filters.installationStatus = "";
  filters.customerType = "";
  filters.reorderFilter = undefined;
  filters.orderExecutionStatus = undefined;

  const map = STATS_FILTER_MAP[type];
  if (map) {
    if (map.reorderFilter) filters.reorderFilter = map.reorderFilter;
    if (map.orderExecutionStatus) filters.orderExecutionStatus = map.orderExecutionStatus;
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

:deep(.table-group-row) {
  cursor: pointer;
  background-color: #fafbfc;
}
:deep(.table-group-row:hover) {
  background-color: #f1f5f9 !important;
}
:deep(.table-child-row) {
  background-color: #fcfdfd;
}
:deep(.table-child-row:hover) {
  background-color: #f8fafc !important;
}

/* 复购财务看板样式 */
.reorder-finance-panel {
  display: flex;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 10px;
  justify-content: space-between;
  align-items: center;
}
.reorder-finance-panel .finance-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}
.reorder-finance-panel .finance-block:not(:last-child) {
  border-right: 1px solid #e2e8f0;
}
.reorder-finance-panel .f-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 2px;
}
.reorder-finance-panel .f-val {
  font-size: 13px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.reorder-finance-panel .total-amt {
  color: #1e293b;
}
.reorder-finance-panel .paid-amt {
  color: #10b981;
}
.reorder-finance-panel .arrears-amt {
  color: #ef4444;
}
.reorder-finance-panel .settled-amt {
  color: #94a3b8;
}

/* 态势胶囊栏 */
.reorder-status-radar {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  margin-bottom: 6px;
}
.reorder-status-radar .radar-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
}
.reorder-status-radar .radar-tag.ongoing {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}
.reorder-status-radar .radar-tag.done {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
.reorder-status-radar .radar-tag.warn {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.reorder-status-radar .radar-tag.pending {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}
</style>


