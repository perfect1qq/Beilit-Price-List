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
import type { QuotationData, QuotationCreatePayload, QuotationListResult, PaginationParams } from '@/types'

type HistoryRecord = QuotationData

export type { HistoryRecord }

interface CompanyGroup {
  companyName: string
  count: number
  latestDate: string
  latestTime: string
  records: HistoryRecord[]
}

interface YearGroup {
  year: number
  count: number
  latestDate: string
  companyGroups: CompanyGroup[]
}

interface QuotationHistoryApi {
  list: (params?: PaginationParams) => Promise<QuotationListResult>
  create: (data: QuotationCreatePayload) => Promise<{ quotation: QuotationData }>
  update: (id: number | string, data: QuotationCreatePayload) => Promise<{ quotation: QuotationData }>
  remove: (id: number | string) => Promise<null>
  copy?: (id: number | string) => Promise<{ quotation: QuotationData }>
  moveYear?: (id: number | string, targetYear: number) => Promise<{ quotation: QuotationData }>
  [key: string]: unknown
}

interface QuotationHistoryOptions {
  api: QuotationHistoryApi
  loadToEditor: (record: HistoryRecord, mode: string) => void
}

interface QuotationHistoryReturn {
  historyList: ShallowRef<HistoryRecord[]>
  groupedHistoryList: ComputedRef<YearGroup[]>
  searchKeyword: Ref<string>
  loading: Ref<boolean>
  DEFAULT_PAGE_SIZE: number
  yearPages: Ref<Record<number, number>>
  getYearPage: (year: number) => number
  setYearPage: (year: number, page: number) => void
  getPagedCompanies: (yearGroup: { year: number; companyGroups: CompanyGroup[] }, pageSize?: number) => CompanyGroup[]
  getYearTotalPages: (companyCount: number, pageSize?: number) => number
  handleYearPageChange: (year: number, page: number) => void
  isActionLoading: (id: number | string) => boolean
  loadHistoryList: () => Promise<HistoryRecord[]>
  onKeywordInput: () => void
  saveQuotation: (payload: QuotationCreatePayload, editingId?: number | string | null) => Promise<HistoryRecord | null>
  deleteHistory: (record: HistoryRecord) => Promise<void>
  viewHistory: (record: HistoryRecord) => void
  editHistory: (record: HistoryRecord) => void
  addCustomYear: (year: number) => void
  removeCustomYear: (year: number) => void
  customYears: Ref<number[]>
  moveToYear: (record: HistoryRecord, targetYear: number) => Promise<boolean>
}

const clone = <T>(value: T): T => (value === null || value === undefined ? value : JSON.parse(JSON.stringify(value)))

const hasPaginationMeta = (result: QuotationListResult): boolean => Boolean(result && (
  Object.prototype.hasOwnProperty.call(result, 'total') ||
  Object.prototype.hasOwnProperty.call(result, 'page') ||
  Object.prototype.hasOwnProperty.call(result, 'pageSize')
))

const normalizeCompanyName = (record: Partial<QuotationData> = {}): string =>
  String(record.companyName || record.name || '未命名公司').trim() || '未命名公司'

const toDateValue = (record: Partial<QuotationData> = {}): number => {
  const value = record.createdAt || record.updatedAt || ''
  const date = new Date(value)
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

  const groups: CompanyGroup[] = []
  for (const group of map.values()) {
    const recordsSorted = group.records.sort((a, b) => toDateValue(b) - toDateValue(a))
    groups.push({
      companyName: group.companyName,
      count: recordsSorted.length,
      latestDate: formatDateOnly(recordsSorted[0]?.createdAt || ''),
      latestTime: recordsSorted[0]?.createdAt || recordsSorted[0]?.updatedAt || '',
      records: recordsSorted
    })
  }

  groups.sort((a, b) => {
    return a.companyName.localeCompare(b.companyName, 'zh-Hans-CN')
  })

  return groups
}

/** 按年份分组，每组内再按公司分组 */
const groupByYearAndCompany = (records: HistoryRecord[] = []): YearGroup[] => {
  const yearMap = new Map<number, HistoryRecord[]>()

  for (const record of records) {
    const date = new Date(record.createdAt || record.updatedAt || '')
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear()
      if (!yearMap.has(year)) yearMap.set(year, [])
      yearMap.get(year)!.push(record)
    }
  }

  const yearGroups: YearGroup[] = []

  for (const [year, yearRecords] of yearMap) {
    const companyGroups = groupByCompany(yearRecords)
    const totalRecords = companyGroups.reduce((sum, g) => sum + g.count, 0)
    // 取所有公司中最新的一条记录的日期作为该年最新日期
    let latestDate = ''
    for (const cg of companyGroups) {
      if (!latestDate || cg.latestTime > latestDate) {
        latestDate = cg.latestDate
      }
    }

    yearGroups.push({
      year,
      count: totalRecords,
      latestDate,
      companyGroups,
    })
  }

  // 按年份倒序排列（最新的在前）
  yearGroups.sort((a, b) => b.year - a.year)

  return yearGroups
}

