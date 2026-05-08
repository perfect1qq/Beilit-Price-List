import { computed, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import mediumShelfWeightApi from '@/api/mediumShelfWeight'
import { to } from '@/utils/async'
import { showError, showSuccess, showWarning, showInfo } from '@/utils/message'

const normalizeList = (list = []) => (Array.isArray(list) ? list : [])

const cloneRows = (rows = []) => JSON.parse(JSON.stringify(rows || []))

const createEmptySummaryRow = (index) => ({
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

const createEmptyDetailRow = (index) => ({
  index,
  layerGroup: '',
  spec: '',
  loadPerLayer: '',
  quote: '',
  actual: ''
})

const reindexRows = (rows = []) => {
  if (!Array.isArray(rows)) return []
  rows.forEach((row, index) => {
    row.index = index + 1
  })
  return rows
}

const formatConfigText = (text) => {
  if (!text) return ''
  return String(text)
    .split('；')
    .map(item => item.trim())
    .filter(Boolean)
    .join('\n')
}

export function useMediumShelfWeight() {
  const loading = ref(false)
  const saving = ref(false)
  const errorMsg = ref('')
  const editMode = ref(false)
  const configTitle = ref('中型货架重量表')

  const summaryRows = ref([])
  const detailRows = ref([])
  const draftSummaryRows = ref([])
  const draftDetailRows = ref([])

  const getCurrentSummaryRows = () => (editMode.value ? draftSummaryRows.value : summaryRows.value)
  const getCurrentDetailRows = () => (editMode.value ? draftDetailRows.value : detailRows.value)

  const displaySummaryRows = computed(() => getCurrentSummaryRows())
  const displayDetailRows = computed(() => getCurrentDetailRows())

  const applyConfig = (config) => {
    const payload = config?.payload || {}

    configTitle.value = config?.title || '中型货架重量表'

    summaryRows.value = reindexRows(
      cloneRows(normalizeList(payload.summaryRows)).map((item, index) => ({
        index: item.index || index + 1,
        name: item.name || '',
        spec: item.spec || '',
        layers: item.layers || '',
        load: item.load || '',
        totalWeight: item.totalWeight || '',
        uprightWeight: item.uprightWeight || '',
        beamWeight: item.beamWeight || '',
        shelfWeight: item.shelfWeight || ''
      }))
    )

    detailRows.value = reindexRows(
      cloneRows(normalizeList(payload.detailRows)).map((item, index) => ({
        index: item.index || index + 1,
        layerGroup: item.layerGroup || '',
        spec: item.spec || '',
        loadPerLayer: item.loadPerLayer || '',
        quote: item.quote || '',
        actual: item.actual || ''
      }))
    )

    if (editMode.value) {
      draftSummaryRows.value = cloneRows(summaryRows.value)
      draftDetailRows.value = cloneRows(detailRows.value)
    }
  }

  const loadData = async () => {
    loading.value = true
    errorMsg.value = ''
    const [err, res] = await to(mediumShelfWeightApi.getConfig())
    if (err) {
      errorMsg.value = err?.response?.data?.message ?? '由于网络或服务端异常，加载中型货架重量表失败'
      showError(errorMsg.value)
      loading.value = false
      return
    }
    applyConfig(res?.config)
    loading.value = false
  }

  const startEdit = () => {
    draftSummaryRows.value = cloneRows(summaryRows.value)
    draftDetailRows.value = cloneRows(detailRows.value)
    editMode.value = true
  }

  const cancelEdit = () => {
    editMode.value = false
    draftSummaryRows.value = []
    draftDetailRows.value = []
    showInfo('已取消修改')
  }

  const addSummaryRow = () => {
    draftSummaryRows.value.push(createEmptySummaryRow(draftSummaryRows.value.length + 1))
    reindexRows(draftSummaryRows.value)
  }

  const addDetailRow = () => {
    draftDetailRows.value.push(createEmptyDetailRow(draftDetailRows.value.length + 1))
    reindexRows(draftDetailRows.value)
  }

  const removeSummaryRow = async (index) => {
    const [confirmErr] = await to(ElMessageBox.confirm('确定删除这一行汇总数据吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }))
    if (confirmErr) return
    draftSummaryRows.value.splice(index, 1)
    reindexRows(draftSummaryRows.value)
  }

  const removeDetailRow = async (index) => {
    const [confirmErr] = await to(ElMessageBox.confirm('确定删除这一行明细数据吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }))
    if (confirmErr) return
    draftDetailRows.value.splice(index, 1)
    reindexRows(draftDetailRows.value)
  }

  const validateRows = () => {
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

  const saveData = async () => {
    if (!validateRows()) return

    saving.value = true
    const payload = {
      summaryRows: reindexRows(cloneRows(draftSummaryRows.value)),
      detailRows: reindexRows(cloneRows(draftDetailRows.value))
    }
    const [err, res] = await to(mediumShelfWeightApi.saveConfig({
      title: configTitle.value,
      payload
    }))
    if (err) {
      const msg = err?.response?.data?.message || '保存失败'
      showError(msg)
      saving.value = false
      return
    }
    applyConfig(res.config)
    editMode.value = false
    draftSummaryRows.value = []
    draftDetailRows.value = []
    showSuccess('保存成功')
    saving.value = false
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
