<template>
  <div class="page">
    <section class="panel editor">
      <h1>货架部件智能汇总</h1>

      <div class="shelf-type-selector">
        <label>货架类型</label>
        <el-select v-model="shelfType" placeholder="选择货架类型">
          <el-option label="重型/中型货架" value="standard" />
          <el-option label="货架平台" value="platform" />
          <el-option label="配件计算" value="accessory" />
        </el-select>
      </div>

      <div class="extra-inputs" v-if="shelfType === 'accessory'">
        <div class="input-item">
          <label>横斜撑总数</label>
          <el-input-number v-model="crossBraceCount" :min="0" :controls="false" placeholder="0" />
        </div>
        <div class="input-item">
          <label>防撞护栏类型</label>
          <el-select v-model="guardrailType" placeholder="选择类型">
            <el-option label="一横两竖" value="2" />
            <el-option label="一横三竖" value="3" />
          </el-select>
        </div>
      </div>

      <div class="extra-inputs" v-if="shelfType === 'standard'">
        <div class="input-item">
          <label>横斜撑总数</label>
          <el-input-number v-model="crossBraceCount" :min="0" :controls="false" placeholder="0" />
        </div>
        <div class="input-item">
          <label>龙门梁</label>
          <el-input-number v-model="gateBeamClampCount" :min="0" :controls="false" placeholder="0" />
        </div>
        <div class="input-item">
          <label>连接杆</label>
          <el-input-number v-model="connectorCount" :min="0" :controls="false" placeholder="0" />
        </div>
        <div class="input-item guardrail-item">
          <label>防撞护栏</label>
          <div class="guardrail-inputs">
            <el-input-number v-model="guardrailCount" :min="0" :controls="false" placeholder="0" />
            <el-select v-model="guardrailType" placeholder="类型">
              <el-option label="一横两竖" value="2" />
              <el-option label="一横三竖" value="3" />
            </el-select>
          </div>
        </div>
        <div class="input-item">
          <label>防撞护脚</label>
          <el-input-number v-model="protectorCount" :min="0" :controls="false" placeholder="0" />
        </div>
        <div class="input-item">
          <label>拣货层层数</label>
          <el-input-number v-model="pickingLayerCount" :min="0" :controls="false" placeholder="0" />
        </div>
        <div class="input-item">
          <label>合抱立柱</label>
          <el-input-number v-model="embraceColumnCount" :min="0" :controls="false" placeholder="0" />
        </div>
      </div>

      <el-input v-model="rawText" type="textarea" :rows="8" :placeholder="shelfType === 'standard'
        ? '支持重型货架「L*W*H + N主架 M副架」格式，以及中型/层板/重型货架「L*W*H*N层板（载重）套 N」格式。粘贴后点击生成汇总即可自动计算...'
        : shelfType === 'accessory'
          ? '请粘贴配件信息，如：\n立柱片 H5700*W1000mm=59片\n横梁1 L2990mm=258根\n连接杆 L400mm=18根\n防撞护栏 L1000*H300mm=20根\n防撞护脚 H300mm=59根\n系统将自动识别并计算螺丝...'
          : '请粘贴货架平台的配件信息，如：\n合抱立柱1 H4575mm = 10根\n合抱立柱2 H1200mm = 1根\n系统将自动识别并计算膨胀螺丝...'" />

      <div class="toolbar">
        <el-button type="primary" @click="parseNow" :loading="loading" size="large">
          <template #icon><el-icon>
              <Promotion />
            </el-icon></template>
          {{ loading ? '解析中' : '生成汇总分析' }}
        </el-button>
        <el-button @click="clearText" :disabled="loading" size="large">
          <template #icon><el-icon>
              <RefreshLeft />
            </el-icon></template>
          清空面板
        </el-button>
      </div>
    </section>

    <section v-if="errors.length" class="panel error-box">
      <h2>错误</h2>
      <ul>
        <li v-for="(item, index) in errors" :key="'e-' + index">{{ item }}</li>
      </ul>
    </section>

    <section v-if="warnings.length" class="panel warn-box">
      <h2>提示</h2>
      <ul>
        <li v-for="(item, index) in warnings" :key="'w-' + index">{{ item }}</li>
      </ul>
    </section>

    <section class="panel result" v-if="parts.length">
      <h2>部件汇总</h2>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>规格</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in parts" :key="index">
              <td>{{ p.name }}</td>
              <td>{{ p.spec }}</td>
              <td>{{ p.qty }}{{ p.unit }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel remark-box">
      <h2>备注</h2>
      <ul>
        <li v-for="(item, index) in remarks" :key="'r-' + index">{{ item }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Promotion, RefreshLeft } from '@element-plus/icons-vue'
import { quotationStatisticsApi } from '../api/quotation'
import { to } from '@/utils/async'
import { showWarning, showError, showSuccess } from '@/utils/message'
import type { PartItem } from '@/types'

const rawText = ref('')
const shelfType = ref('standard')
const crossBraceCount = ref(0)
const gateBeamClampCount = ref(0)
const connectorCount = ref(0)
const guardrailCount = ref(0)
const guardrailType = ref('2')
const protectorCount = ref(0)
const pickingLayerCount = ref(0)
const embraceColumnCount = ref(0)
const parts = ref<PartItem[]>([])
const errors = ref<string[]>([])
const warnings = ref<string[]>([])
const DEFAULT_REMARKS = [
  '脚板：立柱片的数量×2',
  '黑色垫圈：立柱片的数量×2',
  '螺丝（M10*70）：横斜撑总数+1 × 立柱片的数量',
  '螺丝（M10*20）：脚板×2 + 连接杆×4 + 龙门梁卡扣×4',
  '膨胀螺丝（M10*70）：脚板×2 + 防撞护脚×4 + 防撞护栏（一横两竖×8 / 一横三竖×12）',
  '安全销：（横梁 + P型横梁）×2',
]

const remarks = ref<string[]>([...DEFAULT_REMARKS])
const loading = ref(false)

/** 执行解析 */
async function doParse() {
  if (!rawText.value.trim()) return

  loading.value = true

  // 配件计算模式：只传横斜撑总数，其余数据从文本解析
  // shelfType 只表示货架类型（standard/platform），calcMode 表示计算模式（standard/accessory）
  const isAccessory = shelfType.value === 'accessory'
  const [err, result] = await to(quotationStatisticsApi.parse(rawText.value, {
    shelfType: isAccessory ? 'standard' : shelfType.value,
    calcMode: isAccessory ? 'accessory' : 'standard',
    crossBraceCount: crossBraceCount.value,
    gateBeamClampCount: isAccessory ? undefined : gateBeamClampCount.value,
    connectorCount: isAccessory ? undefined : connectorCount.value,
    guardrailCount: isAccessory ? undefined : guardrailCount.value,
    guardrailType: guardrailType.value,
    protectorCount: isAccessory ? undefined : protectorCount.value,
    pickingLayerCount: isAccessory ? undefined : pickingLayerCount.value,
    embraceColumnCount: isAccessory ? undefined : embraceColumnCount.value,
  }))
  if (err || !result) {
    showError(err, '智能引擎解析失败')
    loading.value = false
    return
  }
  parts.value = result.parts || []
  errors.value = result.errors || []
  warnings.value = result.warnings || []

  if (result.remarks && result.remarks.length > 0) {
    remarks.value = result.remarks
  } else {
    remarks.value = [...DEFAULT_REMARKS]
  }
  loading.value = false
}



async function parseNow() {
  if (!rawText.value.trim()) {
    return showWarning('请先提供完整的货架报价文本用于解析。')
  }
  await doParse()
  if (errors.value.length) {
    showWarning('文本存在无法精准识别的内容区块，请检查页面"错误"反馈。')
  } else {
    showSuccess('文本解析及计算转换成功')
  }
}


function clearText() {
  rawText.value = ''
  shelfType.value = 'standard'
  crossBraceCount.value = 0
  gateBeamClampCount.value = 0
  connectorCount.value = 0
  guardrailCount.value = 0
  guardrailType.value = '2'
  protectorCount.value = 0
  pickingLayerCount.value = 0
  embraceColumnCount.value = 0
  parts.value = []
  errors.value = []
  warnings.value = []
  remarks.value = [...DEFAULT_REMARKS]
}

</script>

<style scoped>
.shelf-type-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.shelf-type-selector label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.shelf-type-selector .el-select {
  width: 200px;
}

.extra-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.input-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-item label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.guardrail-item {
  grid-column: span 1;
}

.guardrail-inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guardrail-inputs .el-input-number,
.guardrail-inputs .el-select {
  width: 100%;
}

.page {
  min-height: 100%;
  padding: 0px;
  background: white;
  color: #0f172a;
  box-sizing: border-box;

  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.panel {
  background: #fff;

  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 20px;
  margin-bottom: 20px;
}

h1 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
}

h2 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: bold;
  border-left: 4px solid #3b82f6;
  padding-left: 10px;
  line-height: 1.1;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f1f3;
}

.error-box {
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #991b1b;
}

.warn-box {
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.remark-box {
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #3730a3;
}

.error-box ul,
.warn-box ul,
.remark-box ul {
  margin: 0;
  padding-left: 21px;
}

.table-wrap {
  overflow-x: hidden;
  overflow-y: visible;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  font-size: 14px;
  vertical-align: middle;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

th {
  background: #f8fafc;
  font-weight: bold;
  color: #475569;
}


@media (max-width: 720px) {
  .page {
    padding: 12px;
  }

  .panel {
    padding: 12px;
    margin-bottom: 12px;
  }

  h1 {
    font-size: 17px;
  }

  h2 {
    font-size: 14px;
  }

  textarea {
    min-height: 180px;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    min-width: 540px;
  }

  th,
  td {
    padding: 10px;
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>