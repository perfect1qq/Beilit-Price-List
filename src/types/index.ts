export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export interface UserInfo {
  id: number
  username: string
  name: string
  role: UserRole
  avatar?: string
  createdAt?: string
  _editingName?: boolean
  _editNameValue?: string
}

export interface MenuItem {
  name: string
  path: string
  icon?: string
  children?: MenuItem[]
}

export interface GuestUser {
  role: 'guest'
}

export interface SessionPayload {
  user?: UserInfo | null
  permissions?: string[]
  menu?: MenuItem[]
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  name?: string
  inviteCode?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  code?: string
}

export interface QuotationItem {
  id?: number
  name: string
  specification?: string
  quantity?: string | number
  unitPrice?: string | number
  totalPrice?: string | number
}

export interface QuotationData {
  id?: number
  name?: string
  companyName: string
  items?: QuotationItem[]
  discount?: number
  finalPrice?: number
  isManual?: boolean
  status?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface BeamQuotationItem {
  name: string
  length: string
  spec: string
  maxLoad: string
}

export interface BeamQuotationData {
  id?: number
  name?: string
  recordName?: string
  editingItems?: BeamQuotationItem[]
  items?: BeamQuotationItem[]
}

export interface ApprovalData {
  id: number
  quotationId?: number
  status: string
  comment?: string
  createdAt?: string
}

export interface CustomerData {
  id?: number
  companyName: string
  customerName?: string
  contactInfo?: string
  cooperationStatus?: string
  customerType?: string
  deliveryDays?: number | null
  shelfType?: string
  remark?: string
  ownerName?: string
  createdAt?: string
  updatedAt?: string
  followUps?: FollowUpData[]
}

export interface FollowUpData {
  id?: number
  customerId: number
  content: string
  followType?: string
  nextTime?: string
  operatorId?: number
  operatorName?: string
  createdAt?: string
}

export interface MemoData {
  id?: number
  title: string
  content?: string
  label?: string
  color?: string
  pinned?: boolean
  completed?: boolean
  remindAt?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface MessageData {
  id?: number | string
  contactInfo?: string
  content?: string
  remark?: string
  status?: string
  assignedTo?: number | string | null
  hiddenByAssignee?: boolean
  assignee?: { id?: number | string; name?: string; username?: string } | null
  createdAt?: string
  updatedAt?: string
}

export interface NotificationData {
  id: number
  type?: string
  content?: string
  read?: boolean
  createdAt?: string
}

export interface MediumShelfWeightData {
  title?: string
  payload?: {
    summaryRows?: unknown[]
    detailRows?: unknown[]
  }
  summaryRows?: unknown[]
  detailRows?: unknown[]
}

export interface NotepadData {
  id?: number
  title?: string
  content?: string
  folder?: string
  pinned?: boolean
  ownerId?: number
  ownerName?: string
  createdAt?: string
  updatedAt?: string
}

export interface NotepadHistoryData {
  id?: number
  notepadId?: number
  action?: string
  title?: string
  content?: string
  operatorId?: number
  operatorName?: string
  createdAt?: string
}

export type AsyncResult<T = unknown> = [Error | null, T | null]

export interface MemoStatsData {
  total: number
  todoTotal: number
  doneTotal: number
  pinnedTotal: number
}

export interface MemoScopeStatData {
  mode?: string
  totalLabel?: string
  totalTip?: string
  todoTip?: string
  doneTip?: string
  pinnedTip?: string
}

export interface MemoHistoryItem {
  id?: number
  action?: string
  operatorName?: string
  content?: string
  createdAt?: string
}

export interface FormRules {
  [key: string]: unknown
}

export type RequestConfig = Record<string, unknown> & {
  authRedirect?: boolean
  skipCancel?: boolean
  silent?: boolean
  disableCacheBust?: boolean
  _isRefreshRequest?: boolean
  _retryAfterRefresh?: boolean
  __retryCount?: number
  signal?: AbortSignal
  params?: Record<string, unknown>
  url?: string
  method?: string
  data?: unknown
}