const fetchAllRecords = async (api: QuotationHistoryOptions['api'], keyword = ''): Promise<HistoryRecord[]> => {
  const pageSize = 100
  const seenIds = new Set<number | string>()
  const merged: HistoryRecord[] = []
  let currentPage = 1
  let safety = 0

  while (safety < 200) {
    const result = await api.list({ page: currentPage, pageSize, keyword: keyword.trim() })
    
    const rawList = result?.list || []
    if (!rawList.length) break

    const uniqueBatch = rawList.filter((item) => {
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

    if (!Number.isFinite(serverPageSize) || rawList.length < serverPageSize) break
    if (Number.isFinite(serverTotal) && merged.length >= serverTotal) break

    currentPage = serverPage + 1
    safety += 1
  }

  return merged
}

export function useQuotationHistory({ api, loadToEditor }: QuotationHistoryOptions): QuotationHistoryReturn {
  const historyList = shallowRef<HistoryRecord[]>([])

  // 自定义年份持久化到 localStorage
  const CUSTOM_YEARS_KEY = 'quotation_custom_years'
  const savedCustomYears = (() => { try { return JSON.parse(localStorage.getItem(CUSTOM_YEARS_KEY) || '[]') } catch { return [] } })()
  const customYears = ref<number[]>(savedCustomYears)

  const saveCustomYears = () => {
    localStorage.setItem(CUSTOM_YEARS_KEY, JSON.stringify(customYears.value))
  }

  const groupedHistoryList = computed(() => {
    const groups = groupByYearAndCompany(historyList.value)
    for (const year of customYears.value) {
      if (!groups.some(g => g.year === year)) {
        groups.push({ year, count: 0, latestDate: '', companyGroups: [] })
      }
    }
    groups.sort((a, b) => b.year - a.year)
    return groups
  })

  const { isActionLoading, withActionLock, removeById } = useInstantListActions(historyList)

  const { keyword: searchKeyword, resetToFirstPage } = useListQueryState({ page: 1, pageSize: 15, keyword: '' })

  /** 默认每页公司组数量 */
  const DEFAULT_PAGE_SIZE = 15

  /** 每个年份的分页状态：year -> currentPage */
  const yearPages = ref<Record<number, number>>({})

  /** 获取某年份的当前页 */
  const getYearPage = (year: number): number => yearPages.value[year] || 1

  /** 设置某年份的页码 */
  const setYearPage = (year: number, page: number): void => {
    yearPages.value = { ...yearPages.value, [year]: page }
  }

  /** 获取某年份分页后的公司组 */
  const getPagedCompanies = (yearGroup: { year: number; companyGroups: CompanyGroup[] }, pageSize = DEFAULT_PAGE_SIZE) => {
    const page = getYearPage(yearGroup.year)
    const start = (page - 1) * pageSize
    return yearGroup.companyGroups.slice(start, start + pageSize)
  }

  /** 获取某年份的总页数 */
  const getYearTotalPages = (companyCount: number, pageSize = DEFAULT_PAGE_SIZE): number => {
    return Math.max(1, Math.ceil(companyCount / pageSize))
  }

  const loading = ref(false)

  const loadHistoryList = async (): Promise<HistoryRecord[]> => {
    loading.value = true
    
    const [err, records] = await to(fetchAllRecords(api, searchKeyword.value))
    if (err) {
      loading.value = false
      throw err
    }

    historyList.value = records ?? []

    // 重置所有年份分页到第1页
    yearPages.value = {}

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

  /** 年份内页码变化处理 */
  const handleYearPageChange = (year: number, page: number): void => {
    setYearPage(year, page)
  }

  const saveQuotation = async (payload: QuotationCreatePayload, editingId?: number | string | null): Promise<HistoryRecord | null> => {
    const body = clone(payload)

    if (editingId) {
      const result = await withActionLock(editingId, async () => api.update(editingId, body))
      if (!result) return null
      const record = result.quotation
      const index = historyList.value.findIndex(item => item.id === record.id)
      if (index !== -1) historyList.value[index] = record
      else await loadHistoryList()
      return record
    }

    const result = await api.create(body)
    const record = result.quotation
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

    const [err] = await to(withActionLock(record.id, async () => api.remove(record.id)))
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

  const addCustomYear = (year: number): void => {
    if (!customYears.value.includes(year)) {
      customYears.value.push(year)
      saveCustomYears()
    }
  }

  const removeCustomYear = (year: number): void => {
    customYears.value = customYears.value.filter(y => y !== year)
    saveCustomYears()
  }

  /** 将报价单移动到目标年份 */
  const moveToYear = async (record: HistoryRecord, targetYear: number): Promise<boolean> => {
    const [err, result] = await to(api.moveYear!(record.id, targetYear))

    if (err || !result) {
      ElMessage.error((err as { message?: string })?.message || '移动失败')
      return false
    }

    // 刷新列表
    await loadHistoryList()
    ElMessage.success(`已将报价单移动到 ${targetYear} 年`)
    return true
  }

  return {
    historyList,
    groupedHistoryList,
    searchKeyword,
    loading,
    DEFAULT_PAGE_SIZE,
    yearPages,
    getYearPage,
    setYearPage,
    getPagedCompanies,
    getYearTotalPages,
    handleYearPageChange,
    isActionLoading,
    loadHistoryList,
    onKeywordInput,
    saveQuotation,
    deleteHistory,
    viewHistory,
    editHistory,
    addCustomYear,
    removeCustomYear,
    customYears,
    moveToYear
  }
}
