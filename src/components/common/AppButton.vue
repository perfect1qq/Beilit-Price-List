<template>
  <el-button
    ref="buttonRef"
    :type="resolvedType"
    :size="resolvedSize"
    :plain="resolvedPlain"
    :icon="resolvedIcon"
    :loading="loading"
    :disabled="disabled"
    :round="resolvedRound"
    :circle="circle"
    :link="link"
    :text="text"
    :native-type="nativeType"
    :autofocus="autofocus"
    @click="handleClick"
  >
    <slot>{{ label }}</slot>
  </el-button>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUpdated, type Component } from 'vue'
import {
  Plus, Delete, Edit, Check, Refresh, ArrowLeft, Close, View, MagicStick,
  Download, Upload, Search, Lock, CopyDocument, Clock, Star,
} from '@element-plus/icons-vue'

/**
 * 语义预设：把 type + plain + icon + size 打包
 * 调用方只需 variant="delete" 即可获得统一的删除按钮样式
 */
type Variant =
  | 'add' | 'edit' | 'delete' | 'view'
  | 'save' | 'submit' | 'cancel'
  | 'refresh' | 'back' | 'reset'
  | 'search' | 'download' | 'upload'
  | 'primary' | 'default'

interface VariantConfig {
  type: '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  plain?: boolean
  round?: boolean
  icon?: Component
  size?: 'large' | 'default' | 'small'
  label?: string
}

const VARIANT_PRESETS: Record<Variant, VariantConfig> = {
  add:      { type: 'primary', plain: true,  icon: Plus,         label: '新增' },
  edit:     { type: 'warning', plain: true,  round: true, icon: Edit,         size: 'small', label: '编辑' },
  delete:   { type: 'danger',  plain: true,  round: true, icon: Delete,       size: 'small', label: '删除' },
  view:     { type: 'primary', plain: true,  round: true, icon: View,         size: 'small', label: '查看' },
  save:     { type: 'primary',                icon: Check,        label: '保存' },
  submit:   { type: 'success',                icon: Check,        label: '提交' },
  cancel:   { type: '',                        icon: Close,        label: '取消' },
  refresh:  { type: '',                        icon: Refresh,      label: '刷新' },
  back:     { type: '',                        icon: ArrowLeft,    label: '返回' },
  reset:    { type: '',                        icon: Refresh,      label: '重置' },
  search:   { type: 'primary',                icon: Search,       label: '搜索' },
  download: { type: 'primary',                icon: Download,     label: '下载' },
  upload:   { type: 'primary',                icon: Upload,       label: '上传' },
  primary:  { type: 'primary' },
  default:  { type: '' },
}

const props = defineProps({
  /** 语义预设，设置后自动套用对应的 type/plain/icon/size/round */
  variant: { type: String as () => Variant, default: 'default' },
  /** 覆盖预设的 type */
  type: { type: String as () => '' | 'primary' | 'success' | 'warning' | 'danger' | 'info', default: undefined },
  /** 覆盖预设的 size */
  size: { type: String as () => 'large' | 'default' | 'small', default: undefined },
  /** 覆盖预设的 plain */
  plain: { type: Boolean, default: undefined },
  /** 覆盖预设的 icon；传 null 可清除预设图标 */
  icon: { type: [Object, null] as unknown as () => Component | null, default: undefined },
  /** 按钮文字，也可通过默认 slot 传入（slot 优先级高） */
  label: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  round: { type: Boolean, default: undefined },
  circle: { type: Boolean, default: false },
  link: { type: Boolean, default: false },
  text: { type: Boolean, default: false },
  nativeType: { type: String as () => 'button' | 'submit' | 'reset', default: 'button' },
  autofocus: { type: Boolean, default: false },
  /** 防抖时间（毫秒），设为 0 则不防抖 */
  debounceMs: { type: Number, default: 300 },
})

const emit = defineEmits<{ click: [MouseEvent] }>()

const buttonRef = ref<any>(null)
const dynamicText = ref('')
const isDebouncing = ref(false)

const updateText = () => {
  if (buttonRef.value && buttonRef.value.$el) {
    const text = buttonRef.value.$el.textContent?.trim() || ''
    if (text !== dynamicText.value) {
      dynamicText.value = text
    }
  }
}

onMounted(() => updateText())
onUpdated(() => updateText())

const autoVariant = computed<Variant>(() => {
  if (props.variant !== 'default') return props.variant
  
  const t = dynamicText.value || props.label
  if (!t) return 'default'
  
  if (t.includes('新增') || t.includes('添加') || t.includes('新建') || t.includes('加一') || t.includes('生成')) return 'add'
  if (t.includes('编辑') || t.includes('修改')) return 'edit'
  if (t.includes('删除') || t.includes('清空') || t.includes('移除') || t.includes('驳回') || t.includes('清理')) return 'delete'
  if (t.includes('查看') || t.includes('详情')) return 'view'
  if (t.includes('保存') || t.includes('确认') || t.includes('提交') || t.includes('通过')) return 'save'
  if (t.includes('取消')) return 'cancel'
  if (t.includes('刷新')) return 'refresh'
  if (t.includes('返回')) return 'back'
  if (t.includes('重置') || t.includes('恢复')) return 'reset'
  if (t.includes('搜索') || t.includes('查询')) return 'search'
  if (t.includes('下载') || t.includes('导出')) return 'download'
  if (t.includes('上传') || t.includes('导入')) return 'upload'
  
  return 'default'
})

const preset = computed<VariantConfig>(() => VARIANT_PRESETS[autoVariant.value] || VARIANT_PRESETS.default)

const resolvedType = computed(() => props.type ?? preset.value.type)
const resolvedSize = computed(() => props.size ?? preset.value.size ?? 'default')
const resolvedPlain = computed(() => props.plain ?? preset.value.plain ?? true)
const resolvedRound = computed(() => props.round ?? preset.value.round ?? true)
const resolvedIcon = computed<Component | undefined>(() => {
  // 显式传 null 表示不要图标
  if (props.icon === null) return undefined
  return props.icon ?? preset.value.icon
})

const handleClick = (e: MouseEvent) => {
  if (props.debounceMs > 0) {
    if (isDebouncing.value) return
    isDebouncing.value = true
    setTimeout(() => {
      isDebouncing.value = false
    }, props.debounceMs)
  }
  emit('click', e)
}
</script>

<style scoped>
.el-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(> span) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px; /* 图标与文字间的间距 */
}
</style>
