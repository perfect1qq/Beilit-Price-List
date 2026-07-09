export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const

export const QUOTATION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELETED: 'deleted',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]
export type QuotationStatus = typeof QUOTATION_STATUS[keyof typeof QUOTATION_STATUS]

export interface UserInfo {
  id: number
  username: string
  name: string
  role: UserRole
  avatar?: string
  createdAt?: string
}

export interface EditableUserInfo extends UserInfo {
  _editingName?: boolean
  _editNameValue?: string
}

export interface MenuItem {
  name: string
  path: string
  icon?: string
  children?: MenuItem[]
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

export interface PaginatedResult<T = unknown> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  code?: string
}

export interface PartItem {
  name: string
  spec?: string
  qty?: number | string
  unit?: string
  [key: string]: unknown
}

export interface QuotationItem {
  name: string
  spec?: string
  unit?: string
  quantity?: number | string
  price?: number | string
  amount?: number | string
  unitPrice?: number | string
  totalPrice?: number | string
  category?: string
  remark?: string
}

export interface QuotationData {
  id: number
  quotationNo: string
  name: string
  companyName: string
  ownerId: number
  ownerName: string
  status: QuotationStatus
  items: QuotationItem[]
  remark: string
  discount: number
  subtotal: number
  autoFinalPrice: number
  finalPrice: number
  isManual: boolean
  reviewComment: string
  rejectReason: string
  createDate: string
  submittedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  recalledAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface QuotationCreatePayload {
  name: string
  companyName: string
  items?: QuotationItem[]
  discount?: number
  finalPrice?: number
  isManual?: boolean
  status?: QuotationStatus
  remark?: string
}

export type QuotationListResult = PaginatedResult<QuotationData>

export interface QuotationLogData {
  id: number
  quotationId: number
  action: string
  comment: string | null
  operatorId: number
  operatorName: string
  createdAt: string
}

export interface BeamQuotationItem {
  name: string
  length: string
  spec: string
  maxLoad: string
}

export interface BeamQuotationData {
  id: number
  name: string
  items: BeamQuotationItem[] | string
  ownerId: number
  ownerName: string
  createdAt: string
  updatedAt: string
}

export interface CustomerCreatePayload {
  companyName: string
  customerName: string
  contactInfo?: string
  cooperationStatus?: string
  customerType?: string
  deliveryDays?: number | null
  shelfType?: string
  remark?: string
  paymentStatus?: string
  orderStatus?: string
}

export interface CustomerUpdatePayload {
  companyName?: string
  customerName?: string
  contactInfo?: string
  cooperationStatus?: string
  customerType?: string
  deliveryDays?: number | null
  shelfType?: string
  remark?: string
  paymentStatus?: string
}

export interface CustomerData {
  id: number
  companyName: string
  customerName: string
  contactInfo: string
  ownerId: number
  ownerName: string
  remark: string
  cooperationStatus: string
  customerType: string
  deliveryDays: number | null
  deliveryStartDate: string | null
  shelfType: string
  paymentStatus: string
  orderStatus: string
  createdAt: string
  updatedAt: string
}

export interface CustomerListItem extends CustomerData {
  hasQuotation: boolean
  quotationDate: string | null
  quotationStatus: QuotationStatus | null
  quotationId: number | null
  followUpCount: number
  latestFollowUp: FollowUpData | null
}

export type CustomerListResult = PaginatedResult<CustomerListItem>

export interface CustomerDetailData extends CustomerData {
  followUps: FollowUpData[]
}

export interface FollowUpCreatePayload {
  content: string
  nextTime?: string
}

export interface FollowUpData {
  id: number
  customerId: number
  content: string
  followType: string | null
  nextTime: string | null
  operatorId: number
  operatorName: string
  createdAt: string
}

export interface MemoCreatePayload {
  title: string
  content: string
  label?: string
  color?: string
  pinned?: boolean
  completed?: boolean
  remindAt?: string | null
}

export interface MemoUpdatePayload extends Partial<MemoCreatePayload> {}

export interface MemoData {
  id: number
  title: string
  content: string
  label: string
  color: string
  pinned: boolean
  completed: boolean
  completedAt: string | null
  ownerId: number
  ownerName: string
  isDeleted: boolean
  remindAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MemoListResult extends PaginatedResult<MemoData> {
  todoTotal: number
  doneTotal: number
  pinnedTotal: number
}

export interface MemoHistoryItem {
  id: number
  memoId: number
  action: string
  title: string
  content: string
  operatorId: number
  operatorName: string
  createdAt: string
}

export type MemoHistoryListResult = PaginatedResult<MemoHistoryItem>

export interface NotificationData {
  id: number
  type: string
  content: string
  relatedId: number
  read: boolean
  createdAt: string
}

export interface MediumShelfWeightData {
  id: number
  key: string
  title: string
  config: Record<string, unknown>
  payload: {
    summaryRows?: Record<string, unknown>[]
    detailRows?: Record<string, unknown>[]
  }
  createdAt: string
  updatedAt: string
}

export interface MediumShelfWeightSavePayload {
  title: string
  payload: {
    summaryRows?: Record<string, unknown>[]
    detailRows?: Record<string, unknown>[]
  }
}

export interface NotepadCreatePayload {
  title?: string
  content?: string
  folder?: string
  pinned?: boolean
}

export interface NotepadUpdatePayload extends Partial<NotepadCreatePayload> {}

export interface NotepadData {
  id: number
  title: string
  content: string
  folder: string
  pinned: boolean
  ownerId: number
  ownerName: string
  createdAt: string
  updatedAt: string
}

export type NotepadListResult = PaginatedResult<NotepadData>

export interface NotepadHistoryData {
  id: number
  notepadId: number
  action: string
  title: string
  content: string
  operatorId: number
  operatorName: string
  createdAt: string
}

export type NotepadHistoryListResult = PaginatedResult<NotepadHistoryData>

export interface ApprovalListParams extends PaginationParams {
  status?: QuotationStatus | QuotationStatus[]
}

export type ApprovalListResult = PaginatedResult<QuotationData>

export interface ApprovalDetailData {
  approval: QuotationData
  logs: QuotationLogData[]
}

export interface GuestUser {
  role: 'guest'
}

export interface SessionPayload {
  user: UserInfo
  menu: MenuItem[]
  permissions: string[]
}

export interface MemoStatsData {
  total: number
  todoTotal: number
  doneTotal: number
  pinnedTotal: number
}

export type AsyncResult<T = unknown> = [Error | null, T | null]

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

export interface ApiError {
  status: number
  code: string
  message: string
  details?: unknown
  requestId?: string
}
