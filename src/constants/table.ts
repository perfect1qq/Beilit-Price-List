export const TABLE_HEADER_STYLE = {
  background: '#f8fafc',
  color: '#475569',
  fontWeight: 'bold',
  textAlign: 'center' as const
}

/** 默认分页大小，前后端保持一致 */
export const DEFAULT_PAGE_SIZE = 20

/** "拉取全量" 场景的分页大小，用于前端做客户端分组/过滤的列表（与后端 LIST_ALL_PAGE_SIZE 对齐） */
export const LIST_ALL_PAGE_SIZE = 1000

export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  pageSizes: [10, 20, 50, 100]
}
