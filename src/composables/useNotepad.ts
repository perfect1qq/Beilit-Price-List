import { computed, ref, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessageBox } from 'element-plus'
import notepadApi from '@/api/notepad'
import { to } from '@/utils/async'
import { showError, showSuccess } from '@/utils/message'
import type { NotepadData, NotepadHistoryData } from '@/types'

export const useNotepad = () => {
  const keyword = ref('')
  const activeFolder = ref('')
  const folderExpanded = ref(true)
  const folders = ref<string[]>(['默认'])
  const noteList = shallowRef<NotepadData[]>([])
  const total = ref(0)
  const selectedId = ref<number | null>(null)
  const currentNote = ref<NotepadData | null>(null)

  const editTitle = ref('')
  const editContent = ref('')
  const editFolder = ref('默认')
  const newFolderName = ref('')
  const savingStatus = ref('')

  const historyVisible = ref(false)
  const historyList = shallowRef<NotepadHistoryData[]>([])

  const folderCountMap = ref<Record<string, number>>({})

  const batchMode = ref(false)
  const checkedIds = ref<Set<number>>(new Set())

  const isAllChecked = computed(() => noteList.value.length > 0 && checkedIds.value.size === noteList.value.length)
  const isIndeterminate = computed(() => checkedIds.value.size > 0 && checkedIds.value.size < noteList.value.length)

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const getFolderCount = (folder: string): number => folderCountMap.value[folder] || 0

  const getPreview = (content?: string): string => {
    if (!content) return ''
    return content.slice(0, 80).replace(/\n/g, ' ')
  }

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  const loadFolders = async () => {
    const [err, res] = await to(notepadApi.listFolders())
    if (err) return
    const list: string[] = res?.folders || []
    if (!list.includes('默认')) list.unshift('默认')
    folders.value = list
  }

  const loadNotes = async () => {
    const params: Record<string, unknown> = { page: 1, pageSize: 100 }
    if (keyword.value) params.keyword = keyword.value
    if (activeFolder.value) params.folder = activeFolder.value

    const [err, res] = await to(notepadApi.list(params))
    if (err) return
    noteList.value = res?.list || []
    total.value = res?.total || 0

    const countMap: Record<string, number> = {}
    for (const note of noteList.value) {
      const f = note.folder || '默认'
      countMap[f] = (countMap[f] || 0) + 1
    }
    folderCountMap.value = countMap
  }

  const onKeywordChange = () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { loadNotes() }, 300)
  }

  const selectFolder = (folder: string) => {
    activeFolder.value = activeFolder.value === folder ? '' : folder
    loadNotes()
  }

  const selectNote = (note: NotepadData) => {
    selectedId.value = note.id!
    currentNote.value = { ...note }
    editTitle.value = note.title || ''
    editContent.value = note.content || ''
    editFolder.value = note.folder || '默认'
  }

  const onNoteItemClick = (note: NotepadData) => {
    if (batchMode.value) {
      toggleCheck(note.id!, !checkedIds.value.has(note.id!))
    } else {
      selectNote(note)
    }
  }

  const toggleBatchMode = () => {
    batchMode.value = !batchMode.value
    checkedIds.value = new Set()
  }

  const toggleCheck = (id: number, checked: boolean) => {
    const s = new Set(checkedIds.value)
    if (checked) s.add(id); else s.delete(id)
    checkedIds.value = s
  }

  const toggleSelectAll = () => {
    if (isAllChecked.value) {
      checkedIds.value = new Set()
    } else {
      checkedIds.value = new Set(noteList.value.map((n) => n.id!).filter((id): id is number => id != null))
    }
  }

  const batchDeleteNotes = async () => {
    if (!checkedIds.value.size) return
    try {
      await ElMessageBox.confirm(`确定删除选中的 ${checkedIds.value.size} 篇笔记？`, '批量删除', { type: 'warning' })
    } catch { return }
    const [err, res] = await to(notepadApi.batchDelete([...checkedIds.value]))
    if (err) { showError(err, '批量删除失败'); return }
    showSuccess(`成功删除${res?.deletedCount || 0}篇笔记`)
    checkedIds.value = new Set()
    batchMode.value = false
    if (selectedId.value && !noteList.value.find((n) => n.id === selectedId.value)) {
      selectedId.value = null
      currentNote.value = null
      editTitle.value = ''
      editContent.value = ''
    }
    await loadNotes()
  }

  const createNote = async () => {
    const [err, res] = await to(notepadApi.create({
      title: '',
      content: '',
      folder: activeFolder.value || '默认'
    }))
    if (err) { showError(err, '创建失败'); return }
    const note: NotepadData | null = res?.note ?? null
    showSuccess('创建成功')
    await loadNotes()
    if (note) selectNote(note)
  }

  const isDirty = (): boolean => {
    if (!currentNote.value) return false
    return editTitle.value !== (currentNote.value.title || '') ||
      editContent.value !== (currentNote.value.content || '') ||
      editFolder.value !== (currentNote.value.folder || '默认')
  }

  const doSave = async () => {
    if (!currentNote.value || !selectedId.value || !isDirty()) return

    savingStatus.value = '保存中...'
    const folder = editFolder.value === '__new__' ? '默认' : editFolder.value
    const [err, res] = await to(notepadApi.update(selectedId.value, {
      title: editTitle.value,
      content: editContent.value,
      folder
    }))
    if (err) { savingStatus.value = '保存失败'; return }
    const updated: NotepadData | null = res?.note ?? null
    if (!updated) { savingStatus.value = '保存失败'; return }
    currentNote.value = { ...updated }
    const idx = noteList.value.findIndex((n) => n.id === selectedId.value)
    if (idx !== -1) {
      const newList = [...noteList.value]
      newList[idx] = { ...updated }
      noteList.value = newList
    }
    savingStatus.value = '已保存'
    setTimeout(() => { savingStatus.value = '' }, 1500)
  }

  const doAutoSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { doSave() }, 800)
  }

  const onFolderChange = () => {
    if (editFolder.value !== '__new__') {
      doAutoSave()
    }
  }

  const confirmNewFolder = async () => {
    const name = newFolderName.value.trim()
    if (!name) { editFolder.value = '默认'; return }
    if (!folders.value.includes(name)) {
      folders.value.push(name)
    }
    editFolder.value = name
    newFolderName.value = ''
    doAutoSave()
  }

  const togglePinNote = async () => {
    if (!selectedId.value) return
    const [err, res] = await to(notepadApi.togglePin(selectedId.value))
    if (err) { showError(err, '操作失败'); return }
    const note: NotepadData | null = res?.note ?? null
    if (!note) return
    currentNote.value = { ...note }
    showSuccess(note.pinned ? '已置顶' : '已取消置顶')
    await loadNotes()
  }

  const deleteNote = async () => {
    if (!selectedId.value) return
    try {
      await ElMessageBox.confirm('确定删除该笔记？', '提示', { type: 'warning' })
    } catch { return }
    const [err] = await to(notepadApi.remove(selectedId.value))
    if (err) { showError(err, '删除失败'); return }
    showSuccess('删除成功')
    selectedId.value = null
    currentNote.value = null
    editTitle.value = ''
    editContent.value = ''
    await loadNotes()
  }

  const openHistory = async () => {
    if (!selectedId.value) return
    const [err, res] = await to(notepadApi.history(selectedId.value, { page: 1, pageSize: 50 }))
    if (err) { showError(err, '获取历史失败'); return }
    historyList.value = res?.history?.list || []
    historyVisible.value = true
  }

  const init = () => {
    Promise.all([loadFolders(), loadNotes()])
  }

  onBeforeUnmount(() => {
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  })

  return {
    keyword,
    activeFolder,
    folderExpanded,
    folders,
    noteList,
    total,
    selectedId,
    currentNote,
    editTitle,
    editContent,
    editFolder,
    newFolderName,
    savingStatus,
    historyVisible,
    historyList,
    batchMode,
    checkedIds,
    isAllChecked,
    isIndeterminate,
    getFolderCount,
    getPreview,
    formatDate,
    loadFolders,
    loadNotes,
    onKeywordChange,
    selectFolder,
    selectNote,
    onNoteItemClick,
    toggleBatchMode,
    toggleCheck,
    toggleSelectAll,
    batchDeleteNotes,
    createNote,
    isDirty,
    doSave,
    doAutoSave,
    onFolderChange,
    confirmNewFolder,
    togglePinNote,
    deleteNote,
    openHistory,
    init,
  }
}
