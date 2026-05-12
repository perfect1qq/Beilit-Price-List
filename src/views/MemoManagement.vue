<!--
  @file views/MemoManagement.vue
  @description 备忘录管理页面（任务/待办事项管理）

  功能说明：
  - 任务看板模式：分"待处理"和"已圆满"两列展示（类似 Trello）
  - 列表模式：按时间线展示所有备忘录
  - 创建、编辑、删除备忘录
  - 标记完成/取消完成
  - 置顶重要任务
  - 按标签分类筛选
  - 搜索功能（标题/内容）
  - 今日视图 / 历史归档切换
  - 统计概览（总数、已完成、待处理）
  - 查看修改历史日志

  页面布局：
  ┌──────────────────────────────────────────────────────────────┐
  │  MemoContainer                                               │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │ MemoStatsRow (统计栏)                                  │  │
  │  │ 总计: 20 | 待处理: 8 | 已完成: 12                      │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │ Header (工具栏)                                        │  │
  │  │ [LIVE/ARCHIVE] [搜索框] [日期选择] [全部/进行中/已完成]│  │
  │  │ [+ 新建任务]                                           │  │
  │  ├────────────────────────────────────────────────────────┤  │
  │  │ Content (内容区)                                       │  │
  │  │                                                        │  │
  │  │ 【看板模式】(isBoardMode=true)                         │  │
  │  │ ┌─────────────────┬─────────────────┐                 │  │
  │  │ │ 📋 待处理 (8)    │ ✅ 已圆满 (12)   │                 │  │
  │  │ │ ┌─────────────┐ │ ┌─────────────┐ │                 │  │
  │  │  │ │ ☐ Task 1    │ │ │ ☑ Task A    │ │                 │  │
  │  │  │ │ [置顶]      │ │ │ 完成于...   │ │                 │  │
  │  │  │ └─────────────┘ │ └─────────────┘ │                 │  │
  │  │  └─────────────────┴─────────────────┘                 │  │
  │  │                                                        │  │
  │  │ 【列表模式】(isBoardMode=false)                        │  │
  │  │ ┌──────────────────────────────────────┐               │  │
  │  │ │ ☐ Task 1 - 内容摘要... [更多操作▼]  │               │  │
  │  │ │ ☑ Task A (已完成) - ...             │               │  │
  │  │ └──────────────────────────────────────┘               │  │
  │  └────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────┘

  数据模型：
  ┌─────────────────────────────────────────────────────────────┐
  │  Memo (备忘录)                                              │
  ├─────────────────────────────────────────────────────────────┤
  │  id: number              - 唯一标识                          │
  │  title: string           - 任务标题                          │
  │  content: string         - 详细内容                          │
  │  completed: boolean      - 是否已完成                        │
  │  pinned: boolean         - 是否置顶                          │
  │  label: string           - 分类标签（默认/工作/生活等）        │
  │  color: string           - 卡片颜色主题                      │
  │  completedAt: Date       - 完成时间                          │
  │  createdAt: Date         - 创建时间                          │
  │  updatedAt: Date         - 最后修改时间                      │
  └─────────────────────────────────────────────────────────────┘

  权限控制：
  - admin/user: 完整 CRUD 权限，可创建/编辑/删除
  - guest: 只读模式，仅可查看，无新建/编辑/删除按钮

  视图模式切换：
  - today (LIVE): 显示今天的任务，支持看板/列表两种视图
  - history (ARCHIVE): 显示历史归档任务，仅列表视图，支持按日期筛选

  API 调用：
  - GET /api/memos → 获取备忘录列表
  - POST /api/memos → 创建新备忘录
  - PUT /api/memos/:id → 更新备忘录
  - DELETE /api/memos/:id → 删除备忘录
  - GET /api/memos/:id/history → 获取修改日志
-->

