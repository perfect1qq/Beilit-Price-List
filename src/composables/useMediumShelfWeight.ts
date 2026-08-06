import { computed, ref, type Ref, type ComputedRef } from 'vue'
import { ElMessageBox } from 'element-plus'
import mediumShelfWeightApi from '@/api/mediumShelfWeight'
import { to } from '@/utils/async'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { showError, showSuccess, showWarning, showInfo } from '@/utils/message'
import type { MediumShelfWeightData } from '@/types'

interface SummaryRow {
  index: number
  name: string
  spec: string
  layers: string
  load: string
  totalWeight: string
  uprightWeight: string
  beamWeight: string
  shelfWeight: string
}

interface DetailRow {
  index: number
  layerGroup: string
  spec: string
  loadPerLayer: string
  quote: string
  actual: string
  [key: string]: unknown
}

interface MediumShelfWeightReturn {
  loading: Ref<boolean>
  saving: Ref<boolean>
  errorMsg: Ref<string>
  editMode: Ref<boolean>
  configTitle: Ref<string>
  summaryRows: Ref<SummaryRow[]>
  detailRows: Ref<DetailRow[]>
  draftSummaryRows: Ref<SummaryRow[]>
  draftDetailRows: Ref<DetailRow[]>
  displaySummaryRows: ComputedRef<SummaryRow[]>
  displayDetailRows: ComputedRef<DetailRow[]>
  formatConfigText: (text: string) => string
  loadData: () => Promise<void>
  startEdit: () => void
  cancelEdit: () => void
  addSummaryRow: () => void
  addDetailRow: () => void
  removeSummaryRow: (index: number) => Promise<void>
  removeDetailRow: (index: number) => Promise<void>
  validateRows: () => boolean
  saveData: () => Promise<void>
}

const normalizeList = <T>(list: T[] = []): T[] => (Array.isArray(list) ? list : [])

const cloneRows = <T>(rows: T[] = []): T[] => JSON.parse(JSON.stringify(rows || []))

const createEmptySummaryRow = (index: number): SummaryRow => ({
  index,
  name: '',
  spec: '',
  layers: '',
  load: '',
  totalWeight: '',
  uprightWeight: '',
  beamWeight: '',
  shelfWeight: ''
})

const createEmptyDetailRow = (index: number): DetailRow => ({
  index,
  layerGroup: '',
  spec: '',
  loadPerLayer: '',
  quote: '',
  actual: ''
})

const reindexRows = <T extends { index: number }>(rows: T[] = []): T[] => {
  if (!Array.isArray(rows)) return []
  rows.forEach((row, index) => {
    row.index = index + 1
  })
  return rows
}

const formatConfigText = (text: string): string => {
  if (!text) return ''
  return String(text)
    .split('；')
    .map(item => item.trim())
    .filter(Boolean)
    .join('\n')
}

