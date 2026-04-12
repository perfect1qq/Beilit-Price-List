<template>
  <div class="smart-pagination" :class="{ 'is-compact': compact }">
    <el-pagination
      v-model:current-page="currentPageProxy"
      v-model:page-size="pageSizeProxy"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      :pager-count="pagerCount"
      :background="background"
      :small="small"
      :hide-on-single-page="hideOnSinglePage"
      :disabled="disabled"
      @current-change="emit('current-change', $event)"
      @size-change="emit('size-change', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 20, 50] },
  layout: { type: String, default: 'total, sizes, prev, pager, next, jumper' },
  pagerCount: { type: Number, default: 7 },
  background: { type: Boolean, default: true },
  small: { type: Boolean, default: false },
  hideOnSinglePage: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  compact: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:pageSize', 'current-change', 'size-change'])

const currentPageProxy = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const pageSizeProxy = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val)
})
</script>

<style scoped>
.smart-pagination {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  overflow-x: auto;
  scrollbar-gutter: stable;
}

.smart-pagination.is-compact {
  justify-content: center;
}
</style>