<template>
  <div class="memo-container">
    <MemoStatsRow :stats="stats" :scope-stat-copy="scopeStatCopy" />

    <div class="memo-wrapper">
      <MemoFilter v-model:active-list-scope="activeListScope" v-model:keyword="keyword"
        v-model:history-created-on="historyCreatedOn" v-model:active-filter="activeFilter" :is-guest="isGuest"
        @scope-change="handleListScopeChange" @keyword-input="onKeywordInput" @date-change="onHistoryDateChange"
        @filter-change="handleFilterChange" @create="openCreate" />

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
                  <MemoCard v-for="item in todoList" :key="item.id" :item="item" board-mode
                    @toggle-completed="toggleCompleted" @edit="openEdit" @toggle-pinned="togglePinned"
                    @history="openHistory" @remove="removeMemo" />
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
                  <MemoCard v-for="item in doneList" :key="item.id" :item="item" board-mode
                    @toggle-completed="toggleCompleted" @edit="openEdit" @toggle-pinned="togglePinned"
                    @history="openHistory" @remove="removeMemo" />
                </div>

                <el-empty v-if="!doneList.length" description="继续加油" :image-size="80" />
              </section>
            </div>

            <div v-show="!isBoardMode" class="list-view">
              <div v-if="list.length" class="task-list single-stack">
                <MemoCard v-for="item in list" :key="item.id" :item="item" :board-mode="false"
                  :highlight-id="highlightId" :is-guest="isGuest" @toggle-completed="toggleCompleted" @edit="openEdit"
                  @remove="removeMemo" />
              </div>

              <el-empty v-else :description="emptyDescription" />
            </div>

            <div class="load-more-container">
              <div v-if="loading" class="no-more-text">
                <span>加载中...</span>
              </div>

              <div v-else-if="!hasMore && list.length > 0" class="no-more-text">
                <span class="line"></span>
                <span>已经没有更多任务了</span>
                <span class="line"></span>
              </div>
            </div>

            <div ref="loadMoreTriggerRef" class="load-more-sentinel" aria-hidden="true"></div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <MemoEditorDrawer ref="memoEditorRef" v-model:visible="editorVisible" :is-create="editorMode === 'create'"
      :form="form" :saving="saving" @save="saveMemo" />

    <MemoHistoryDrawer v-model:visible="historyVisible" :title="historyTitle" :list="historyList" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import memoApi from '@/api/memo'
import { debounce } from '@/utils/debounce'
import { to } from '@/utils/async'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { useCancelableLoader } from '@/composables/useCancelableLoader'
import { useListQueryState } from '@/composables/useListQueryState'
import { usePermissions } from '@/composables/usePermissions'
import MemoStatsRow from '@/components/memo/MemoStatsRow.vue'
import MemoEditorDrawer from '@/components/memo/MemoEditorDrawer.vue'
import MemoHistoryDrawer from '@/components/memo/MemoHistoryDrawer.vue'
import MemoCard from '@/components/memo/MemoCard.vue'
import MemoFilter from '@/components/memo/MemoFilter.vue'
import type { MemoData } from '@/types'

// 1. 响应式状态：使用 shallowRef 优化大型列表性能
const { isGuest } = usePermissions()
const list = shallowRef<MemoData[]>([])
const hasMore = ref(false)
const memoEditorRef = ref<InstanceType<typeof MemoEditorDrawer> | null>(null)
const { loading, run: runListLoad, isLatest } = useCancelableLoader()
const saving = ref(false)
const { keyword, page, pageSize, resetToFirstPage } = useListQueryState({ page: 1, pageSize: 50, keyword: '' })
const activeListScope = ref('today')
const historyCreatedOn = ref<string | undefined>(undefined)
const activeFilter = ref('all')
const stats = reactive({ total: 0, todoTotal: 0, doneTotal: 0, pinnedTotal: 0 })

const scopeStatCopy = computed(() => {
  const isHistory = activeListScope.value === 'history'
  return {
    mode: isHistory ? 'history' : 'today',
    totalLabel: isHistory ? '往期任务' : '全部任务',
    totalTip: isHistory ? '历史创建的任务总数' : '当前视图的任务总数',
    todoTip: isHistory ? '往期未完成任务' : '待处理事项',
    doneTip: isHistory ? '往期已完成' : '已完成的任务',
    pinnedTip: isHistory ? '历史置顶' : '重要置顶'
  }
})

const route = useRoute()
const highlightId = ref<number | undefined>(undefined)

