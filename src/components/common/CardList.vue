

<template>
  <div class="card-list" v-bind="$attrs" @copy="handleCopy">

    <div v-if="loading" class="loading-wrapper">
      <slot name="loading">
        <el-skeleton :rows="skeletonRows" animated :count="skeletonCount" />
      </slot>
    </div>


    <div v-else-if="data.length === 0" class="empty-wrapper">
      <el-empty :description="emptyDescription" :image-size="emptyImageSize">
        <template #image>
          <slot name="empty-image" />
        </template>
        <template #default>
          <slot name="empty-action" />
        </template>
      </el-empty>
    </div>


    <div v-else class="cards-grid" :class="'grid-' + columns">
      <div v-for="(item, index) in data"
        :key="((item as Record<string, unknown>)[idField] as string | number) !== undefined ? ((item as Record<string, unknown>)[idField] as string | number) : index"
        class="card-item" :class="{
          'is-selected': isSelected(item),
          'is-disabled': isDisabled(item),
          'is-draggable': draggable
        }" :data-card-item="draggable" @click="handleCardClick(item, $event)"
        @contextmenu.prevent="$emit('card-contextmenu', item, $event)">

        <div v-if="selectable && (multiple || isSelected(item))" class="selection-indicator">
          <el-checkbox :model-value="isSelected(item)" @click.stop
            @change="(val: unknown) => handleSelectChange(item, !!val, undefined)" />
        </div>


        <slot name="card" :item="item" :index="index" :selected="isSelected(item)">

          <div class="default-card">
            <h4>{{ (item as Record<string, unknown>)[titleField] || item.title || '未命名' }}</h4>
            <p>{{ (item as Record<string, unknown>)[descriptionField] || item.description || '' }}</p>
          </div>
        </slot>


        <div v-if="$slots.actions" class="card-actions" @click.stop>
          <slot name="actions" :item="item" :index="index" />
        </div>


        <div v-if="dragHandle && draggable" class="drag-handle" @mousedown.stop>
          <slot name="drag-handle">
            <span class="drag-icon">⋮⋮</span>
          </slot>
        </div>
      </div>
    </div>


    <div v-if="loadMore && hasMore && !loading" class="load-more-wrapper">
      <el-button type="primary" plain :loading="loadingMore" @click="$emit('load-more')">
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </el-button>
    </div>


    <div v-if="showPagination && total > 0 && !loading" class="pagination-wrapper">
      <PagePagination v-model:page="currentPage" v-model:pageSize="currentPageSize" :total="total"
        :page-sizes="pageSizes" @page-change="handlePageChange" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends CardListItem">
import { computed } from 'vue'
import type { PropType } from 'vue'
import PagePagination from './PagePagination.vue'
import { DEFAULT_PAGINATION } from '@/constants/table'

export type CardListItem = {
  id?: string | number
  title?: string
  description?: string
}

const props = defineProps({

  data: {
    type: Array as PropType<T[]>,
    default: () => []
  },

  loading: {
    type: Boolean,
    default: false
  },

  total: {
    type: Number,
    default: 0
  },

  currentPage: {
    type: Number,
    default: 1
  },

  pageSize: {
    type: Number,
    default: 20
  },

  pageSizes: {
    type: Array as PropType<number[]>,
    default: () => DEFAULT_PAGINATION.pageSizes
  },

  showPagination: {
    type: Boolean,
    default: true
  },

  columns: {
    type: Number,
    default: 2,
    validator: (val: unknown) => [1, 2, 3, 4].includes(val as number)
  },

  emptyDescription: {
    type: String,
    default: '暂无数据'
  },

  emptyImageSize: {
    type: Number,
    default: 100
  },




  selectable: {
    type: Boolean,
    default: false
  },

  multiple: {
    type: Boolean,
    default: false
  },

  selectedItems: {
    type: Array as PropType<T[]>,
    default: () => []
  },

  idField: {
    type: String,
    default: 'id'
  },

  titleField: {
    type: String,
    default: 'title'
  },

  descriptionField: {
    type: String,
    default: 'description'
  },

  draggable: {
    type: Boolean,
    default: false
  },

  dragHandle: {
    type: Boolean,
    default: false
  },

  disabledFn: {
    type: Function as PropType<(item: T) => boolean>,
    default: null
  },

  loadMore: {
    type: Boolean,
    default: false
  },

  hasMore: {
    type: Boolean,
    default: false
  },

  loadingMore: {
    type: Boolean,
    default: false
  },

  skeletonRows: {
    type: Number,
    default: 3
  },

  skeletonCount: {
    type: Number,
    default: 3
  }
})

