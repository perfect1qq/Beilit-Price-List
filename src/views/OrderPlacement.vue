<template>
  <div class="order-placement">
    <el-row :gutter="20">
      <!-- 左侧：输入与解析编辑区域 -->
      <el-col :xs="24" :md="10">
        <el-card class="input-card" shadow="never">
          <template #header>
            <div class="card-title">
              <span>新建订单</span>
              <el-button type="primary" size="small" :icon="DocumentCopy" @click="loadSampleText">
                载入示例数据
              </el-button>
            </div>
          </template>

          <div class="input-section">
            <div class="label-heading">1. 粘贴原始订单文本</div>
            <el-input
              v-model="rawText"
              type="textarea"
              :rows="8"
              placeholder="请在此粘贴从微信、邮件等复制的原始订单文本..."
              @input="handleAutoParse"
            />
            <div class="parse-actions">
              <el-button type="success" :icon="Refresh" @click="handleManualParse">
                重新智能解析
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 编辑解析后的表单 -->
          <div class="editor-section" v-if="hasParsedData">
            <div class="label-heading">2. 微调订单字段</div>
            <el-form :model="orderForm" label-position="top" size="default">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="客户名称">
                    <el-input v-model="orderForm.customerName" placeholder="客户公司名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="联系人">
                    <el-input v-model="orderForm.contactPerson" placeholder="联系人" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="电话">
                    <el-input v-model="orderForm.phone" placeholder="联系电话" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="传真">
                    <el-input v-model="orderForm.fax" placeholder="传真" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="送货地址">
                    <el-input v-model="orderForm.deliveryAddress" placeholder="送货地址" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="日期">
                    <el-input v-model="orderForm.orderDate" placeholder="订单日期" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="工期天数">
                    <el-input v-model="orderForm.deliveryDays" placeholder="工期天数，如 13天" />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 明细项目表 -->
              <div class="section-title">
                <span>订货明细</span>
                <el-button type="primary" link size="small" :icon="Plus" @click="addItem">
                  添加项
                </el-button>
              </div>
              <div class="items-editor-table">
                <div v-for="(item, idx) in orderForm.items" :key="item.id || idx" class="item-editor-row">
                  <div class="item-header-row">
                    <span class="row-num">#{{ idx + 1 }}</span>
                    <el-button type="danger" link size="small" :icon="Delete" @click="removeItem(idx)" />
                  </div>
                  <el-row :gutter="6">
                    <el-col :span="8">
                      <el-input v-model="item.name" size="small" placeholder="产品名称" />
                    </el-col>
                    <el-col :span="8">
                      <el-input v-model="item.spec" size="small" placeholder="规格 (如 H4200)" />
                    </el-col>
                    <el-col :span="8">
                      <el-input v-model="item.qty" size="small" placeholder="数量 (如 10片)" />
                    </el-col>
                    <el-col :span="8">
                      <el-input v-model="item.material" size="small" placeholder="用料" />
                    </el-col>
                    <el-col :span="8">
                      <el-input v-model="item.color" size="small" placeholder="颜色" />
                    </el-col>
                    <el-col :span="8">
                      <el-input v-model="item.other" size="small" placeholder="其他备注" />
                    </el-col>
                  </el-row>
                </div>
              </div>

              <!-- 配件项目表 -->
              <div class="section-title">
                <span>配件明细</span>
                <el-button type="primary" link size="small" :icon="Plus" @click="addAccessory">
                  添加配件
                </el-button>
              </div>
              <div class="items-editor-table">
                <div v-for="(acc, idx) in orderForm.accessories" :key="acc.id || idx" class="accessory-editor-row">
                  <el-row :gutter="6" align="middle">
                    <el-col :span="12">
                      <el-input v-model="acc.name" size="small" placeholder="配件名称" />
                    </el-col>
                    <el-col :span="10">
                      <el-input v-model="acc.qty" size="small" placeholder="数量 (如 20个)" />
                    </el-col>
                    <el-col :span="2">
                      <el-button type="danger" link size="small" :icon="Delete" @click="removeAccessory(idx)" />
                    </el-col>
                  </el-row>
                </div>
              </div>

              <!-- 备注 -->
              <el-form-item label="总备注">
                <el-input v-model="orderForm.remark" type="textarea" :rows="2" placeholder="备注条款..." />
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：订货单排版预览与保存 -->
      <el-col :xs="24" :md="14">
        <el-card class="preview-card" shadow="never">
          <template #header>
            <div class="preview-header-actions">
              <span class="preview-title">订货单版面预览</span>
              <div class="buttons">
                <el-button v-if="isEditMode" type="info" @click="cancelEdit">
                  取消编辑
                </el-button>
                <el-button type="success" :icon="Check" :loading="saving" @click="saveOrder">
                  {{ isEditMode ? '更新订单' : '保存订单' }}
                </el-button>
                <el-button type="primary" :icon="Printer" @click="printOrder" :disabled="!orderForm.customerName">
                  打印 / 导出 PDF
                </el-button>
              </div>
            </div>
          </template>

          <!-- 订货单纸张版面 (打印容器) -->
          <div id="print-area" class="order-sheet-paper">
            <div class="sheet-header">
              <div class="company-brand">倍力特金属制品有限公司</div>
              <div class="sheet-title">销 售 订 货 单</div>
              <div class="sheet-order-no" v-if="orderForm.orderNo">订单编号：{{ orderForm.orderNo }}</div>
            </div>

            <!-- 客户主信息表 -->
            <table class="meta-table">
              <tr>
                <td class="meta-label">订货单位</td>
                <td class="meta-value" colspan="3"><strong>{{ orderForm.customerName || '未指定客户' }}</strong></td>
                <td class="meta-label">订单日期</td>
                <td class="meta-value">{{ orderForm.orderDate || formatDate(new Date()) }}</td>
              </tr>
              <tr>
                <td class="meta-label">联系人</td>
                <td class="meta-value">{{ orderForm.contactPerson || '-' }}</td>
                <td class="meta-label">联系电话</td>
                <td class="meta-value">{{ orderForm.phone || '-' }}</td>
                <td class="meta-label">传真号码</td>
                <td class="meta-value">{{ orderForm.fax || '-' }}</td>
              </tr>
              <tr>
                <td class="meta-label">送货地址</td>
                <td class="meta-value" colspan="5">{{ orderForm.deliveryAddress || '-' }}</td>
              </tr>
            </table>

            <!-- 产品明细表 -->
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 50px;">序号</th>
                  <th>品名</th>
                  <th>规格/尺寸</th>
                  <th style="width: 80px;">数量</th>
                  <th>用料/材质</th>
                  <th>颜色</th>
                  <th>其他说明/备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in orderForm.items" :key="item.id || index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td><strong>{{ item.name || '-' }}</strong></td>
                  <td>{{ item.spec || '-' }}</td>
                  <td class="text-center highlight-qty">{{ item.qty || '-' }}</td>
                  <td>{{ item.material || '-' }}</td>
                  <td class="text-center">{{ item.color || '-' }}</td>
                  <td class="remark-col">{{ item.other || '-' }}</td>
                </tr>
                <tr v-if="orderForm.items.length === 0">
                  <td colspan="7" class="empty-row">暂无产品明细，请在左侧添加或解析数据</td>
                </tr>
              </tbody>
            </table>

            <!-- 配件板块 -->
            <div class="accessories-section" v-if="orderForm.accessories.length > 0">
              <div class="block-title">【配套配件明细】</div>
              <div class="accessories-grid">
                <div v-for="(acc, index) in orderForm.accessories" :key="acc.id || index" class="accessory-item">
                  <span class="acc-num">{{ index + 1 }}.</span>
                  <span class="acc-name">{{ acc.name }}</span>
                  <span class="acc-divider"></span>
                  <span class="acc-qty">{{ acc.qty }}</span>
                </div>
              </div>
            </div>

            <!-- 条款脚部 -->
            <div class="sheet-footer">
              <el-row>
                <el-col :span="12">
                  <div class="footer-item">
                    <span class="foot-label">交货工期：</span>
                    <span class="foot-value highlight-days">{{ orderForm.deliveryDays || '协商确定' }}</span>
                  </div>
                </el-col>
                <el-col :span="12" class="text-right">
                  <div class="footer-item" v-if="orderForm.remark">
                    <span class="foot-label">备注条款：</span>
                    <span class="foot-value">{{ orderForm.remark }}</span>
                  </div>
                </el-col>
              </el-row>

              <div class="signature-row">
                <el-row>
                  <el-col :span="12">
                    <div class="sig-box">供方代表签章：__________________</div>
                  </el-col>
                  <el-col :span="12">
                    <div class="sig-box text-right">需方代表签章：__________________</div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, Printer, DocumentCopy, Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { showSuccess, showError } from '@/utils/message'
