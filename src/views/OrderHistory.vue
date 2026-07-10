<template>
  <div class="order-history">
    <el-card shadow="never">
      <template #header>
        <div class="header-content">
          <span class="title">订单历史记录</span>
          <el-button type="primary" :icon="Plus" @click="goToNewOrder" v-if="!isGuest">
            新增下单
          </el-button>
        </div>
      </template>

      <!-- 搜索过滤条 -->
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="搜索订单号、客户名称、联系人或送货地址..."
          :prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 320px;"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="orderList" v-loading="loading" border style="width: 100%" stripe>
        <el-table-column prop="orderNo" label="订单编号" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="order-no-link" @click="viewOrder(row.id)">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="contactPerson" label="联系人" width="100" show-overflow-tooltip />
        <el-table-column prop="phone" label="联系电话" width="120" show-overflow-tooltip />
        <el-table-column prop="deliveryAddress" label="送货地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="orderDate" label="订单日期" width="120" show-overflow-tooltip />
        <el-table-column prop="deliveryDays" label="工期" width="90" show-overflow-tooltip />
        <el-table-column prop="ownerName" label="创建者" width="100" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="录入时间" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" link :icon="View" @click="viewOrder(row.id)">
                查看
              </el-button>
              <el-button type="warning" size="small" link :icon="Edit" @click="editOrder(row.id)" v-if="!isGuest && canModify(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" link :icon="Delete" @click="confirmDelete(row)" v-if="!isGuest && canModify(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单排版详情预览抽屉/弹窗 -->
    <el-dialog v-model="previewVisible" title="订单详情" width="800px" destroy-on-close append-to-body>
      <!-- 嵌入打印版面 -->
      <div id="print-area" class="order-sheet-paper" v-if="currentOrder">
        <div class="sheet-header">
          <div class="company-brand">倍力特金属制品有限公司</div>
          <div class="sheet-title">生 产 加 工 单</div>
          <div class="sheet-order-no">订单编号：{{ currentOrder.orderNo }}</div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="meta-label">客户名称</td>
            <td class="meta-value" colspan="3"><strong>{{ currentOrder.customerName }}</strong></td>
            <td class="meta-label">订单日期</td>
            <td class="meta-value">{{ currentOrder.orderDate }}</td>
          </tr>
          <tr>
            <td class="meta-label">联系人</td>
            <td class="meta-value">{{ currentOrder.contactPerson || '-' }}</td>
            <td class="meta-label">联系电话</td>
            <td class="meta-value">{{ currentOrder.phone || '-' }}</td>
            <td class="meta-label">传真号码</td>
            <td class="meta-value">{{ currentOrder.fax || '-' }}</td>
          </tr>
          <tr>
            <td class="meta-label">送货地址</td>
            <td class="meta-value" colspan="5">{{ currentOrder.deliveryAddress || '-' }}</td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50px;">序号</th>
              <th>品名</th>
              <th>规格</th>
              <th>用料</th>
              <th>颜色</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in currentOrderItems" :key="index">
              <td class="text-center">{{ index + 1 }}</td>
              <td><strong>{{ item.name || '-' }}</strong></td>
              <td>
                {{ item.spec || '-' }}
                <span v-if="item.qty" class="spec-qty-suffix"> = {{ item.qty }}</span>
              </td>
              <td>{{ item.material || '-' }}</td>
              <td class="text-center">{{ item.color || '-' }}</td>
              <td class="remark-col">{{ item.other || '-' }}</td>
            </tr>
          </tbody>
        </table>

        <div class="accessories-section" v-if="currentOrderAccessories.length > 0">
          <div class="block-title">【配套配件明细】</div>
          <div class="accessories-grid">
            <div v-for="(acc, index) in currentOrderAccessories" :key="index" class="accessory-item">
              <span class="acc-num">{{ index + 1 }}.</span>
              <span class="acc-name">{{ acc.name }}</span>
              <span class="acc-divider-equal">=</span>
              <span class="acc-qty">{{ acc.qty }}</span>
            </div>
          </div>
        </div>

        <div class="sheet-footer">
          <el-row>
            <el-col :span="12">
              <div class="footer-item">
                <span class="foot-label">交货工期：</span>
                <span class="foot-value highlight-days">{{ currentOrder.deliveryDays || '协商确定' }}</span>
              </div>
            </el-col>
            <el-col :span="12" class="text-right">
              <div class="footer-item" v-if="currentOrder.remark">
                <span class="foot-label">备注条款：</span>
                <span class="foot-value">{{ currentOrder.remark }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, View, Edit, Delete, Printer, Download } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { showSuccess, showError } from '@/utils/message'
import { usePermissions } from '@/composables/usePermissions'
import { useUserStore } from '@/stores/user'
import orderApi, { type OrderData, type OrderItem, type AccessoryItem } from '@/api/order'

const router = useRouter()
const userStore = useUserStore()
const { isGuest, isAdmin } = usePermissions()

const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const orderList = ref<OrderData[]>([])

// 预览相关
const previewVisible = ref(false)
const currentOrder = ref<OrderData | null>(null)

const currentOrderItems = computed<OrderItem[]>(() => {
  if (!currentOrder.value?.items) return []
  try {
    return JSON.parse(currentOrder.value.items)
  } catch {
    return []
  }
})

const currentOrderAccessories = computed<AccessoryItem[]>(() => {
  if (!currentOrder.value?.accessories) return []
  try {
    return JSON.parse(currentOrder.value.accessories)
  } catch {
    return []
  }
})

