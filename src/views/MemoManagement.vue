<template>
  <div class="memo-container">
    <MemoStatsRow :stats="stats" :active-filter="activeFilter" @filter-click="setFilter" />

    <div class="memo-wrapper">
      <MemoFilter v-model:keyword="keyword" :is-guest="isGuest" @keyword-input="onKeywordInput" @create="openCreate" />

      <div class="memo-content">
        <el-skeleton :loading="loading && !list.length" animated :rows="12">
          <template #default>
            <div v-show="isBoardMode" class="board-grid">
              <section class="column todo-column">
                <div class="column-head">
                  <span class="col-indicator todo"></span>
                  <span class="col-name">待办</span>
                  <span class="col-num">{{ todoList.length }}</span>
                </div>

                <div class="date-grouped-list">
                  <el-collapse v-model="activeDatePanels" accordion>
                    <el-collapse-item v-for="group in visibleTodoGroups" :key="group.key" :name="group.key">
                      <template #title>
                        <div class="date-group-header">
                          <span class="date-label">{{ group.title }}</span>
                          <span class="date-count">{{ group.count }}条</span>
                        </div>
                      </template>
                      <div class="task-list">
                        <MemoCard v-for="item in group.items" :key="item.id" :item="item" board-mode :is-guest="isGuest"
                          @toggle-completed="toggleCompleted" @edit="openEdit" @toggle-pinned="togglePinned"
                          @history="openHistory" @remove="removeMemo" />
                      </div>
                    </el-collapse-item>
                  </el-collapse>

                  <el-empty v-if="!visibleTodoGroups.length" description="暂无待办任务" :image-size="80" />
                </div>

                <div v-if="todoHasMore" ref="todoLoadMoreTriggerRef" class="load-more-trigger">加载更多...</div>
              </section>

              <section class="column">
                <div class="column-head">
                  <span class="col-indicator done"></span>
                  <span class="col-name">已完成</span>
                  <span class="col-num">{{ doneList.length }}</span>
                </div>

                <div class="date-grouped-list">
                  <el-collapse v-model="activeDoneDatePanels" accordion>
                    <el-collapse-item v-for="group in pagedDoneGroups" :key="group.key" :name="group.key">
                      <template #title>
                        <div class="date-group-header">
                          <span class="date-label">{{ group.title }}</span>
                          <span class="date-count">{{ group.count }}条</span>
                        </div>
                      </template>
                      <div class="task-list">
                        <MemoCard v-for="item in group.items" :key="item.id" :item="item" board-mode :is-guest="isGuest"
                          @toggle-completed="toggleCompleted" @edit="openEdit" @toggle-pinned="togglePinned"
                          @history="openHistory" @remove="removeMemo" />
                      </div>
                    </el-collapse-item>
                  </el-collapse>

                  <el-empty v-if="!pagedDoneGroups.length" description="暂无已完成任务" :image-size="80" />
                </div>

                <div v-if="doneList.length > 0" class="pager-wrap">
                  <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]"
                    :total="doneList.length" layout="total, prev, pager, next" @current-change="handlePageChange"
                    @size-change="handleSizeChange" />
                </div>
              </section>
            </div>

            <div v-show="!isBoardMode" class="list-view">
              <div v-if="pagedGroups.length" class="date-grouped-list">
                <el-collapse v-model="activeListDatePanels" accordion>
                  <el-collapse-item v-for="group in pagedGroups" :key="group.key" :name="group.key">
                    <template #title>
                      <div class="date-group-header">
                        <span class="date-label">{{ group.title }}</span>
                        <span class="date-count">{{ group.count }}条</span>
                      </div>
                    </template>
                    <div class="task-list">
                      <MemoCard v-for="item in group.items" :key="item.id" :item="item" board-mode :is-guest="isGuest"
                        @toggle-completed="toggleCompleted" @edit="openEdit" @toggle-pinned="togglePinned"
                        @history="openHistory" @remove="removeMemo" />
                    </div>
                  </el-collapse-item>
                </el-collapse>

                <el-empty v-if="!pagedGroups.length" :description="emptyDescription" :image-size="80" />
              </div>

              <el-empty v-else :description="emptyDescription" />
            </div>

            <div v-if="!isBoardMode && total > 0" class="pager-wrap">
              <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]"
                :total="total" layout="total, sizes, prev, pager, next, jumper" @current-change="handlePageChange"
                @size-change="handleSizeChange" />
            </div>
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
  total,
  loading,
  saving,
  keyword,
  page,
  pageSize,
  activeFilter,
  stats,
  editorVisible,
  editorMode,
  form,
  historyVisible,
  historyTitle,
  historyList,
  isBoardMode,
  todoList,
  doneList,
  visibleTodoGroups,
  todoHasMore,
  todoLoadMoreTriggerRef,
  pagedDoneGroups,
  pagedGroups,
  activeDatePanels,
  activeDoneDatePanels,
  activeListDatePanels,
  emptyDescription,
  openCreate,
  openEdit,
  saveMemo,
  toggleCompleted,
  togglePinned,
  removeMemo,
  openHistory,
  onKeywordInput,
  setFilter,
  handlePageChange,
  handleSizeChange,
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
  padding: 20px;
  background-color: transparent;
  min-height: 100vh;
  color: #1a1f36;
}

.memo-wrapper {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: none;
  border: 1px solid #e5e7eb;
  min-height: 600px;
}

.memo-content {
  padding: 20px;
}

.board-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.column {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.todo-column {
  min-height: 400px;
}

.date-grouped-list {
  margin-top: 10px;
}

.date-group-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: 20px;
}

.date-label {
  font-weight: 600;
  color: #334155;
}

.date-count {
  margin-left: auto;
  font-size: 12px;
  color: #94a3b8;
  background: #fff;
  padding: 2px 8px;
  border-radius: 10px;
}

:deep(.el-collapse-item__header) {
  background: #fff;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  height: auto;
  line-height: 1.5;
}

:deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
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

.pager-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.load-more-trigger {
  text-align: center;
  padding: 16px 0;
  color: #94a3b8;
  font-size: 13px;
}

@media (max-width: 1024px) {
  .board-grid {
    grid-template-columns: 1fr;
  }

  .pager-wrap {
    justify-content: center;
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