import orderApi, { type OrderItem, type AccessoryItem } from '@/api/order'

const router = useRouter()
const route = useRoute()

// 原始粘贴文本
const rawText = ref('')
const saving = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

// 订单主数据表单
const orderForm = reactive({
  orderNo: '',
  customerName: '',
  phone: '',
  fax: '',
  contactPerson: '',
  deliveryAddress: '',
  orderDate: '',
  deliveryDays: '',
  items: [] as OrderItem[],
  accessories: [] as AccessoryItem[],
  remark: ''
})

const hasParsedData = computed(() => {
  return orderForm.customerName || orderForm.items.length > 0 || orderForm.accessories.length > 0
})

// 载入示例数据
const loadSampleText = () => {
  rawText.value = `客户	湖北都昱新材料科技有限公司	电话：
送货地址	应城	传真：
联系人		日期：2026年7月4日
序号	名称	规格	用料	颜色	其他
1	立柱片	H4200*W1100mm = 10片 	100*70*1.9mm	蓝色	2横5斜；按750mm   
2	横梁	L2840mm = 36根	140*50*1.4mm抱焊梁	桔红色	
3	工字跨梁	L1250*W1100mm = 36根	40*60*1.5mm矩管	桔红色	
4	护脚	H300mm = 10个	L型	桔红色	
5	护栏	L1100mm*H500mm = 2个		桔红色	
6	槽钢	L1200mm = 10根	用140*70*3.0mm折板，对应位置留出立柱底脚膨胀螺丝的孔	桔红色	外购
配件：
脚板（100型） = 20个
黑色垫圈 = 20个
螺丝M10*70 = 80套（含螺帽）
螺丝M10*20 = 40个（含螺帽）
膨胀螺丝= 150个
大安全销 = 72个
蓝色/桔红色自喷漆各一瓶
工期：13天`
  handleManualParse()
}

