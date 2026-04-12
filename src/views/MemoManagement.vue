<template>
  <div class="memo-container">
    <div class="stats-overview">
      <div v-for="(stat, key) in statConfig" :key="key" class="stat-item">
        <div class="stat-info">
          <span class="stat-label">{{ stat.label }}</span>
          <span :class="['stat-count', stat.class]">{{ stats[stat.key] }}</span>
        </div>
      </div>
    </div>

    <div class="memo-wrapper">
      <header class="memo-header">
        <div class="header-left">
          <h1 class="memo-title">{{ pageTitle }}</h1>
          <div class="memo-badge">{{ activeListScope === 'today' ? 'LIVE' : 'ARCHIVE' }}</div>
        </div>

        <div class="header-right">
          <div class="control-group">
            <el-segmented
              v-model="activeListScope"
              :options="listScopeOptions"
              class="custom-segmented"
              @change="handleListScopeChange"
            />
          </div>

          <div class="vertical-spacer"></div>

          <div class="control-group search-container">
            <el-input
              v-model="keyword"
              placeholder="搜索标题或内容..."
              :prefix-icon="Search"
              clearable
              class="custom-search"
              @input="onKeywordInput"
            />
            
            <div class="date-picker-box" :class="{ 'is-expanded': activeListScope === 'history' }">
              <el-date-picker
                v-model="historyCreatedOn"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择创建日期"
                clearable
                class="custom-date-picker"
                @change="onHistoryDateChange"
              />
            </div>
          </div>

          <div class="vertical-spacer"></div>

          <div class="control-group">
            <el-segmented
              v-model="activeFilter"
              :options="filterOptions"
              class="custom-segmented"
              @change="handleFilterChange"
            />
          </div>

          <div v-if="activeListScope === 'today'" class="action-box">
            <el-button type="primary" :icon="Plus" class="main-add-btn" @click="openCreate">
              新建任务
            </el-button>
          </div>
        </div>
      </header>

      <div class="memo-content">
        <el-skeleton :loading="loading && !list.length" animated :rows="12">
          <template #default>
            <div v-show="isBoardMode" class="board-grid">
              <section class="column">
                <div class="column-head">
                  <span class="col-indicator todo"></span>
                  <span class="col-name">待处理</span>
                  <span class="col-num">{{ todoList.length }}</span>
                </div>
                <div class="task-list">
                  <div 
                    v-for="item in todoList" 
                    :key="item.id" 
                    v-memo="[item.updatedAt, item.pinned, item.color]"
                    :class="['card', item.color, { 'is-pinned': item.pinned }]"
                  >
                    <div class="card-inner">
                      <div class="card-side">
                        <el-checkbox :model-value="item.completed" @change="() => toggleCompleted(item)" />
                      </div>
                      <div class="card-main" @click="openEdit(item)">
                        <div class="card-header">
                          <span class="card-title">{{ item.title }}</span>
                          <el-tag v-if="item.pinned" size="small" type="danger" effect="dark" round>置顶</el-tag>
                        </div>
                        <p class="card-body">{{ item.content }}</p>
                        <div class="card-meta">
                          <span class="tag">{{ item.label || '默认' }}</span>
                          <span class="date">{{ formatTime(item.updatedAt) }}</span>
                        </div>
                      </div>
                      <div class="card-actions">
                        <el-dropdown trigger="click">
                          <el-button link :icon="MoreFilled"></el-button>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item @click="openEdit(item)">编辑详情</el-dropdown-item>
                              <el-dropdown-item @click="togglePinned(item)">{{ item.pinned ? '取消置顶' : '置顶任务' }}</el-dropdown-item>
                              <el-dropdown-item @click="openHistory(item)">查看日志</el-dropdown-item>
                              <el-dropdown-item divided style="color: #f56c6c" @click="removeMemo(item)">彻底删除</el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                  </div>
                </div>
                <el-empty v-if="!todoList.length" description="今日无事" :image-size="80" />
              </section>

              <section class="column">
                <div class="column-head">
                  <span class="col-indicator done"></span>
                  <span class="col-name">已圆满</span>
                  <span class="col-num">{{ doneList.length }}</span>
                </div>
                <div class="task-list">
                  <div 
                    v-for="item in doneList" 
                    :key="item.id" 
                    v-memo="[item.updatedAt, item.completed]"
                    class="card is-completed"
                  >
                    <div class="card-inner">
                      <div class="card-side">
                        <el-checkbox :model-value="item.completed" @change="() => toggleCompleted(item)" />
                      </div>
                      <div class="card-main">
                        <span class="card-title">{{ item.title }}</span>
                        <div class="card-meta">
                          <span class="date">完成于 {{ formatTime(item.completedAt || item.updatedAt) }}</span>
                        </div>
                      </div>
                      <el-button link type="danger" :icon="Delete" @click="removeMemo(item)"></el-button>
                    </div>
                  </div>
                </div>
                <el-empty v-if="!doneList.length" description="继续加油" :image-size="80" />
              </section>
            </div>

            <div v-show="!isBoardMode" class="list-view">
              <div v-if="list.length" class="task-list single-stack">
                <div 
                  v-for="item in list" 
                  :key="item.id" 
                  v-memo="[item.updatedAt, item.completed, item.pinned]"
                  :class="['card', item.color, { 'is-pinned': item.pinned, 'is-completed': item.completed }]"
                >
                   <div class="card-inner">
                      <el-checkbox :model-value="item.completed" @change="() => toggleCompleted(item)" />
                      <div class="card-main" @click="openEdit(item)">
                        <div class="card-header">
                          <span class="card-title">{{ item.title }}</span>
                          <el-tag v-if="item.completed" size="small" type="success">DONE</el-tag>
                        </div>
                        <p class="card-body">{{ item.content }}</p>
                      </div>
                      <div class="card-actions">
                        <el-button link @click="openEdit(item)">编辑</el-button>
                        <el-button link type="danger" @click="removeMemo(item)">删除</el-button>
                      </div>
                   </div>
                </div>
              </div>
              <el-empty v-else :description="emptyDescription" />
            </div>

            <div v-if="list.length > 0" class="load-more-container">
              <el-button 
                :loading="loading" 
                plain 
                round 
                class="load-more-btn"
                @click="loadNextPage"
              >
                向下加载更多任务
              </el-button>
            </div>

          </template>
        </el-skeleton>
      </div>
    </div>

    <el-drawer v-model="editorVisible" :title="editorMode === 'create' ? '✨ 开启新任务' : '📝 更新任务细节'" size="540px" class="custom-drawer">
      <el-form :model="form" label-position="top">
        <el-form-item label="任务名称">
          <el-input v-model="form.title" placeholder="输入核心目标" maxlength="40" show-word-limit />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="分类" style="flex: 1">
            <el-input v-model="form.label" placeholder="如：工作" />
          </el-form-item>
          <el-form-item label="主题色" style="flex: 1">
            <el-select v-model="form.color">
              <el-option v-for="c in colorOptions" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row toggle-row">
          <el-form-item label="置顶显示">
            <el-switch v-model="form.pinned" />
          </el-form-item>
          <el-form-item label="完成状态">
            <el-switch v-model="form.completed" />
          </el-form-item>
        </div>
        <el-form-item label="详细说明">
          <el-input v-model="form.content" type="textarea" :rows="10" placeholder="记录具体步骤或想法..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="drawer-btns">
          <el-button @click="editorVisible = false">舍弃修改</el-button>
          <el-button type="primary" :loading="saving" @click="saveMemo">确 认 保 存</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="historyVisible" :title="historyTitle" size="420px">
       <el-timeline v-if="historyList.length" class="custom-timeline">
        <el-timeline-item v-for="h in historyList" :key="h.id" :timestamp="formatTime(h.createdAt)" :type="h.action === 'complete' ? 'success' : 'primary'">
          <div class="log-box">
            <p class="log-user"><strong>{{ h.operatorName }}</strong> {{ actionLabel(h.action) }}</p>
            <div class="log-content">{{ h.content }}</div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else />
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, MoreFilled, Delete } from '@element-plus/icons-vue'
import { memoApi } from '@/api/memo'
import { createDebounce } from '@/utils/debounce'
import { formatDateTime } from '@/utils/navigation'
import { useCancelableLoader } from '@/composables/useCancelableLoader'
import { useListQueryState } from '@/composables/useListQueryState'

