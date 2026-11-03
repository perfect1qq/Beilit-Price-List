import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import shelfMaterialWeightApi, {
  type MaterialRow,
  type MaterialSpecPreset,
  type ShelfSpecState,
} from '@/api/shelfMaterialWeight'
import { to } from '@/utils/async'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { showError, showSuccess, showWarning, showInfo } from '@/utils/message'

const DEFAULT_SPECS: Record<string, MaterialSpecPreset> = {
  '立柱90*70*2.0': { expandedSurface: 250, thickness: 2.0, density: 0.00785, materialName: '立柱' },
  '立柱100*70*2.5': { expandedSurface: 1, thickness: 2.5, density: 0.00785, materialName: '立柱' },
  '双C抱焊梁100': { expandedSurface: 202, thickness: 1.5, density: 0.00785, materialName: '横梁' },
  '双C抱焊梁120': { expandedSurface: 222, thickness: 1.5, density: 0.00785, materialName: '横梁' },
  '双C抱焊梁140': { expandedSurface: 242, thickness: 1.5, density: 0.00785, materialName: '横梁' },
  '双C抱焊梁160': { expandedSurface: 262, thickness: 1.5, density: 0.00785, materialName: '横梁' },
  '一体梁100': { expandedSurface: 350, thickness: 1.5, density: 0.00785, materialName: '横梁' },
  '一体梁120': { expandedSurface: 390, thickness: 1.5, density: 0.00785, materialName: '横梁' },
  '一体梁140': { expandedSurface: 430, thickness: 1.5, density: 0.00785, materialName: '横梁' },
  '横撑24*40': { expandedSurface: 93, thickness: 1.5, density: 0.00785, materialName: '横撑' },
  '横撑29*40': { expandedSurface: 103, thickness: 1.5, density: 0.00785, materialName: '横撑' },
  '斜撑24*40': { expandedSurface: 93, thickness: 1.5, density: 0.00785, materialName: '斜撑' },
  '斜撑29*40': { expandedSurface: 103, thickness: 1.5, density: 0.00785, materialName: '斜撑' },
}

const DEFAULT_ROW_CATEGORY: Record<number, string> = {
  0: '立柱',
  1: '横梁',
  2: '横撑',
  3: '斜撑',
}

const generateId = () => Date.now() + Math.floor(Math.random() * 10000)

const cloneData = <T>(val: T): T => JSON.parse(JSON.stringify(val))

const createEmptyRow = (): MaterialRow => ({
  id: generateId(),
  materialName: '',
  name: '',
  expandedSurface: undefined,
  thickness: undefined,
  density: 0.00785,
  length: undefined,
  quantity: undefined,
})