// 2. 交互状态
const editorVisible = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const form = reactive<MemoData>({ title: '', content: '', label: '', color: 'blue', pinned: false, completed: false, remindAt: undefined })
const originalForm = reactive<MemoData>({ title: '', content: '', label: '', color: 'blue', pinned: false, completed: false, remindAt: undefined })
const historyVisible = ref(false)
const historyTitle = ref('日志')
const historyList = shallowRef<MemoData[]>([])

// 抖音式底部哨兵
const loadMoreTriggerRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const isBoardMode = computed(() => activeFilter.value === 'all')
const todoList = computed(() => list.value.filter((i: MemoData) => !i.completed))
const doneList = computed(() => list.value.filter((i: MemoData) => i.completed))
const emptyDescription = computed(() =>
  activeListScope.value === 'history' ? '这一天没有任何记录' : '今日还没有任务，给自己定个目标吧'
)

const loadList = async (targetPage = page.value, append = false) => {
  await runListLoad(async ({ signal, seq }) => {
    const params: Record<string, unknown> = {
      page: targetPage,
      pageSize: pageSize.value,
      keyword: keyword.value.trim(),
      filter: activeFilter.value,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    if (activeListScope.value === 'history' && historyCreatedOn.value) {
      params.createdOn = historyCreatedOn.value
    }

    const res =
      activeListScope.value === 'history'
        ? await (memoApi.listHistory as (params: Record<string, unknown>, opts?: Record<string, unknown>) => Promise<Record<string, unknown>>)(params, { signal })
        : await (memoApi.list as (params: Record<string, unknown>, opts?: Record<string, unknown>) => Promise<Record<string, unknown>>)(params, { signal })

    if (!isLatest(seq)) return

    const rows = (res as Record<string, unknown>).list || []
    list.value = append ? [...list.value, ...(rows as MemoData[])] : (rows as MemoData[])
    hasMore.value = list.value.length < (Number((res as Record<string, unknown>).total) || 0)

    Object.assign(stats, {
      total: (res as Record<string, unknown>).total || 0,
      todoTotal: (res as Record<string, unknown>).todoTotal || 0,
      doneTotal: (res as Record<string, unknown>).doneTotal || 0,
      pinnedTotal: res.pinnedTotal || 0
    })
  })
}

// 抖音式：滚动到接近底部自动加载
const loadNextPage = async () => {
  if (!hasMore.value || loading.value) return

  page.value += 1
  await loadList(page.value, true)
}

const initInfiniteObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  const target = loadMoreTriggerRef.value
  if (!target) return

  observer = new IntersectionObserver(
    entries => {
      const [entry] = entries
      if (entry?.isIntersecting) {
        loadNextPage()
      }
    },
    {
      root: null,
      rootMargin: '0px 0px 240px 0px',
      threshold: 0.1
    }
  )

  observer.observe(target)
}

const openCreate = () => {
  editorMode.value = 'create'
  Object.assign(form, { title: '', content: '', label: '', color: 'blue', pinned: false, completed: false, remindAt: undefined })
  editorVisible.value = true
}

const openEdit = (item: MemoData) => {
  editorMode.value = 'edit'
  editingId.value = item.id ?? null
  Object.assign(form, { ...item })
  Object.assign(originalForm, { ...item })
  editorVisible.value = true
}

const saveMemo = async () => {
  const [validateErr] = await to(memoEditorRef.value?.validate() ?? Promise.resolve(undefined))
  if (validateErr) return

  if (editorMode.value === 'edit') {
    const isChanged = JSON.stringify(form) !== JSON.stringify(originalForm)
    if (!isChanged) {
      showWarning('没有做任何修改')
      return
    }
  }

  saving.value = true
  if (editorMode.value === 'create') {
    const [err, res] = await to(memoApi.create(form))
    if (err) {
      saving.value = false
      return
    }
    showSuccess('新增成功')
    editorVisible.value = false
    page.value = 1
    await loadList(1)
  } else {
    const [err, res] = await to(memoApi.update(editingId.value as number, form))
    if (err) {
      saving.value = false
      return
    }
    showSuccess('修改完成')
    editorVisible.value = false
    const idx = list.value.findIndex((m: MemoData) => m.id === editingId.value)
    if (idx !== -1 && res) {
      const updated = { ...list.value[idx], ...res }
      list.value = [...list.value.slice(0, idx), updated, ...list.value.slice(idx + 1)]
    }
  }
  saving.value = false
}

