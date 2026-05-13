/**
 * @module composables/useQuotationHistory
 * @description 报价单历史记录管理组合式函数
 * 
 * 提供报价单/横梁载重单历史记录的完整管理能力：
 * - 分页加载（支持全量拉取后前端分页）
 * - 按公司名称分组展示
 * - 关键词搜索
 * - 创建、更新、删除操作（带乐观更新）
 * - 查看和编辑模式切换
 * 
 * 数据流：
 * 1. loadHistoryList() → 调用 API 获取全部记录
 * 2. fetchAllRecords() → 处理分页，合并所有页数据
 * 3. groupByCompany() → 按公司名分组并排序
 * 4. pagedHistoryGroups → 计算属性，对分组结果进行分页
 * 
 * @example
 * const {
 *   historyList,
 *   groupedHistoryList,
 *   pagedHistoryGroups,
 *   searchKeyword,
 *   page,
 *   pageSize,
 *   total,
 *   loading,
 *   isActionLoading,
 *   loadHistoryList,
 *   onKeywordInput,
 *   handleCurrentChange,
 *   handleSizeChange,
 *   saveQuotation,
 *   deleteHistory,
 *   viewHistory,
 *   editHistory
 * } = useQuotationHistory({
 *   api: quotationApi,
 *   loadToEditor: (record, mode) => { ... }
 * })
 */

