import { computed, h } from 'vue'
import { ElButton, ElTag } from 'element-plus'
import type { MessageData } from '@/types'
import { formatDateTime } from '@/utils/date'
import { usePermissions } from '@/composables/usePermissions'

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

interface ColumnActions {
  openView: (row: MessageData) => void
  openAssign: (row: MessageData) => void
  doDelete: (row: MessageData) => void
  doHideFromList: (row: MessageData) => void
  isActionLoading: (id: number | string) => boolean
  statusText: (row: MessageData) => string
  statusType: (row: MessageData) => TagType
}

export function useMessageColumns(actions: ColumnActions) {
  const { isAdmin } = usePermissions()

  const virtualColumns = computed(() => {
    const baseColumns = [
      {
        key: 'createdAt',
        dataKey: 'createdAt',
        title: '提交时间',
        width: 170,
        align: 'center',
        cellRenderer: ({ rowData }: { rowData: MessageData }) => formatDateTime(rowData?.createdAt || '')
      },
      {
        key: 'contactInfo',
        dataKey: 'contactInfo',
        title: '联系方式',
        width: 230
      },
      {
        key: 'content',
        dataKey: 'content',
        title: '留言内容',
        width: 380
      },
      {
        key: 'status',
        dataKey: 'status',
        title: '状态',
        width: 150,
        align: 'center',
        cellRenderer: ({ rowData }: { rowData: MessageData }) => {
          const tags = [
            h(
              ElTag,
              { size: 'small', type: actions.statusType(rowData) },
              () => actions.statusText(rowData)
            )
          ]
          if (isAdmin.value && rowData?.hiddenByAssignee) {
            tags.push(h(ElTag, { size: 'small', type: 'info', class: 'status-extra' }, () => '已隐藏'))
          }
          return h('div', { class: 'status-cell' }, tags)
        }
      },
      {
        key: 'assignee',
        dataKey: 'assignee',
        title: '跟进人',
        width: 130,
        align: 'center',
        cellRenderer: ({ rowData }: { rowData: MessageData }) => ((rowData?.assignee?.name || '').trim() || rowData?.assignee?.username) || '—'
      }
    ]

    baseColumns.push({
      key: 'actions',
      dataKey: 'actions',
      title: '操作',
      width: isAdmin.value ? 260 : 200,
      align: 'center',
      cellRenderer: ({ rowData }: { rowData: MessageData }) =>
        h('div', { class: 'virtual-actions' }, [
          h(
            ElButton,
            {
              type: 'primary',
              link: true,
              size: 'small',
              onClick: () => actions.openView(rowData)
            },
            () => '查看'
          ),
          ...(isAdmin.value
            ? [
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  loading: actions.isActionLoading(rowData?.id),
                  onClick: () => actions.openAssign(rowData)
                },
                () => '指派'
              ),
              h(
                ElButton,
                {
                  type: 'danger',
                  link: true,
                  size: 'small',
                  loading: actions.isActionLoading(rowData?.id),
                  onClick: () => actions.doDelete(rowData)
                },
                () => '删除'
              )
            ]
            : [
              h(
                ElButton,
                {
                  type: 'danger',
                  link: true,
                  size: 'small',
                  loading: actions.isActionLoading(rowData?.id),
                  onClick: () => actions.doHideFromList(rowData)
                },
                () => '删除'
              )
            ])
        ])
    })

    return baseColumns
  })

  return { virtualColumns }
}
