<template>
  <div class="pager-wrap">
    <el-pagination v-model:current-page="currentPageProxy" v-model:page-size="pageSizeProxy" :page-sizes="pageSizes"
      :total="total" :layout="layout" :background="background" :hide-on-single-page="hideOnSinglePage"
      :pager-count="pagerCount" @current-change="handleCurrentChange" @size-change="handleSizeChange" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array as PropType<number[]>, default: () => [10, 20, 50] },
  layout: { type: String, default: 'total, sizes, prev, pager, next, jumper' },
  background: { type: Boolean, default: true },
  hideOnSinglePage: { type: Boolean, default: false },
  pagerCount: { type: Number, default: 7 }
})

const emit = defineEmits(['update:page', 'update:pageSize', 'page-change', 'size-change'])

const MAX_PAGE_SIZE = 200

const clampPage = (val: number): number => {
  const n = Number(val)
  if (!Number.isFinite(n) || n < 1) return 1
  const maxPage = Math.max(1, Math.ceil(props.total / props.pageSize))
  return Math.min(n, maxPage)
}

const clampPageSize = (val: number): number => {
  const n = Number(val)
  if (!Number.isFinite(n) || n < 1) return props.pageSizes[0] ?? 10
  return Math.min(n, MAX_PAGE_SIZE)
}

const currentPageProxy = computed({
  get: () => props.page,
  set: (val) => emit('update:page', clampPage(val))
})

const pageSizeProxy = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', clampPageSize(val))
})

const handleCurrentChange = (val: number) => {
  emit('page-change', Number(val) || 1)
}

const handleSizeChange = (val: number) => {
  const size = Number(val) || 10
  emit('update:pageSize', size)
  emit('update:page', 1)
  emit('size-change', size)
  emit('page-change', 1)
}
</script>

<style scoped>
.pager-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .pager-wrap {
    justify-content: flex-start;
  }
}
</style>