import { computed, ref, shallowRef, type Ref, type ShallowRef, type ComputedRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { debounce } from '@/utils/debounce'
import { to } from '@/utils/async'
import { formatDateOnly } from '@/utils/date'
import { useInstantListActions } from '@/composables/useInstantListActions'
import { useListQueryState } from '@/composables/useListQueryState'

interface HistoryRecord {
  id: number | string
  companyName?: string
  name?: string
  title?: string
  createDate?: string
  createTime?: string
  createdAt?: string
  updateTime?: string
  updatedAt?: string
  [key: string]: unknown
}

interface ApiListResponse {
  quotations?: HistoryRecord[]
  records?: HistoryRecord[]
  list?: HistoryRecord[]
  items?: HistoryRecord[]
  quotation?: HistoryRecord
  record?: HistoryRecord
  pageSize?: number
  page?: number
  total?: number
  [key: string]: unknown
}

interface CompanyGroup {
  companyName: string
  count: number
  latestDate: string
  latestTime: string
  records: HistoryRecord[]
}

interface QuotationHistoryOptions {
  api: {
    list?: (params?: unknown) => Promise<unknown>
    create?: (data: unknown) => Promise<unknown>
    update?: (id: number | string, data: unknown) => Promise<unknown>
    remove?: (id: number | string) => Promise<unknown>
    [key: string]: unknown
  }
  loadToEditor: (record: HistoryRecord, mode: string) => void
}

interface QuotationHistoryReturn {
  historyList: ShallowRef<HistoryRecord[]>
  groupedHistoryList: ComputedRef<CompanyGroup[]>
  pagedHistoryGroups: ComputedRef<CompanyGroup[]>
  searchKeyword: Ref<string>
  page: Ref<number>
  pageSize: Ref<number>
  total: ComputedRef<number>
  loading: Ref<boolean>
  isActionLoading: (id: number | string) => boolean
  loadHistoryList: () => Promise<HistoryRecord[]>
  onKeywordInput: () => void
  handleCurrentChange: (val: number) => void
  handleSizeChange: (val: number) => void
  saveQuotation: (payload: Record<string, unknown>, editingId?: number | string | null) => Promise<HistoryRecord | null>
  copyQuotation: (record: HistoryRecord) => Promise<HistoryRecord | null>
  deleteHistory: (record: HistoryRecord) => Promise<void>
  viewHistory: (record: HistoryRecord) => void
  editHistory: (record: HistoryRecord) => void
}

const clone = <T>(value: T): T => (value === null || value === undefined ? value : JSON.parse(JSON.stringify(value)))

const normalizeRecord = (record: Partial<HistoryRecord> = {}): HistoryRecord => ({
  ...record,
  id: record.id ?? 0,
  companyName: record.companyName || record.name || record.title || '',
  name: record.name || record.companyName || record.title || '',
  createDate: record.createDate || formatDateOnly(record.createTime || record.createdAt || ''),
  createTime: record.createTime || record.createdAt || '',
  updateTime: record.updateTime || record.updatedAt || ''
})

const hasPaginationMeta = (result: Record<string, unknown>): boolean => Boolean(result && (
  Object.prototype.hasOwnProperty.call(result, 'total') ||
  Object.prototype.hasOwnProperty.call(result, 'page') ||
  Object.prototype.hasOwnProperty.call(result, 'pageSize')
))

const normalizeCompanyName = (record: Partial<HistoryRecord> = {}): string =>
  String(record.companyName || record.name || record.title || '未命名公司').trim() || '未命名公司'

const toDateValue = (record: Partial<HistoryRecord> = {}): number => {
  const value = record.createTime || record.updateTime || record.createDate || ''
  const date = new Date(value as string)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

const groupByCompany = (records: HistoryRecord[] = []): CompanyGroup[] => {
  const map = new Map<string, CompanyGroup>()

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    const companyName = normalizeCompanyName(record)
    let group = map.get(companyName)
    if (!group) {
      group = { companyName, count: 0, latestDate: '', latestTime: '', records: [] }
      map.set(companyName, group)
    }
    group.records.push(record)
  }

  const earliestMap = new Map<string, number>()
  const groups: CompanyGroup[] = []
  for (const group of map.values()) {
    const recordsSorted = group.records.sort((a, b) => toDateValue(b) - toDateValue(a))
    const earliest = recordsSorted[recordsSorted.length - 1]
    const earliestTime = toDateValue(earliest)
    earliestMap.set(group.companyName, earliestTime)
    groups.push({
      companyName: group.companyName,
      count: recordsSorted.length,
      latestDate: recordsSorted[0]?.createDate || '',
      latestTime: recordsSorted[0]?.createTime || recordsSorted[0]?.updateTime || '',
      records: recordsSorted
    })
  }

  groups.sort((a, b) => {
    const aTime = earliestMap.get(a.companyName) ?? 0
    const bTime = earliestMap.get(b.companyName) ?? 0
    const diff = aTime - bTime
    if (!Number.isNaN(diff) && diff !== 0) return diff
    return a.companyName.localeCompare(b.companyName, 'zh-Hans-CN')
  })

  return groups
}

const fetchAllRecords = async (api: QuotationHistoryOptions['api'], keyword = ''): Promise<HistoryRecord[]> => {
  const pageSize = 100
  const seenIds = new Set<number | string>()
  const merged: HistoryRecord[] = []
  let currentPage = 1
  let safety = 0

  while (safety < 200) {
    const result = await api.list!({ page: currentPage, pageSize, keyword: keyword.trim() }) as Record<string, unknown>
    
    const rawList = result?.quotations || result?.records || result?.list || result?.items || result || []
    const normalizedList = Array.isArray(rawList) ? (rawList as HistoryRecord[]).map(normalizeRecord) : []

    if (!normalizedList.length) break

    const uniqueBatch = normalizedList.filter((item) => {
      if (item.id === undefined || item.id === null) return true
      if (seenIds.has(item.id)) return false
      seenIds.add(item.id)
      return true
    })

    if (!uniqueBatch.length) break
    merged.push(...uniqueBatch)

    if (!hasPaginationMeta(result)) break

    const serverPageSize = Number(result?.pageSize ?? pageSize)
    const serverPage = Number(result?.page ?? currentPage)
    const serverTotal = Number(result?.total ?? merged.length)

    if (!Number.isFinite(serverPageSize) || normalizedList.length < serverPageSize) break
    if (Number.isFinite(serverTotal) && merged.length >= serverTotal) break

    currentPage = serverPage + 1
    safety += 1
  }

  return merged
}

export function useQuotationHistory({ api, loadToEditor }: QuotationHistoryOptions): QuotationHistoryReturn {
  const historyList = shallowRef<HistoryRecord[]>([])

  const groupedHistoryList = computed(() => groupByCompany(historyList.value))

  const { isActionLoading, withActionLock, removeById } = useInstantListActions(historyList)

  const { page, pageSize, keyword: searchKeyword, resetToFirstPage } = useListQueryState({ page: 1, pageSize: 10, keyword: '' })

  const loading = ref(false)

  const total = computed(() => groupedHistoryList.value.length)

  const pagedHistoryGroups = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return groupedHistoryList.value.slice(start, start + pageSize.value)
  })

  const loadHistoryList = async (): Promise<HistoryRecord[]> => {
    loading.value = true
    
    const [err, records] = await to(fetchAllRecords(api, searchKeyword.value))
    if (err) {
      loading.value = false
      throw err
    }

    historyList.value = records as HistoryRecord[]

    const maxPage = Math.max(1, Math.ceil(groupedHistoryList.value.length / pageSize.value) || 1)
    if (page.value > maxPage) page.value = maxPage
    if (page.value < 1) page.value = 1

    loading.value = false
    return historyList.value
  }

  /** 防抖搜索触发器（300ms） */
  const triggerSearch = debounce(async () => {
    resetToFirstPage()
    const [searchErr] = await to(loadHistoryList())
    if (searchErr) ElMessage.error((searchErr as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (searchErr as { message?: string })?.message || '历史记录加载失败')
  }, 300)

  /** 搜索输入事件处理 */
  const onKeywordInput = () => triggerSearch()

  /** 页码变化处理 */
  const handleCurrentChange = (val: number): void => { page.value = Number(val || 1) }

  const handleSizeChange = async (val: number): Promise<void> => {
    pageSize.value = Number(val || 5)
    resetToFirstPage()
    const [sizeErr] = await to(loadHistoryList())
    if (sizeErr) ElMessage.error((sizeErr as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (sizeErr as { message?: string })?.message || '历史记录加载失败')
  }

  const saveQuotation = async (payload: Record<string, unknown>, editingId?: number | string | null): Promise<HistoryRecord | null> => {
    const body = clone(payload)

    if (editingId) {
      const result = await withActionLock(editingId, async () => api.update!(editingId, body)) as Record<string, unknown> | null | undefined
      if (!result) return null
      const record = normalizeRecord((result?.quotation || result?.record || result) as Partial<HistoryRecord>)
      const index = historyList.value.findIndex(item => item.id === record.id)
      if (index !== -1) historyList.value[index] = record
      else await loadHistoryList()
      return record
    }

    const result = await api.create!(body) as Record<string, unknown> | null | undefined
    const record = normalizeRecord((result?.quotation || result?.record || result) as Partial<HistoryRecord>)
    if (record) historyList.value.unshift(record)
    else await loadHistoryList()
    return record
  }

  const deleteHistory = async (record: HistoryRecord): Promise<void> => {
    const [confirmErr] = await to(ElMessageBox.confirm(
      `确定要删除公司「${record.companyName || record.name || '-'}」的这条报价单吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ))
    if (confirmErr) return

    const snapshot = [...historyList.value]
    removeById(record.id)

    const [err] = await to(withActionLock(record.id, async () => api.remove!(record.id)))
    if (err) {
      historyList.value = snapshot
      ElMessage.error((err as { message?: string; response?: { data?: { message?: string } } })?.message || (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '删除失败')
      return
    }

    await loadHistoryList()
    ElMessage.success('删除成功')
  }

  const viewHistory = (record: HistoryRecord): void => loadToEditor(record, 'view')

  const editHistory = (record: HistoryRecord): void => loadToEditor(record, 'edit')

  const copyQuotation = async (record: HistoryRecord): Promise<HistoryRecord | null> => {
    const [confirmErr] = await to(ElMessageBox.confirm(
      `确定要复制「${record.name || record.companyName || '-'}」这条报价单吗？\n复制后名称将自动添加「-副本」后缀`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    ))
    if (confirmErr) return null

    const copyFn = (api as Record<string, unknown>).copy as ((id: number | string) => Promise<ApiListResponse>) | undefined
    const result = copyFn ? await copyFn(record.id) : undefined
    const newRecord = normalizeRecord(result?.quotation || result?.record || result as HistoryRecord)

    if (newRecord) {
      await loadHistoryList()
      ElMessage.success(`复制成功，新名称：「${newRecord.name || newRecord.companyName || '-'}」`)
    }

    return newRecord
  }

  return {
    historyList,
    groupedHistoryList,
    pagedHistoryGroups,
    searchKeyword,
    page,
    pageSize,
    total,
    loading,
    isActionLoading,
    loadHistoryList,
    onKeywordInput,
    handleCurrentChange,
    handleSizeChange,
    saveQuotation,
    deleteHistory,
    copyQuotation,
    viewHistory,
    editHistory
  }
}
