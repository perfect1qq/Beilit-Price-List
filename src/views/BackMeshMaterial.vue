<template>
  <div class="back-mesh-material">
    <el-card shadow="never" class="calc-card">
      <template #header>
        <div class="header-tools">
          <span class="page-title">背网材料计算 (一维下料优化)</span>
        </div>
      </template>

      <div class="content-wrapper">
        <!-- 左侧：输入区域 -->
        <div class="input-section">
          <div class="section-title">参数设置</div>
          <el-form label-width="120px" class="settings-form">
            <el-form-item label="原材料长度(mm)">
              <el-input-number v-model="rawLength" :min="1" :step="100" :precision="0" style="width: 150px" />
              <span class="hint-text">默认一根管子的长度</span>
            </el-form-item>
            <el-form-item label="锯缝损耗(mm)">
              <el-input-number v-model="sawLoss" :min="0" :step="1" style="width: 150px" />
              <span class="hint-text">每次切割造成的损耗(预留)</span>
            </el-form-item>
            <el-form-item label="安全余量(mm)">
              <el-input-number v-model="safetyMargin" :min="0" :step="5" style="width: 150px" />
              <span class="hint-text">预留的边缘废料，防止切割误差</span>
            </el-form-item>
          </el-form>

          <div class="section-title" style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
            <span>需求列表</span>
            <AppButton variant="add" @click="addRequirement">添加需求</AppButton>
          </div>
          
          <el-table :data="requirements" border stripe class="requirements-table">
            <el-table-column label="切割长度 (mm)" min-width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.length" :min="1" :max="rawLength" :step="10" :precision="0" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="需要数量 (根)" min-width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" :step="1" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <AppButton variant="delete" link @click="removeRequirement($index)" :disabled="requirements.length <= 1" />
              </template>
            </el-table-column>
          </el-table>

          <div class="action-bar">
            <AppButton variant="primary" size="large" class="calc-btn" @click="calculate" :loading="isCalculating">
              开始计算方案
            </AppButton>
            <AppButton variant="reset" size="large" @click="resetForm">重置</AppButton>
          </div>
        </div>

        <!-- 右侧：结果区域 -->
        <div class="result-section">
          <div class="section-title">计算结果</div>
          
          <div v-if="results.length > 0" class="result-content">
            <div class="summary-cards">
              <div class="summary-card primary">
                <div class="label">所需原材料总数</div>
                <div class="value">{{ totalRawNeeded }} <span>根</span></div>
              </div>
              <div class="summary-card success">
                <div class="label">材料利用率</div>
                <div class="value">{{ utilizationRate }}<span>%</span></div>
              </div>
            </div>

            <div class="patterns-list">
              <h4 class="patterns-title">切割方案明细</h4>
              
              <div v-for="(pattern, index) in results" :key="index" class="pattern-item">
                <div class="pattern-header">
                  <div class="pattern-title">
                    <el-tag type="info" effect="dark" round>方案 {{ index + 1 }}</el-tag>
                    <span class="multiplier">需按此方案切割 <span class="highlight">{{ pattern.count }}</span> 根原材料</span>
                  </div>
                  <div class="pattern-waste">
                    每根剩余废料: <strong>{{ pattern.waste }}</strong> mm
                  </div>
                </div>
                
                <div class="pattern-body">
                  <div class="cut-visualization">
                    <div 
                      v-for="(cut, cIdx) in pattern.cuts" 
                      :key="cIdx" 
                      class="cut-segment" 
                      :style="{ width: (cut / rawLength * 100) + '%' }"
                    >
                      {{ cut }}mm
                    </div>
                    <div class="waste-segment" :style="{ width: (pattern.waste / rawLength * 100) + '%' }">
                      余{{ pattern.waste }}
                    </div>
                  </div>
                  
                  <div class="cut-details">
                    切割尺寸: 
                    <el-tag 
                      v-for="(count, len) in getCutCounts(pattern.cuts)" 
                      :key="len"
                      size="small"
                      class="cut-tag"
                    >
                      {{ len }}mm × {{ count }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <el-empty description="点击左侧计算按钮获取切割方案" />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// --- 状态定义 ---
const rawLength = ref(6000) // 默认 6000 mm
const sawLoss = ref(3)     // 锯缝损耗(mm)，刀片厚度默认3mm
const safetyMargin = ref(20) // 安全余量(mm)，默认留20mm防误差
const isCalculating = ref(false)

interface Requirement {
  length: number
  quantity: number
}

const requirements = ref<Requirement[]>([
  { length: 2300, quantity: 104 },
  { length: 1300, quantity: 332 },
  { length: 2700, quantity: 136 },
  { length: 1200, quantity: 24 }
])

interface Pattern {
  cuts: number[]
  waste: number
  count: number
}

const results = ref<Pattern[]>([])
const totalRawNeeded = ref(0)

// --- 计算逻辑 (高级动态规划-贪心组合算法) ---
const calculate = () => {
  isCalculating.value = true
  
  // 简单验证
  if (requirements.value.some(r => r.length > rawLength.value)) {
    ElMessage.error('存在需求长度大于原材料长度的情况！')
    isCalculating.value = false
    return
  }
  if (requirements.value.some(r => r.quantity <= 0)) {
    ElMessage.error('需求数量必须大于0')
    isCalculating.value = false
    return
  }

  // 计算有效可用长度：原材料长度 - 安全余量
  const W = Math.round(rawLength.value) - Math.round(safetyMargin.value)
  const loss = Math.round(sawLoss.value)

  if (W <= 0) {
    ElMessage.error('安全余量不能大于或等于原材料长度！')
    isCalculating.value = false
    return
  }

  let reqs = requirements.value
    .filter(r => r.quantity > 0)
    .map((r, index) => ({ 
      id: index, 
      l: Math.round(r.length), 
      q: r.quantity, 
      originalL: r.length 
    }))

  const pipes: number[][] = []

  // 当还有需求未满足时，不断寻找最优方案
  while (reqs.length > 0) {
    // 展开可用的物品，限制每种物品的最大放入数量
    const flatItems: { id: number; l: number; originalL: number }[] = []
    for (const r of reqs) {
      const maxCanFit = Math.floor(W / r.l)
      const count = Math.min(r.q, maxCanFit)
      for (let c = 0; c < count; c++) {
        flatItems.push({ id: r.id, l: r.l, originalL: r.originalL })
      }
    }

    if (flatItems.length === 0) break

    // 使用 0-1 背包 DP 寻找单根管子的最优切割组合
    // 目标：在容量 W 内，最大化放入的物品总长度，长度相同时尽量减少物品数量（即优先用大料）
    const dpScore = new Int32Array(W + 1).fill(-1)
    const dpItems = new Array<number[]>(W + 1)
    dpScore[0] = 0
    dpItems[0] = []

    for (let i = 0; i < flatItems.length; i++) {
      const item = flatItems[i]
      // 倒序遍历，保证每个物品只被使用一次
      for (let w = W; w >= 0; w--) {
        if (dpScore[w] !== -1) {
          const isFirstPiece = (w === 0)
          const addedWeight = item.l + (isFirstPiece ? 0 : loss)
          const newW = w + addedWeight

          if (newW <= W) {
            // score 权重公式：总长度占据主导，减去1是为了在长度相同的情况下，选用数量最少的方案（优先大料）
            const newScore = dpScore[w] + item.l * 1000 - 1
            if (newScore > dpScore[newW]) {
              dpScore[newW] = newScore
              dpItems[newW] = [...dpItems[w], i]
            }
          }
        }
      }
    }

    // 找出得分最高的组合方案
    let bestW = 0
    for (let w = 0; w <= W; w++) {
      if (dpScore[w] > dpScore[bestW]) {
        bestW = w
      }
    }

    const bestIndices = dpItems[bestW]
    if (!bestIndices || bestIndices.length === 0) {
      break
    }

    // 统计当前最优方案中各需求的数量
    const patternCounts = new Map<number, number>()
    for (const idx of bestIndices) {
      const reqId = flatItems[idx].id
      patternCounts.set(reqId, (patternCounts.get(reqId) || 0) + 1)
    }

    // 计算这个方案可以被批量应用多少次（根据库存瓶颈）
    let applyTimes = Infinity
    for (const [reqId, count] of patternCounts.entries()) {
      const req = reqs.find(r => r.id === reqId)!
      applyTimes = Math.min(applyTimes, Math.floor(req.q / count))
    }

    // 应用该方案 applyTimes 次
    for (let t = 0; t < applyTimes; t++) {
      const pipe: number[] = []
      for (const [reqId, count] of patternCounts.entries()) {
        const req = reqs.find(r => r.id === reqId)!
        req.q -= count // 扣除需求数量
        for (let c = 0; c < count; c++) {
          pipe.push(req.originalL)
        }
      }
      pipes.push(pipe)
    }

    // 移除已完全满足的需求，进入下一轮寻优
    reqs = reqs.filter(r => r.q > 0)
  }

  totalRawNeeded.value = pipes.length

  // 整理并合并完全相同的切割方案
  const patternMap = new Map<string, Pattern>()
  const lossInMm = sawLoss.value
  
  pipes.forEach(pipe => {
    // 降序排列管子段，确保方案比较时顺序一致
    const sortedPipe = [...pipe].sort((a, b) => b - a)
    const key = sortedPipe.join('|')
    
    if (patternMap.has(key)) {
      patternMap.get(key)!.count += 1
    } else {
      const usedLen = sortedPipe.reduce((a, b) => a + b, 0) + (Math.max(0, sortedPipe.length - 1) * lossInMm)
      patternMap.set(key, {
        cuts: sortedPipe,
        waste: rawLength.value - usedLen,
        count: 1
      })
    }
  })

  // 按使用次数降序排列结果方案
  results.value = Array.from(patternMap.values()).sort((a, b) => b.count - a.count)
  isCalculating.value = false
}

const utilizationRate = computed(() => {
  if (totalRawNeeded.value === 0 || results.value.length === 0) return '0.0'
  
  let totalUsed = 0
  results.value.forEach(p => {
    const pipeUsed = p.cuts.reduce((a, b) => a + b, 0)
    totalUsed += pipeUsed * p.count
  })
  
  const totalMaterial = totalRawNeeded.value * rawLength.value
  return ((totalUsed / totalMaterial) * 100).toFixed(1)
})

// --- 辅助方法 ---
const addRequirement = () => {
  requirements.value.push({ length: 1.0, quantity: 1 })
}

const removeRequirement = (index: number) => {
  requirements.value.splice(index, 1)
}

const resetForm = () => {
  requirements.value = [
    { length: 2300, quantity: 104 },
    { length: 1300, quantity: 332 },
    { length: 2700, quantity: 136 },
    { length: 1200, quantity: 24 }
  ]
  results.value = []
  totalRawNeeded.value = 0
}

const getCutCounts = (cuts: number[]) => {
  const counts: Record<string, number> = {}
  cuts.forEach(c => {
    const key = String(c)
    counts[key] = (counts[key] || 0) + 1
  })
  return counts
}
</script>

<style scoped>
.calc-card {
  min-height: calc(100vh - 120px);
  border-radius: 12px;
}

.content-wrapper {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.input-section {
  flex: 0 0 450px;
  background-color: #f8fafc;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.result-section {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.hint-text {
  margin-left: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.requirements-table {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.action-bar {
  margin-top: 24px;
  display: flex;
  gap: 16px;
}

.calc-btn {
  flex: 1;
}

/* 结果展示样式 */
.summary-cards {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.summary-card {
  flex: 1;
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.summary-card.primary {
  border-left: 4px solid #3b82f6;
}

.summary-card.success {
  border-left: 4px solid #10b981;
}

.summary-card .label {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.summary-card .value {
  color: #0f172a;
  font-size: 32px;
  font-weight: 800;
}

.summary-card .value span {
  font-size: 16px;
  color: #64748b;
  margin-left: 4px;
  font-weight: 500;
}

.patterns-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.patterns-title {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #334155;
}

.pattern-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.pattern-header {
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pattern-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pattern-title .multiplier {
  font-size: 14px;
  color: #475569;
}

.pattern-title .highlight {
  color: #f59e0b;
  font-weight: 700;
  font-size: 16px;
}

.pattern-waste {
  font-size: 14px;
  color: #64748b;
}
.pattern-waste strong {
  color: #ef4444;
}

.pattern-body {
  padding: 20px;
}

.cut-visualization {
  display: flex;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  margin-bottom: 16px;
}

.cut-segment {
  background: #3b82f6;
  border-right: 1px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s;
}

.cut-segment:hover {
  background: #2563eb;
}

.waste-segment {
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
  background-image: repeating-linear-gradient(
    45deg,
    #e2e8f0 25%,
    transparent 25%,
    transparent 75%,
    #e2e8f0 75%,
    #e2e8f0
  );
  background-size: 10px 10px;
}

.cut-details {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #64748b;
  font-size: 14px;
  flex-wrap: wrap;
}

.cut-tag {
  font-size: 13px;
  font-weight: 500;
}

.empty-state {
  padding: 60px 0;
}
</style>

