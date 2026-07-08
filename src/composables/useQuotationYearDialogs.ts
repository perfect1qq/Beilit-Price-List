import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { HistoryRecord } from '@/composables/useQuotationHistory'

interface UseQuotationYearDialogsOptions {
  groupedHistoryList: ComputedRef<Array<{ year: number }>>
  customYears: Ref<number[]>
  addCustomYear: (year: number) => void
  removeCustomYear: (year: number) => void
  moveToYear: (record: HistoryRecord, year: number) => Promise<boolean>
}

export const useQuotationYearDialogs = (options: UseQuotationYearDialogsOptions) => {
  const { groupedHistoryList, customYears, addCustomYear, removeCustomYear, moveToYear } = options

  const showAddYearDialog = ref(false)
  const newYear = ref(new Date().getFullYear() + 1)

  const showMoveYearDialog = ref(false)
  const movingRecord = ref<HistoryRecord | null>(null)
  const targetMoveYear = ref<number | null>(null)

  const availableYears = computed(() => {
    return groupedHistoryList.value.map((g) => g.year).sort((a, b) => b - a)
  })

  const confirmAddYear = () => {
    const year = newYear.value
    if (!year || year < 2000 || year > 2099) {
      ElMessage.warning('请输入有效的年份（2000-2099）')
      return
    }

    const exists = groupedHistoryList.value.some((g) => g.year === year)
    if (exists) {
      ElMessage.warning(`${year} 年已存在`)
      return
    }

    addCustomYear(year)
    showAddYearDialog.value = false
    ElMessage.success(`已添加 ${year} 年`)
  }

  const isCustomYear = (year: number): boolean => {
    return customYears.value.includes(year)
  }

  const handleRemoveYear = (year: number) => {
    ElMessageBox.confirm(
      `确定删除 ${year} 年？该年份下的报价单不会被删除，只是移除该年份分组。`,
      '删除年份',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
      .then(() => {
        removeCustomYear(year)
        ElMessage.success(`已删除 ${year} 年`)
      })
      .catch(() => { })
  }

  const openMoveYearDialog = (record: HistoryRecord) => {
    movingRecord.value = record

    const currentDate = record.createdAt || record.updatedAt || ''
    const currentYear = new Date(currentDate).getFullYear()
    targetMoveYear.value = Number.isNaN(currentYear) ? null : currentYear
    showMoveYearDialog.value = true
  }

  const confirmMoveToYear = async () => {
    if (!movingRecord.value || !targetMoveYear.value) {
      ElMessage.warning('请选择目标年份')
      return
    }

    const success = await moveToYear(movingRecord.value, targetMoveYear.value)
    if (success) {
      showMoveYearDialog.value = false
      movingRecord.value = null
      targetMoveYear.value = null
    }
  }

  return {
    showAddYearDialog,
    newYear,
    showMoveYearDialog,
    movingRecord,
    targetMoveYear,
    availableYears,
    confirmAddYear,
    isCustomYear,
    handleRemoveYear,
    openMoveYearDialog,
    confirmMoveToYear,
  }
}