export const useMediumShelfWeight = (): MediumShelfWeightReturn => {
  const loading = ref(false)
  const { submitLoading: saving, withSubmitLock } = useFormSubmit({ lockDuration: 300 })
  const errorMsg = ref('')
  const editMode = ref(false)
  const configTitle = ref('中型货架重量表')

  const summaryRows = ref<SummaryRow[]>([])
  const detailRows = ref<DetailRow[]>([])
  const draftSummaryRows = ref<SummaryRow[]>([])
  const draftDetailRows = ref<DetailRow[]>([])

  const getCurrentSummaryRows = (): SummaryRow[] => (editMode.value ? draftSummaryRows.value : summaryRows.value)
  const getCurrentDetailRows = (): DetailRow[] => (editMode.value ? draftDetailRows.value : detailRows.value)

  const displaySummaryRows = computed(() => getCurrentSummaryRows())
  const displayDetailRows = computed(() => getCurrentDetailRows())

  const applyConfig = (config: MediumShelfWeightData): void => {
    const payload = config?.payload || {}
    const rawSummary = normalizeList(payload.summaryRows || []) as Record<string, unknown>[]
    const rawDetail = normalizeList(payload.detailRows || []) as Record<string, unknown>[]

    configTitle.value = config?.title || '中型货架重量表'

    summaryRows.value = reindexRows(
      cloneRows(rawSummary).map((item, index) => ({
        index: Number(item.index) || index + 1,
        name: String(item.name || ''),
        spec: String(item.spec || ''),
        layers: String(item.layers || ''),
        load: String(item.load || ''),
        totalWeight: String(item.totalWeight || ''),
        uprightWeight: String(item.uprightWeight || ''),
        beamWeight: String(item.beamWeight || ''),
        shelfWeight: String(item.shelfWeight || '')
      })) as SummaryRow[]
    ) as SummaryRow[]

    detailRows.value = reindexRows(
      cloneRows(rawDetail).map((item, index) => ({
        index: Number(item.index) || index + 1,
        layerGroup: String(item.layerGroup || ''),
        spec: String(item.spec || ''),
        loadPerLayer: String(item.loadPerLayer || ''),
        quote: String(item.quote || ''),
        actual: String(item.actual || '')
      })) as DetailRow[]
    ) as DetailRow[]

    if (editMode.value) {
      draftSummaryRows.value = cloneRows(summaryRows.value)
      draftDetailRows.value = cloneRows(detailRows.value)
    }
  }

  const loadData = async (): Promise<void> => {
    loading.value = true
    errorMsg.value = ''
    const [err, res] = await to(mediumShelfWeightApi.getConfig())
    if (err) {
      const e = err as { response?: { data?: { message?: string } } }
      errorMsg.value = e?.response?.data?.message ?? '由于网络或服务端异常，加载中型货架重量表失败'
      showError(errorMsg.value)
      loading.value = false
      return
    }
    applyConfig((res as { config?: MediumShelfWeightData })?.config as MediumShelfWeightData)
    loading.value = false
  }

  const startEdit = (): void => {
    draftSummaryRows.value = cloneRows(summaryRows.value)
    draftDetailRows.value = cloneRows(detailRows.value)
    editMode.value = true
  }

  const cancelEdit = (): void => {
    editMode.value = false
    draftSummaryRows.value = []
    draftDetailRows.value = []
    showInfo('已取消修改')
  }

  const addSummaryRow = (): void => {
    draftSummaryRows.value.push(createEmptySummaryRow(draftSummaryRows.value.length + 1))
    reindexRows(draftSummaryRows.value)
  }

  const addDetailRow = (): void => {
    draftDetailRows.value.push(createEmptyDetailRow(draftDetailRows.value.length + 1))
    reindexRows(draftDetailRows.value)
  }

  const removeSummaryRow = async (index: number): Promise<void> => {
    const [confirmErr] = await to(ElMessageBox.confirm('确定删除这一行汇总数据吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }))
    if (confirmErr) return
    draftSummaryRows.value.splice(index, 1)
    reindexRows(draftSummaryRows.value)
  }

  const removeDetailRow = async (index: number): Promise<void> => {
    const [confirmErr] = await to(ElMessageBox.confirm('确定删除这一行明细数据吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }))
    if (confirmErr) return
    draftDetailRows.value.splice(index, 1)
    reindexRows(draftDetailRows.value)
  }

  const validateRows = (): boolean => {
    const summary = getCurrentSummaryRows()
    const detail = getCurrentDetailRows()

    if (!summary.length) {
      showWarning('汇总表至少要有一行')
      return false
    }

    if (!detail.length) {
      showWarning('明细表至少要有一行')
      return false
    }

    return true
  }

  const saveData = async (): Promise<void> => {
    if (!validateRows()) return

    await withSubmitLock(async () => {
      const payload = {
        summaryRows: reindexRows(cloneRows(draftSummaryRows.value)),
        detailRows: reindexRows(cloneRows(draftDetailRows.value))
      }
      const [err, res] = await to(mediumShelfWeightApi.saveConfig({
        title: configTitle.value,
        payload
      }))
      if (err) {
        const e = err as { response?: { data?: { message?: string } } }
        const msg = e?.response?.data?.message || '保存失败'
        showError(msg)
        return
      }
      applyConfig((res as { config?: MediumShelfWeightData }).config as MediumShelfWeightData)
      editMode.value = false
      draftSummaryRows.value = []
      draftDetailRows.value = []
      showSuccess('保存成功')
    })
  }

  return {
    loading,
    saving,
    errorMsg,
    editMode,
    configTitle,
    summaryRows,
    detailRows,
    draftSummaryRows,
    draftDetailRows,
    displaySummaryRows,
    displayDetailRows,
    formatConfigText,
    loadData,
    startEdit,
    cancelEdit,
    addSummaryRow,
    addDetailRow,
    removeSummaryRow,
    removeDetailRow,
    validateRows,
    saveData
  }
}
