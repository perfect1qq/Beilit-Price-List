

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
      :form="form" :saving="saving" @save="onSaveMemo" />

    <MemoHistoryDrawer v-model:visible="historyVisible" :title="historyTitle" :list="historyList" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import MemoStatsRow from '@/components/memo/MemoStatsRow.vue'
import MemoEditorDrawer from '@/components/memo/MemoEditorDrawer.vue'
import MemoHistoryDrawer from '@/components/memo/MemoHistoryDrawer.vue'
import MemoCard from '@/components/memo/MemoCard.vue'
import MemoFilter from '@/components/memo/MemoFilter.vue'
import { useMemoManagement } from '@/composables/useMemoManagement'

const memoEditorRef = ref<InstanceType<typeof MemoEditorDrawer> | null>(null)

const {
  isGuest,
  list,
  hasMore,
  loading,
  saving,
  keyword,
  activeListScope,
  historyCreatedOn,
  activeFilter,
  stats,
  scopeStatCopy,
  highlightId,
  editorVisible,
  editorMode,
  form,
  historyVisible,
  historyTitle,
  historyList,
  loadMoreTriggerRef,
  isBoardMode,
  todoList,
  doneList,
  emptyDescription,
  openCreate,
  openEdit,
  saveMemo,
  toggleCompleted,
  togglePinned,
  removeMemo,
  openHistory,
  onKeywordInput,
  handleFilterChange,
  handleListScopeChange,
  onHistoryDateChange,
  init,
  cleanup,
} = useMemoManagement()

const onSaveMemo = () => saveMemo(() => memoEditorRef.value?.validate())

onMounted(() => {
  init()
})

onUnmounted(() => {
  cleanup()
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