const toggleCompleted = async (item: MemoData) => {
  const nextCompleted = !item.completed
  const [err] = await to(memoApi.update(item.id as number, { ...item, completed: nextCompleted }))
  if (err) {
    showError('网络繁忙，请重试')
    return
  }
  showSuccess(nextCompleted ? '任务已完成' : '已取消完成标记')
  const idx = list.value.findIndex((m: MemoData) => m.id === item.id)
  if (idx !== -1) {
    const updated = { ...list.value[idx], completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : null }
    list.value = [...list.value.slice(0, idx), updated, ...list.value.slice(idx + 1)]
  }
  if (nextCompleted) {
    stats.doneTotal += 1
    stats.todoTotal -= 1
  } else {
    stats.doneTotal -= 1
    stats.todoTotal += 1
  }
}

const togglePinned = async (item: MemoData) => {
  const nextPinned = !item.pinned
  const [err] = await to(memoApi.update(item.id as number, { ...item, pinned: nextPinned }))
  if (err) {
    showError('操作失败')
    return
  }
  showSuccess(nextPinned ? '已置顶' : '已取消置顶')
  const idx = list.value.findIndex((m: MemoData) => m.id === item.id)
  if (idx !== -1) {
    const updated = { ...list.value[idx], pinned: nextPinned }
    list.value = [...list.value.slice(0, idx), updated, ...list.value.slice(idx + 1)]
  }
  if (nextPinned) {
    stats.pinnedTotal += 1
  } else {
    stats.pinnedTotal -= 1
  }
}

const removeMemo = async (item: MemoData) => {
  const [confirmErr] = await to(ElMessageBox.confirm('任务一旦删除将无法找回，确认继续吗？', '删除确认'))
  if (confirmErr) return

  const [err] = await to(memoApi.remove(item.id as number))
  if (err) return
  showSuccess('删除成功')
  page.value = 1
  await loadList(1)
}

const openHistory = async (item: MemoData) => {
  historyTitle.value = `${item.title} 的修订轨迹`
  historyVisible.value = true
  const res = await memoApi.history(item.id as number)
  historyList.value = res.histories || []
}

const triggerSearch = debounce(() => {
  resetToFirstPage()
  page.value = 1
  loadList(1)
}, 300)

const onKeywordInput = () => triggerSearch()

const handleFilterChange = () => {
  resetToFirstPage()
  page.value = 1
  loadList(1)
}

const handleListScopeChange = () => {
  historyCreatedOn.value = undefined
  resetToFirstPage()
  page.value = 1
  loadList(1)
}

const onHistoryDateChange = () => {
  resetToFirstPage()
  page.value = 1
  loadList(1)
}

onMounted(async () => {
  highlightId.value = route.query.highlight ? Number(typeof route.query.highlight === 'string' ? route.query.highlight : route.query.highlight[0]) : undefined
  await loadList(1)
  initInfiniteObserver()
  if (highlightId.value) {
    nextTick(() => {
      const el = document.querySelector(`[data-memo-id="${highlightId.value}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('highlight-flash')
      }
    })
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
.memo-container {
  padding: 32px;
  background-color: #fcfdfe;
  min-height: 100vh;
  color: #1a1f36;
}

.memo-wrapper {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  min-height: 600px;
}

.memo-content {
  padding: 28px;
}

.board-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.column {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #f1f5f9;
}

.column-head {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-weight: 700;
}

.col-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;
}

.col-indicator.todo {
  background: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}

.col-indicator.done {
  background: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.col-num {
  margin-left: auto;
  color: #94a3b8;
  font-size: 12px;
  background: #fff;
  padding: 2px 10px;
  border-radius: 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.load-more-container {
  margin-top: 32px;
  text-align: center;
  padding-bottom: 16px;
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

.load-more-sentinel {
  width: 100%;
  height: 1px;
}

@media (max-width: 1024px) {
  .board-grid {
    grid-template-columns: 1fr;
  }
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__error) {
  font-size: 11px;
  line-height: 1.6;
  padding-top: 2px;
}
</style>