// 检查是否有编辑权限
const canModify = (row: OrderData) => {
  return isAdmin.value || row.ownerId === userStore.user?.id
}

const goToNewOrder = () => {
  router.push('/order')
}

// 格式化日期
const formatDateTime = (val?: string) => {
  if (!val) return '-'
  const d = new Date(val)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${date} ${h}:${min}`
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await orderApi.list({
      keyword: keyword.value,
      page: page.value,
      pageSize: pageSize.value
    })
    orderList.value = res.list
    total.value = res.total
  } catch (err: any) {
    showError(err, '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadList()
}

const resetSearch = () => {
  keyword.value = ''
  page.value = 1
  loadList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  page.value = 1
  loadList()
}

const handleCurrentChange = (val: number) => {
  page.value = val
  loadList()
}

// 查看详情 (弹出弹窗)
const viewOrder = async (id: number) => {
  try {
    const res = await orderApi.getDetail(id)
    currentOrder.value = res.order
    previewVisible.value = true
  } catch (err: any) {
    showError(err, '读取订单详情失败')
  }
}

// 去编辑页面
const editOrder = (id: number) => {
  router.push({ path: '/order', query: { id, mode: 'edit' } })
}

// 删除订单
const confirmDelete = async (row: OrderData) => {
  try {
    await ElMessageBox.confirm(`确定要删除订单编号为 "${row.orderNo}" 的订单吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await orderApi.remove(row.id)
    showSuccess('订单已成功删除')
    loadList()
  } catch (err: any) {
    if (err !== 'cancel') {
      showError(err, '删除订单失败')
    }
  }
}

const printCurrentOrder = () => {
  window.print()
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.order-history {
  padding: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: bold;
  font-size: 16px;
}

.filter-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.order-no-link {
  color: #3b82f6;
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
}

.order-no-link:hover {
  color: #1d4ed8;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

/* 订货单纸张排版 (A4 风格设计) */
.order-sheet-paper {
  background: #fff;
  color: #2b2b2b;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  padding: 30px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  line-height: 1.5;
}

.sheet-header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.company-brand {
  font-size: 16px;
  font-weight: 500;
  color: #555;
  letter-spacing: 1px;
}

.sheet-title {
  font-size: 26px;
  font-weight: 700;
  margin: 6px 0;
  color: #111;
  letter-spacing: 4px;
  border-bottom: 2px double #2b2b2b;
  display: inline-block;
  padding-bottom: 4px;
}

.sheet-order-no {
  font-size: 13px;
  color: #666;
  margin-top: 6px;
}

/* 统一表格基础样式 */
.meta-table, .items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 13px;
}

.meta-table td {
  border: 1px solid #2b2b2b;
  padding: 8px 10px;
}

.meta-label {
  width: 12%;
  font-weight: bold;
  background-color: #f7f9fa;
  text-align: center;
}

.meta-value {
  width: 21%;
}

.items-table th, .items-table td {
  border: 1px solid #2b2b2b;
  padding: 8px 10px;
  text-align: center;
}

.items-table th {
  background-color: #f3f4f6;
  font-weight: bold;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.highlight-qty {
  font-weight: bold;
  color: #1d4ed8;
}

.remark-col {
  font-size: 12px;
  color: #555;
}

.accessories-section {
  border: 1px solid #2b2b2b;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 2px;
}

.block-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
}

.accessories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  font-size: 13px;
}

.accessory-item {
  display: flex;
  align-items: center;
}

.acc-num {
  color: #777;
  margin-right: 4px;
}

.acc-name {
  font-weight: 550;
}

.acc-divider-equal {
  margin: 0 4px;
  color: #555;
  font-weight: normal;
}

.acc-qty {
  font-weight: bold;
  color: #1d4ed8;
}

.spec-qty-suffix {
  font-weight: bold;
  color: #1d4ed8;
}

.sheet-footer {
  margin-top: 20px;
  border-top: 1px solid #2b2b2b;
  padding-top: 12px;
}

.footer-item {
  font-size: 13px;
  margin-bottom: 6px;
}

.foot-label {
  font-weight: bold;
}

.highlight-days {
  font-weight: bold;
  color: #d97706;
  font-size: 14px;
}

.signature-row {
  margin-top: 40px;
  font-size: 13px;
}

.sig-box {
  height: 60px;
  display: flex;
  align-items: flex-end;
}

@media print {
  /* 隐藏主应用、侧边栏、对话框头部以及操作按钮 */
  #app, .sidebar-container, .navbar, .tags-view-container,
  .el-dialog__header, .el-dialog__close, .preview-actions {
    display: none !important;
  }

  /* 重置弹窗及其遮罩层的全部定位约束，并隐藏所有滚动条 */
  body, html {
    background: #fff !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* 隐藏所有浏览器的滚动条 */
  ::-webkit-scrollbar {
    display: none !important;
  }
  
  * {
    -ms-overflow-style: none !important;
    scrollbar-width: none !important;
  }

  .el-overlay, .el-overlay-dialog, .el-dialog {
    position: static !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow: visible !important;
  }

  .el-dialog__body {
    padding: 0 !important;
    overflow: visible !important;
  }

  /* 铺满整个A4页面，允许自然分页 */
  #print-area {
    display: block !important;
    position: static !important;
    width: 100% !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
  }
  
  /* 防止表格行中途截断分页 */
  tr {
    page-break-inside: avoid !important;
  }
}
</style>
