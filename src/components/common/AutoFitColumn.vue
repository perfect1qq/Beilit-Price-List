<template>
  <el-table-column
    v-bind="$attrs"
    :prop="prop"
    :label="label"
    :align="align"
    :fixed="fixed"
    :show-overflow-tooltip="showOverflowTooltip"
    :[widthProp]="computedWidth"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData" :key="name">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getColumnWidth } from '@/utils/tableAutoFit'

defineOptions({
  name: 'AutoFitColumn',
  inheritAttrs: false
})

export interface AutoFitColumnProps {
  /** 表格数据源列表（必传，或传空数组），用于实时计算本列自适应内容宽度 */
  data?: unknown[]
  /** 字段名（同 el-table-column 的 prop） */
  prop?: string
  /** 表头标题（同 el-table-column 的 label） */
  label?: string
  /** 最小保底宽度，默认 110px */
  min?: number
  /** 最大上限宽度，默认 480px */
  max?: number
  /** 自定义行内容提取器函数，或传字段名；如果使用了 #default 插槽渲染自定义内容，推荐传入 getter 以精确算宽 */
  getter?: string | ((row: any) => unknown)
  /** 对齐方式，默认居中 center */
  align?: string
  /** 是否固定列，如 'right', 'left' */
  fixed?: boolean | string
  /** 是否开启溢出 Tooltip 提示，默认 true */
  showOverflowTooltip?: boolean
  /** 是否直接绑定 width（定宽模式），默认 false 绑定 min-width（自适应最小宽度模式） */
  useWidth?: boolean
  /** 手动指定宽度，若指定则不再自动计算 */
  width?: number | string
  /** 手动指定最小宽度，若指定且不传入 data，则直接使用此最小宽度 */
  minWidth?: number | string
}

const props = withDefaults(defineProps<AutoFitColumnProps>(), {
  data: () => [],
  min: 70,
  max: 480,
  align: 'center',
  showOverflowTooltip: true,
  useWidth: false
})

const widthProp = computed(() => {
  return props.useWidth ? 'width' : 'min-width'
})

const computedWidth = computed(() => {
  if (props.width != null) return props.width
  if (props.minWidth != null && (!props.data || !props.data.length)) return props.minWidth
  if (props.data && (props.prop || props.getter || props.label)) {
    const accessor = props.getter || props.prop || ((row: any) => '')
    return getColumnWidth(props.data, accessor as any, props.label || '', {
      min: props.min,
      max: props.max
    })
  }
  return props.minWidth
})
</script>