export const useShelfMaterialWeight = () => {
  const loading = ref(false)
  const { submitLoading: saving, withSubmitLock } = useFormSubmit({ lockDuration: 300 })
  const errorMsg = ref('')
  const editMode = ref(false)

  const savedSpecs = ref<Record<string, MaterialSpecPreset>>({ ...DEFAULT_SPECS })
  const draftSpecs = ref<Record<string, MaterialSpecPreset>>({ ...DEFAULT_SPECS })

  const activeSpecs = computed(() => (editMode.value ? draftSpecs.value : savedSpecs.value))

  const buildRowFromSpecs = (
    specsMap: Record<string, MaterialSpecPreset>,
    materialName: string,
    preferredSpecName: string,
    fallbackExpanded: number,
    fallbackThickness: number,
  ): MaterialRow => {
    const direct = specsMap[preferredSpecName]
    if (direct) {
      return {
        id: generateId(),
        materialName,
        name: preferredSpecName,
        expandedSurface: direct.expandedSurface,
        thickness: direct.thickness,
        density: direct.density ?? 0.00785,
        length: undefined,
        quantity: undefined,
      }
    }
    const fallbackKey = Object.keys(specsMap).find((k) => specsMap[k]?.materialName === materialName)
    const fallbackPreset = fallbackKey ? specsMap[fallbackKey] : undefined
    return {
      id: generateId(),
      materialName,
      name: fallbackKey || preferredSpecName,
      expandedSurface: fallbackPreset ? fallbackPreset.expandedSurface : fallbackExpanded,
      thickness: fallbackPreset ? fallbackPreset.thickness : fallbackThickness,
      density: fallbackPreset ? fallbackPreset.density : 0.00785,
      length: undefined,
      quantity: undefined,
    }
  }

  const savedRows = ref<MaterialRow[]>([
    buildRowFromSpecs(DEFAULT_SPECS, '立柱', '立柱90*70*2.0', 250, 2.0),
    buildRowFromSpecs(DEFAULT_SPECS, '横梁', '双C抱焊梁100', 202, 1.5),
    buildRowFromSpecs(DEFAULT_SPECS, '横撑', '横撑24*40', 93, 1.5),
  ])
  const draftRows = ref<MaterialRow[]>([])

  const displayRows = computed(() => (editMode.value ? draftRows.value : savedRows.value))

  const shelfSpec = ref<ShelfSpecState>({
    length: 2000,
    depth: 600,
    height: 2000,
    levels: 4,
    type: 'starter',
  })

  const normalizeRowList = (rows: Partial<MaterialRow>[]): MaterialRow[] =>
    rows.map((r) => ({
      id: r.id || generateId(),
      materialName: r.materialName ?? '',
      name: r.name ?? '',
      expandedSurface: r.expandedSurface ?? undefined,
      thickness: r.thickness ?? undefined,
      density: r.density ?? 0.00785,
      length: r.length ?? undefined,
      quantity: r.quantity ?? undefined,
    }))

  const applyServerPayload = (payload?: {
    shelfSpec?: Partial<ShelfSpecState>
    rows?: Partial<MaterialRow>[]
    specs?: Record<string, MaterialSpecPreset>
  }) => {
    if (!payload) return

    if (payload.specs && typeof payload.specs === 'object') {
      savedSpecs.value = cloneData(payload.specs)
    }

    if (payload.shelfSpec) {
      shelfSpec.value = {
        length: payload.shelfSpec.length ?? 2000,
        depth: payload.shelfSpec.depth ?? 600,
        height: payload.shelfSpec.height ?? 2000,
        levels: payload.shelfSpec.levels ?? 4,
        type: payload.shelfSpec.type === 'addon' ? 'addon' : 'starter',
      }
    }

    if (Array.isArray(payload.rows)) {
      savedRows.value = normalizeRowList(cloneData(payload.rows))
    }

    if (editMode.value) {
      draftRows.value = normalizeRowList(cloneData(savedRows.value))
      draftSpecs.value = cloneData(savedSpecs.value)
    }
  }

  const loadData = async () => {
    loading.value = true
    errorMsg.value = ''
    const [err, res] = await to(shelfMaterialWeightApi.getConfig())
    if (err) {
      const e = err as { response?: { data?: { message?: string } } }
      errorMsg.value = e?.response?.data?.message ?? '加载货架材料重量配置失败'
      showError(err, errorMsg.value)
      loading.value = false
      return
    }
    applyServerPayload(res?.config?.payload)
    loading.value = false
  }

  const startEdit = () => {
    draftRows.value = normalizeRowList(cloneData(savedRows.value))
    draftSpecs.value = cloneData(savedSpecs.value)
    editMode.value = true
  }

  const cancelEdit = () => {
    editMode.value = false
    draftRows.value = []
    draftSpecs.value = cloneData(savedSpecs.value)
    showInfo('已取消修改')
  }

  const addRow = () => {
    draftRows.value.push(createEmptyRow())
  }

  const removeRow = async (index: number) => {
    const [confirmErr] = await to(
      ElMessageBox.confirm('确定删除这一行材料数据吗？', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }),
    )
    if (confirmErr) return
    draftRows.value.splice(index, 1)
  }

  // 直接新增或修改下拉规格预设，并立即持久化到服务器
  const upsertSpecPreset = async ({
    originalName,
    specName,
    preset,
    targetRow,
  }: {
    originalName?: string
    specName: string
    preset: MaterialSpecPreset
    targetRow?: MaterialRow | null
  }): Promise<boolean> => {
    const cleanSpecName = specName.trim()
    if (!cleanSpecName) {
      showWarning('请输入规格名称')
      return false
    }

    const nextSavedSpecs = { ...savedSpecs.value }
    const nextDraftSpecs = { ...draftSpecs.value }

    if (originalName && originalName !== cleanSpecName) {
      delete nextSavedSpecs[originalName]
      delete nextDraftSpecs[originalName]
    }

    nextSavedSpecs[cleanSpecName] = { ...preset }
    nextDraftSpecs[cleanSpecName] = { ...preset }

    // 同步更新已选中该规格的行数据
    const syncRows = (list: MaterialRow[]) => {
      for (const r of list) {
        if ((originalName && r.name === originalName) || r.name === cleanSpecName) {
          r.name = cleanSpecName
          r.expandedSurface = preset.expandedSurface
          r.thickness = preset.thickness
          r.density = preset.density
          if (!r.materialName.trim() && preset.materialName) {
            r.materialName = preset.materialName
          }
        }
      }
    }

    if (targetRow) {
      targetRow.name = cleanSpecName
      targetRow.expandedSurface = preset.expandedSurface
      targetRow.thickness = preset.thickness
      targetRow.density = preset.density
      if (!targetRow.materialName.trim() && preset.materialName) {
        targetRow.materialName = preset.materialName
      }
    }

    syncRows(savedRows.value)
    if (editMode.value) {
      syncRows(draftRows.value)
    }

    const [err] = await to(
      shelfMaterialWeightApi.saveConfig({
        shelfSpec: cloneData(shelfSpec.value),
        rows: normalizeRowList(cloneData(savedRows.value)),
        specs: nextSavedSpecs,
      }),
    )
    if (err) {
      showError(err, '保存规格到服务器失败')
      return false
    }

    savedSpecs.value = nextSavedSpecs
    draftSpecs.value = nextDraftSpecs
    showSuccess(originalName ? `规格「${cleanSpecName}」修改已保存` : `新规格「${cleanSpecName}」已添加并保存`)
    return true
  }

  // 删除下拉规格选项，并同步持久化到服务器
  const deleteSpecOption = async (specName: string) => {
    const [confirmErr] = await to(
      ElMessageBox.confirm(`确定要从规格下拉列表中删除「${specName}」吗？`, '删除规格确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }),
    )
    if (confirmErr) return

    const nextSavedSpecs = { ...savedSpecs.value }
    const nextDraftSpecs = { ...draftSpecs.value }
    delete nextSavedSpecs[specName]
    delete nextDraftSpecs[specName]

    const [err] = await to(
      shelfMaterialWeightApi.saveConfig({
        shelfSpec: cloneData(shelfSpec.value),
        rows: normalizeRowList(cloneData(savedRows.value)),
        specs: nextSavedSpecs,
      }),
    )
    if (err) {
      showError(err, '删除规格失败')
      return
    }

    savedSpecs.value = nextSavedSpecs
    draftSpecs.value = nextDraftSpecs
    showSuccess(`已删除规格「${specName}」`)
  }

  const getOptionsForRow = (row: MaterialRow, index: number) => {
    const specsMap = activeSpecs.value
    const allKeys = Object.keys(specsMap)
    const rowTitle = (row.materialName || '').trim()
    const targetMaterial = rowTitle || DEFAULT_ROW_CATEGORY[index]
    if (targetMaterial) {
      const matched = allKeys.filter((k) => specsMap[k]?.materialName === targetMaterial)
      if (matched.length > 0) {
        return matched
      }
    }
    return allKeys
  }

  const handleNameChange = (row: MaterialRow) => {
    const spec = activeSpecs.value[row.name]
    if (spec) {
      row.expandedSurface = spec.expandedSurface
      row.thickness = spec.thickness
      row.density = spec.density ?? 0.00785
      if (!row.materialName.trim() && spec.materialName) {
        row.materialName = spec.materialName
      }
    }
  }

  const saveData = async () => {
    if (!draftRows.value.length) {
      showWarning('表格至少需要保留一行数据')
      return
    }

    await withSubmitLock(async () => {
      // 将编辑态下每一行录入的规格名和参数自动收录进规格预设字典
      const mergedSpecs: Record<string, MaterialSpecPreset> = { ...draftSpecs.value }
      for (const row of draftRows.value) {
        const specName = (row.name || '').trim()
        if (specName) {
          const prev = mergedSpecs[specName]
          mergedSpecs[specName] = {
            expandedSurface: row.expandedSurface != null ? Number(row.expandedSurface) : (prev?.expandedSurface ?? 0),
            thickness: row.thickness != null ? Number(row.thickness) : (prev?.thickness ?? 0),
            density: row.density != null ? Number(row.density) : (prev?.density ?? 0.00785),
            materialName: (row.materialName || '').trim() || prev?.materialName || '',
          }
        }
      }

      const payload = {
        shelfSpec: cloneData(shelfSpec.value),
        rows: normalizeRowList(cloneData(draftRows.value)),
        specs: mergedSpecs,
      }

      const [err, res] = await to(shelfMaterialWeightApi.saveConfig(payload))
      if (err) {
        showError(err, '保存失败')
        return
      }

      applyServerPayload(res?.config?.payload || payload)
      editMode.value = false
      draftRows.value = []
      showSuccess('保存成功')
    })
  }

  const generateShelfMaterials = () => {
    if (!shelfSpec.value.length || !shelfSpec.value.depth || !shelfSpec.value.height) {
      ElMessage.warning('请输入完整的货架规格（长、宽、高）')
      return
    }

    const specsMap = activeSpecs.value
    const nextRows: MaterialRow[] = []

    // 1. 立柱
    const columnCount = shelfSpec.value.type === 'starter' ? 4 : 2
    const columnRow = buildRowFromSpecs(specsMap, '立柱', '立柱90*70*2.0', 250, 2.0)
    columnRow.length = shelfSpec.value.height
    columnRow.quantity = columnCount
    nextRows.push(columnRow)

    // 2. 横梁
    const beamCount = shelfSpec.value.levels * 2
    const beamRow = buildRowFromSpecs(specsMap, '横梁', '双C抱焊梁100', 202, 1.5)
    beamRow.length = shelfSpec.value.length
    beamRow.quantity = beamCount
    nextRows.push(beamRow)

    // 3. 横撑
    const horizontalBraceRow = buildRowFromSpecs(specsMap, '横撑', '横撑24*40', 93, 1.5)
    horizontalBraceRow.length = shelfSpec.value.depth - 56 - 56 + 40
    horizontalBraceRow.quantity = 2
    nextRows.push(horizontalBraceRow)

    // 4. 斜撑
    const diagonalCount = Math.floor(shelfSpec.value.height / 600) * 2
    const diagonalLength = Math.round(Math.sqrt(Math.pow(shelfSpec.value.depth, 2) + Math.pow(600, 2)))
    const diagonalBraceRow = buildRowFromSpecs(specsMap, '斜撑', '斜撑29*40', 103, 1.5)
    diagonalBraceRow.length = diagonalLength
    diagonalBraceRow.quantity = diagonalCount || 2
    nextRows.push(diagonalBraceRow)

    if (editMode.value) {
      draftRows.value = nextRows
    } else {
      savedRows.value = nextRows
    }

    ElMessage.success('已自动生成计算结果！请根据实际情况调整横斜撑数量。')
  }

  const clearTable = () => {
    ElMessageBox.confirm('确定要清空所有行的长度和数量吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        const target = editMode.value ? draftRows.value : savedRows.value
        target.forEach((row) => {
          row.length = undefined
          row.quantity = undefined
        })
        ElMessage.success('长度和数量已清空')
      })
      .catch(() => {})
  }

  return {
    loading,
    saving,
    errorMsg,
    editMode,
    activeSpecs,
    shelfSpec,
    displayRows,
    loadData,
    startEdit,
    cancelEdit,
    addRow,
    removeRow,
    upsertSpecPreset,
    deleteSpecOption,
    getOptionsForRow,
    handleNameChange,
    saveData,
    generateShelfMaterials,
    clearTable,
  }
}