// 1. 响应式状态：使用 shallowRef 优化大型列表性能
const list = shallowRef([]) 
const hasMore = ref(false)
const { loading, run: runListLoad, isLatest } = useCancelableLoader()
const saving = ref(false)
const { keyword, page, pageSize, resetToFirstPage } = useListQueryState({ page: 1, pageSize: 50, keyword: '' })
const activeListScope = ref('today')
const historyCreatedOn = ref(null)
const activeFilter = ref('all')
const stats = reactive({ total: 0, todoTotal: 0, doneTotal: 0, pinnedTotal: 0 })

// 2. 交互状态
const editorVisible = ref(false)
const editorMode = ref('create')
const editingId = ref(null)
const form = reactive({ title: '', content: '', label: '', color: 'blue', pinned: false, completed: false })
const historyVisible = ref(false)
const historyTitle = ref('日志')
const historyList = shallowRef([])

// 3. 静态配置
const statConfig = [
  { label: '全部任务', key: 'total', class: '' },
  { label: '未完成', key: 'todoTotal', class: 'todo' },
  { label: '已完成', key: 'doneTotal', class: 'done' },
  { label: '重要置顶', key: 'pinnedTotal', class: 'pinned' }
]

const listScopeOptions = [
  { label: '今日任务', value: 'today' },
  { label: '往期回顾', value: 'history' }
]
const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '待办', value: 'todo' },
  { label: '完成', value: 'done' },
  { label: '置顶', value: 'pinned' }
]
const colorOptions = [
  { label: '经典蓝', value: 'blue' },
  { label: '薄荷绿', value: 'green' },
  { label: '珊瑚橙', value: 'amber' },
  { label: '丁香紫', value: 'purple' },
  { label: '玫瑰红', value: 'rose' }
]