// 格式化日期辅助
const formatDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}年${m}月${d}日`
}

// 解析主逻辑
const parseText = (text: string) => {
  const lines = text.split('\n').map(l => l.trim())
  
  const header = {
    customerName: '',
    phone: '',
    deliveryAddress: '',
    fax: '',
    contactPerson: '',
    orderDate: '',
    deliveryDays: ''
  }
  const items: OrderItem[] = []
  const accessories: AccessoryItem[] = []
  
  let mode: 'header' | 'items' | 'accessories' | 'footer' = 'header'
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    
    // 匹配分割边界
    if (line.includes('序号') && line.includes('名称') && (line.includes('规格') || line.includes('用料'))) {
      mode = 'items'
      continue
    }
    if (line.startsWith('配件：') || line.startsWith('配件:') || (line.includes('脚板') && line.includes('='))) {
      mode = 'accessories'
      if (line.startsWith('配件：') || line.startsWith('配件:')) {
        continue
      }
    }
    if (line.includes('工期：') || line.includes('工期:')) {
      mode = 'footer'
    }
    
    if (mode === 'header') {
      const segments = line.split(/\t| {2,}/).map(s => s.trim()).filter(Boolean)
      const keys = [
        { name: 'customerName', labels: ['客户'] },
        { name: 'phone', labels: ['电话'] },
        { name: 'deliveryAddress', labels: ['送货地址', '送货'] },
        { name: 'fax', labels: ['传真'] },
        { name: 'contactPerson', labels: ['联系人'] },
        { name: 'orderDate', labels: ['日期'] }
      ]
      
      for (const segment of segments) {
        for (const key of keys) {
          for (const label of key.labels) {
            if (segment.startsWith(label)) {
              const val = segment.slice(label.length).replace(/^[:：\s]*/, '').trim()
              if (val) {
                (header as any)[key.name] = val
              } else {
                const currentIdx = segments.indexOf(segment)
                if (currentIdx !== -1 && currentIdx + 1 < segments.length) {
                  const nextSeg = segments[currentIdx + 1]
                  const isAnotherLabel = keys.some(k => k.labels.some(l => nextSeg.startsWith(l)))
                  if (!isAnotherLabel) {
                    (header as any)[key.name] = nextSeg
                  }
                }
              }
            }
          }
        }
      }
    } else if (mode === 'items') {
      const match = line.match(/^(\d+)[\s\t]+(.*)/)
      if (match) {
        const content = match[2].trim()
        let cols = content.split(/\t| {2,}/).map(c => c.trim())
        
        const name = cols[0] || ''
        const specRaw = cols[1] || ''
        const material = cols[2] || ''
        const color = cols[3] || ''
        const other = cols[4] || ''
        
        let spec = specRaw
        let qty = ''
        const specMatch = specRaw.match(/(.*?)\s*=\s*(.*)/)
        if (specMatch) {
          spec = specMatch[1].trim()
          qty = specMatch[2].trim()
        }
        
        items.push({
          id: Date.now() + Math.random(),
          name,
          spec,
          qty,
          material,
          color,
          other
        })
      }
    } else if (mode === 'accessories') {
      const matchAcc = line.match(/(.*?)\s*=\s*(.*)/)
      if (matchAcc) {
        accessories.push({
          id: Date.now() + Math.random(),
          name: matchAcc[1].trim(),
          qty: matchAcc[2].trim()
        })
      } else {
        if (!line.includes('工期')) {
          accessories.push({
            id: Date.now() + Math.random(),
            name: line.trim(),
            qty: ''
          })
        }
      }
    }
    
    if (line.includes('工期')) {
      const matchDays = line.match(/工期[\s\t:：]*([^\t\n\s]+)/)
      if (matchDays) {
        header.deliveryDays = matchDays[1]
      }
    }
  }
  
  return { header, items, accessories }
}

const handleAutoParse = () => {
  if (!rawText.value.trim()) return
  const { header, items, accessories } = parseText(rawText.value)
  
  orderForm.customerName = header.customerName || orderForm.customerName
  orderForm.phone = header.phone || orderForm.phone
  orderForm.fax = header.fax || orderForm.fax
  orderForm.contactPerson = header.contactPerson || orderForm.contactPerson
  orderForm.deliveryAddress = header.deliveryAddress || orderForm.deliveryAddress
  orderForm.orderDate = header.orderDate || orderForm.orderDate
  orderForm.deliveryDays = header.deliveryDays || orderForm.deliveryDays
  
  if (items.length > 0) orderForm.items = items
  if (accessories.length > 0) orderForm.accessories = accessories
}

const handleManualParse = () => {
  if (!rawText.value.trim()) {
    showError(new Error('请先粘贴订单文本！'), '解析失败')
    return
  }
  const { header, items, accessories } = parseText(rawText.value)
  
  Object.assign(orderForm, {
    customerName: header.customerName,
    phone: header.phone,
    fax: header.fax,
    contactPerson: header.contactPerson,
    deliveryAddress: header.deliveryAddress,
    orderDate: header.orderDate || formatDate(new Date()),
    deliveryDays: header.deliveryDays,
    items,
    accessories
  })
  
  showSuccess('订单文本解析成功！已填充表单')
}

// 增删项目
const addItem = () => {
  orderForm.items.push({
    id: Date.now() + Math.random(),
    name: '',
    spec: '',
    qty: '',
    material: '',
    color: '',
    other: ''
  })
}

const removeItem = (idx: number) => {
  orderForm.items.splice(idx, 1)
}

const addAccessory = () => {
  orderForm.accessories.push({
    id: Date.now() + Math.random(),
    name: '',
    qty: ''
  })
}

const removeAccessory = (idx: number) => {
  orderForm.accessories.splice(idx, 1)
}

// 保存订单
const saveOrder = async () => {
  if (!orderForm.customerName) {
    showError(new Error('请填写客户名称'), '保存失败')
    return
  }
  if (orderForm.items.length === 0) {
    showError(new Error('产品明细不能为空'), '保存失败')
    return
  }

  saving.value = true
  try {
    const payload = {
      customerName: orderForm.customerName,
      phone: orderForm.phone,
      fax: orderForm.fax,
      contactPerson: orderForm.contactPerson,
      deliveryAddress: orderForm.deliveryAddress,
      orderDate: orderForm.orderDate,
      deliveryDays: orderForm.deliveryDays,
      items: JSON.stringify(orderForm.items),
      accessories: JSON.stringify(orderForm.accessories),
      rawText: rawText.value,
      remark: orderForm.remark
    }

    if (isEditMode.value && editingId.value) {
      await orderApi.update(editingId.value, payload)
      showSuccess('订单更新成功！')
    } else {
      await orderApi.create(payload)
      showSuccess('订单保存成功！')
    }
    
    // 跳转历史列表
    router.push('/order/history')
  } catch (err: any) {
    showError(err, '保存订单失败')
  } finally {
    saving.value = false
  }
}

// 取消编辑
const cancelEdit = () => {
  router.push('/order/history')
}

// 打印订单
const printOrder = () => {
  window.print()
}

// 初始化加载（若是编辑模式）
onMounted(async () => {
  const idStr = route.query.id as string
  const modeStr = route.query.mode as string
  
  if (idStr) {
    const id = parseInt(idStr, 10)
    if (!isNaN(id)) {
      editingId.value = id
      isEditMode.value = (modeStr !== 'view')
      
      try {
        const res = await orderApi.getDetail(id)
        const order = res.order
        
        Object.assign(orderForm, {
          orderNo: order.orderNo,
          customerName: order.customerName,
          phone: order.phone || '',
          fax: order.fax || '',
          contactPerson: order.contactPerson || '',
          deliveryAddress: order.deliveryAddress || '',
          orderDate: order.orderDate || '',
          deliveryDays: order.deliveryDays || '',
          remark: order.remark || '',
          items: order.items ? JSON.parse(order.items) : [],
          accessories: order.accessories ? JSON.parse(order.accessories) : []
        })
        
        rawText.value = order.rawText || ''
      } catch (err: any) {
        showError(err, '加载订单详情失败')
      }
    }
  }
})
</script>

<style scoped>
.order-placement {
  padding: 20px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label-heading {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.parse-actions {
  display: flex;
  justify-content: flex-end;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 16px 0 8px 0;
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
}

.items-editor-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 8px;
  background-color: #f9fafb;
}

.item-editor-row {
  border: 1px solid #e5e7eb;
  background-color: #fff;
  border-radius: 4px;
  padding: 8px;
}

.item-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 4px;
}

.row-num {
  font-size: 12px;
  color: #9ca3af;
  font-weight: bold;
}

.accessory-editor-row {
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 6px;
}

.preview-card {
  height: 100%;
}

.preview-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-title {
  font-weight: bold;
}

/* 订货确认单纸张排版 (A4 风格设计) */
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
.meta-table, .data-table {
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

.data-table th, .data-table td {
  border: 1px solid #2b2b2b;
  padding: 8px 10px;
}

.data-table th {
  background-color: #f3f4f6;
  font-weight: bold;
  text-align: center;
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

.empty-row {
  text-align: center;
  color: #999;
  padding: 24px !important;
}

.remark-col {
  font-size: 12px;
  color: #555;
}

/* 配件区排版 */
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

.acc-divider {
  flex-grow: 1;
  border-bottom: 1px dotted #ccc;
  margin: 0 8px;
}

.acc-qty {
  font-weight: bold;
  color: #1d4ed8;
}

/* 脚部排版 */
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

/* 打印样式适配 */
@media print {
  body * {
    visibility: hidden;
  }
  #print-area, #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
    box-shadow: none;
    padding: 0;
  }
  .order-placement {
    padding: 0;
  }
  /* Remove shadows and borders in print */
  .preview-card, .el-card {
    border: none !important;
  }
}
</style>