defineSlots<{
  card?: (props: { item: T; index: number; selected: boolean }) => unknown
  actions?: (props: { item: T; index: number }) => unknown
  loading?: () => unknown
  'empty-image'?: () => unknown
  'empty-action'?: () => unknown
  'drag-handle'?: () => unknown
}>()

const emit = defineEmits<{
  'update:currentPage': [value: number]
  'update:pageSize': [value: number]
  'update:selectedItems': [value: T[]]
  'page-change': [page: number]
  'card-click': [item: T, event: MouseEvent]
  'card-contextmenu': [item: T, event: MouseEvent]
  'card-select': [item: T, selected: boolean, selectedItems: T[]]
  'card-dblclick': [item: T, event: MouseEvent]
  'load-more': []
  'drag-start': [item: T]
  'drag-end': [item: T]
}>()

const currentPage = computed({
  get: () => props.currentPage,
  set: (val) => emit('update:currentPage', val)
})

const currentPageSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val)
})



const isSelected = (item: T): boolean => {
  if (!props.selectable) return false
  const itemRecord = item as Record<string, unknown>
  const id = itemRecord[props.idField]
  return props.selectedItems.some(selected => (selected as Record<string, unknown>)[props.idField] === id)
}



const isDisabled = (item: T): boolean => {
  return props.disabledFn ? props.disabledFn(item) : false
}



const handleCardClick = (item: T, event: MouseEvent): void => {
  if (isDisabled(item)) return

  if (props.selectable) {
    handleSelectChange(item, !isSelected(item), event)
    return
  }

  emit('card-click', item, event)

  if (event.detail === 2) {
    emit('card-dblclick', item, event)
  }
}



const handleSelectChange = (item: T, selected: boolean, _event?: MouseEvent): void => {
  if (props.multiple) {
    let newSelected = [...props.selectedItems]
    if (selected) {
      newSelected.push(item)
    } else {
      newSelected = newSelected.filter(i => (i as Record<string, unknown>)[props.idField] !== (item as Record<string, unknown>)[props.idField])
    }
    emit('update:selectedItems', newSelected)
    emit('card-select', item, selected, newSelected)
  } else {
    emit('update:selectedItems', selected ? [item] : [])
    emit('card-select', item, selected, selected ? [item] : [])
  }
}



const handlePageChange = (page: number): void => {
  emit('page-change', page)
}

const handleCopy = (e: ClipboardEvent): void => {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !e.clipboardData) return
  const text = selection.toString().trim()
  if (!text) return
  e.preventDefault()
  e.clipboardData.setData('text/plain', text)
}
</script>

<style scoped>
.card-list {
  width: 100%;
  position: relative;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.empty-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.cards-grid {
  display: grid;
  gap: 16px;
  transition: all 0.3s ease;
}

/* 响应式列数 */
.grid-1 {
  grid-template-columns: 1fr;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

.card-item {
  position: relative;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  user-select: text;
  -webkit-user-select: text;
}

.card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.card-item.is-selected {
  border-color: #3b82f6;
  background-color: #ecf5ff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.card-item.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.card-item.is-draggable {
  cursor: grab;
}

.card-item.is-draggable:active {
  cursor: grabbing;
}

/* 选中指示器 */
.selection-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}

/* 卡片操作按钮 */
.card-actions {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-item:hover .card-actions {
  opacity: 1;
}

/* 拖拽手柄 */
.drag-handle {
  position: absolute;
  top: 50%;
  right: -8px;
  transform: translateY(-50%);
  cursor: move;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.drag-handle:hover {
  background: #e4e7ed;
}

.card-item:hover .drag-handle {
  opacity: 1;
}

.drag-icon {
  color: #909399;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
}

/* 默认卡片样式 */
.default-card h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.default-card p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

/* 加载更多按钮 */
.load-more-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 16px 0;
}

/* 分页器 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding: 0 4px;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {

  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }

  .card-item {
    padding: 16px;
  }

  .selection-indicator {
    top: 8px;
    right: 8px;
  }

  .card-actions {
    opacity: 1;
  }
}
</style>