// 4. 计算逻辑
const isBoardMode = computed(() => activeFilter.value === 'all')
const todoList = computed(() => list.value.filter(i => !i.completed))
const doneList = computed(() => list.value.filter(i => i.completed))
const pageTitle = computed(() => activeListScope.value === 'today' ? '今日任务' : '往期任务')
const emptyDescription = computed(() => activeListScope.value === 'history' ? '这一天没有任何记录' : '今日还没有任务，给自己定个目标吧')

// 5. 方法函数
const loadList = async (targetPage = page.value, append = false) => {
  await runListLoad(async ({ signal, seq }) => {
    const params = {
      page: targetPage,
      pageSize: pageSize.value,
      keyword: keyword.value.trim(),
      filter: activeFilter.value,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    if (activeListScope.value === 'history' && historyCreatedOn.value) {
      params.createdOn = historyCreatedOn.value
    }
    
    const res = activeListScope.value === 'history' ? await memoApi.listHistory(params, { signal }) : await memoApi.list(params, { signal })
    
    if (!isLatest(seq)) return
    
    list.value = append ? [...list.value, ...(res.list || [])] : (res.list || [])
    hasMore.value = list.value.length < res.total
    
    Object.assign(stats, {
      total: res.total || 0,
      todoTotal: res.todoTotal || 0,
      doneTotal: res.doneTotal || 0,
      pinnedTotal: res.pinnedTotal || 0
    })
  })
}

// 核心修改：加载下一页并给予提示
const loadNextPage = async () => {
  if (!hasMore.value) {
    ElMessage.info({ message: '此时刻系统暂无更多可加载的数据', duration: 2000 })
    return
  }
  page.value++
  await loadList(page.value, true)
  
  if (!hasMore.value) {
    ElMessage.info({ message: '已经到底啦，没有更多任务了', duration: 2000 })
  }
}

const openCreate = () => {
  editorMode.value = 'create'
  Object.assign(form, { title: '', content: '', label: '', color: 'blue', pinned: false, completed: false })
  editorVisible.value = true
}

const openEdit = (item) => {
  editorMode.value = 'edit'
  editingId.value = item.id
  Object.assign(form, { ...item })
  editorVisible.value = true
}

const saveMemo = async () => {
  if (!form.title.trim()) return ElMessage.warning('请填写任务名称')
  saving.value = true
  try {
    if (editorMode.value === 'create') await memoApi.create(form)
    else await memoApi.update(editingId.value, form)
    ElMessage.success('已同步至云端')
    editorVisible.value = false
    loadList(1)
  } finally {
    saving.value = false
  }
}

const toggleCompleted = async (item) => {
  try {
    await memoApi.update(item.id, { ...item, completed: !item.completed })
    loadList(1)
  } catch (e) { ElMessage.error('网络繁忙，请重试') }
}

const togglePinned = async (item) => {
  try {
    await memoApi.update(item.id, { ...item, pinned: !item.pinned })
    loadList(1)
  } catch (e) { ElMessage.error('操作失败') }
}

const removeMemo = async (item) => {
  try {
    await ElMessageBox.confirm('任务一旦删除将无法找回，确认继续吗？', '删除确认')
    await memoApi.remove(item.id)
    loadList(1)
  } catch {}
}

const openHistory = async (item) => {
  historyTitle.value = `${item.title} 的修订轨迹`
  historyVisible.value = true
  const res = await memoApi.history(item.id)
  historyList.value = res.histories || []
}

const triggerSearch = createDebounce(() => { resetToFirstPage(); loadList(1); }, 300)
const onKeywordInput = () => triggerSearch()
const handleFilterChange = () => { resetToFirstPage(); loadList(1); }
const handleListScopeChange = () => { historyCreatedOn.value = null; resetToFirstPage(); loadList(1); }
const onHistoryDateChange = () => { resetToFirstPage(); loadList(1); }
const formatTime = (v) => formatDateTime(v)
const actionLabel = (a) => ({ create: '创建了任务', update: '更新了内容', complete: '完成了任务', reopen: '重新开启了任务' }[a] || a)

onMounted(() => loadList(1))
</script>

<style scoped>
/* 容器与背景 */
.memo-container {
  padding: 32px;
  background-color: #fcfdfe;
  min-height: 100vh;
  color: #1a1f36;
}

/* 顶部统计区：现代磁贴风 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}
.stat-item {
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03);
  border: 1px solid #f1f5f9;
}
.stat-label { font-size: 14px; color: #64748b; display: block; margin-bottom: 8px; font-weight: 500; }
.stat-count { font-size: 32px; font-weight: 800; }
.stat-count.todo { color: #f59e0b; }
.stat-count.done { color: #10b981; }
.stat-count.pinned { color: #ef4444; }

/* 核心布局卡片 */
.memo-wrapper {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
  min-height: 600px;
}

/* 头部排版 */
.memo-header {
  padding: 28px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.memo-title { font-size: 24px; font-weight: 850; letter-spacing: -0.5px; margin: 0; }
.memo-badge { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #475569; }

.header-right { display: flex; align-items: center; gap: 16px; }
.vertical-spacer { width: 1px; height: 32px; background: #e2e8f0; margin: 0 4px; }

/* 搜索与日期容器 */
.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 450px;
}
.custom-search { width: 240px; }
.custom-search :deep(.el-input__wrapper) {
  background-color: #f8fafc;
  box-shadow: none !important;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.date-picker-box {
  width: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.date-picker-box.is-expanded {
  width: 220px;
  opacity: 1;
}

.custom-segmented {
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
}

.main-add-btn {
  border-radius: 10px;
  font-weight: 700;
  height: 40px;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

/* 看板视图布局 */
.memo-content { padding: 28px; }
.board-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.column { background: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9; }
.column-head { display: flex; align-items: center; margin-bottom: 20px; font-weight: 700; }
.col-indicator { width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; }
.col-indicator.todo { background: #f59e0b; box-shadow: 0 0 10px rgba(245,158,11,0.3); }
.col-indicator.done { background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.3); }
.col-num { margin-left: auto; color: #94a3b8; font-size: 12px; background: #fff; padding: 2px 10px; border-radius: 20px; }

/* 任务卡片样式 */
.task-list { display: flex; flex-direction: column; gap: 14px; }
.card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #eef2f6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: default;
}
.card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.08); border-color: #cbd5e1; }

.card::after {
  content: '';
  position: absolute;
  left: 0; top: 15%; bottom: 15%;
  width: 4px; border-radius: 0 4px 4px 0;
}
.card.blue::after { background: #3b82f6; }
.card.green::after { background: #10b981; }
.card.amber::after { background: #f59e0b; }
.card.rose::after { background: #f43f5e; }
.card.purple::after { background: #a855f7; }

.card.is-completed { opacity: 0.6; }
.card.is-completed .card-title { text-decoration: line-through; color: #94a3b8; }

.card-inner { padding: 18px; display: flex; gap: 16px; align-items: flex-start; }
.card-main { flex: 1; cursor: pointer; }
.card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.card-title { font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.4; }
.card-body { font-size: 13px; color: #475569; margin: 0 0 12px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-meta { display: flex; justify-content: space-between; align-items: center; }
.tag { font-size: 11px; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
.date { font-size: 11px; color: #cbd5e1; }

/* 核心增加：加载更多与底部提示的样式 */
.load-more-container {
  margin-top: 32px;
  text-align: center;
  padding-bottom: 16px;
}
.load-more-btn {
  padding: 10px 32px;
  font-weight: 600;
}
.no-more-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
}
.no-more-text .line {
  width: 40px;
  height: 1px;
  background-color: #e2e8f0;
}

/* 表单与抽屉样式 */
.form-row { display: flex; gap: 20px; }
.toggle-row { background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
.drawer-btns { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; }

.log-box { background: #f1f5f9; padding: 12px; border-radius: 10px; }
.log-user { font-size: 13px; margin: 0 0 4px; }
.log-content { font-size: 12px; color: #64748b; }

/* 响应式适配 */
@media (max-width: 1280px) {
  .search-container { min-width: 350px; }
  .custom-search { width: 180px; }
}

@media (max-width: 1024px) {
  .stats-overview { grid-template-columns: 1fr 1fr; }
  .board-grid { grid-template-columns: 1fr; }
  .header-right { width: 100%; justify-content: flex-start; }
  .search-container { width: 100%; min-width: auto; }
}
</style>