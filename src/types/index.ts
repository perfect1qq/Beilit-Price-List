export interface UserInfo {
  id: number
  username: string
  name: string
  role: 'admin' | 'user' | 'guest'
  avatar?: string
  createdAt?: string
  _editingName?: boolean
  _editNameValue?: string
}

export interface GuestUser {
  role: 'guest'
}

export interface SessionPayload {
  user?: UserInfo | null
  permissions?: string[]
  menu?: Record<string, unknown>[]
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
  [key: string]: unknown
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
  [key: string]: unknown
}

export interface QuotationData {
  id?: number
  companyName: string
  items?: QuotationItem[]
  discount?: number
  finalPrice?: number
  status?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface BeamQuotationData {
  id?: number
  name?: string
  recordName?: string
  editingItems?: Record<string, unknown>[]
  items?: Record<string, unknown>[]
  [key: string]: unknown
}

export interface ApprovalData {
  id: number
  quotationId?: number
  status: string
  comment?: string
  createdAt?: string
  [key: string]: unknown
}

export interface CustomerData {
  id?: number
  companyName: string
  customerName?: string
  contactInfo?: string
  cooperationStatus?: string
  customerType?: string
  deliveryDays?: number | null
  remark?: string
  ownerName?: string
  createdAt?: string
  updatedAt?: string
  followUps?: FollowUpData[]
  [key: string]: unknown
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
  [key: string]: unknown
}

export interface MessageData {
  id?: number
  contactInfo?: string
  content?: string
  remark?: string
  status?: string
  assignedTo?: number
  assignee?: { name?: string; username?: string }
  createdAt?: string
  [key: string]: unknown
}

export interface NotificationData {
  id: number
  type?: string
  content?: string
  read?: boolean
  createdAt?: string
}

export interface MediumShelfWeightData {
  [key: string]: unknown
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
  [key: string]: unknown
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
  [key: string]: unknown
}

export type AsyncResult<T = unknown> = [Error | null, T | null]

export interface MemoStatsData {
  total: number
  todoTotal: number
  doneTotal: number
  pinnedTotal: number
  [key: string]: unknown
}

export interface MemoScopeStatData {
  mode?: string
  totalLabel?: string
  totalTip?: string
  todoTip?: string
  doneTip?: string
  pinnedTip?: string
  [key: string]: unknown
}

export interface MemoHistoryItem {
  id?: number
  action?: string
  operatorName?: string
  content?: string
  createdAt?: string
  [key: string]: unknown
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
  __retryCount?: number
  signal?: AbortSignal
  params?: Record<string, unknown>
  url?: string
  method?: string
  data?: unknown
}