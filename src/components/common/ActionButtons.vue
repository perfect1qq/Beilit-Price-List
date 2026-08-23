<template>
  <div class="action-buttons">
    <AppButton
      v-for="action in visibleActions"
      :key="action.key"
      :variant="action.variant"
      :type="action.type"
      :size="action.size || size"
      :plain="action.plain ?? plain"
      :icon="action.icon === null ? null : action.icon"
      :label="action.label"
      :loading="action.loading"
      :disabled="action.disabled"
      :link="action.link ?? link"
      :circle="action.circle ?? circle"
      @click="action.onClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import AppButton from './AppButton.vue'

type Variant =
  | 'add' | 'edit' | 'delete' | 'view'
  | 'save' | 'submit' | 'cancel'
  | 'refresh' | 'back' | 'reset'
  | 'search' | 'download' | 'upload'
  | 'primary' | 'default'

interface ActionButton {
  /** 唯一 key，用于 v-for */
  key: string
  /** 语义预设 */
  variant?: Variant
  /** 覆盖预设的 type */
  type?: '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** 覆盖预设的 size */
  size?: 'large' | 'default' | 'small'
  /** 覆盖预设的 plain */
  plain?: boolean
  /** 覆盖预设的 icon；传 null 清除预设图标 */
  icon?: Component | null
  /** 按钮文字 */
  label: string
  loading?: boolean
  disabled?: boolean
  /** 是否显示，默认 true */
  show?: boolean
  /** link 风格（行内紧凑） */
  link?: boolean
  circle?: boolean
  onClick: () => void
}

const props = defineProps({
  actions: { type: Array as () => ActionButton[], required: true },
  /** 统一 size，默认 small（适合表格操作列） */
  size: { type: String as () => 'large' | 'default' | 'small', default: 'small' },
  /** 统一 plain，默认 true */
  plain: { type: Boolean, default: true },
  /** 统一 link 风格，默认 false（表格用 plain，卡片内用 link） */
  link: { type: Boolean, default: false },
  /** 统一 circle，默认 false */
  circle: { type: Boolean, default: false },
})

const visibleActions = computed(() => props.actions.filter(a => a.show !== false))
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
