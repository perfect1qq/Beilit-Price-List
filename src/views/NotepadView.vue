<template>
  <div class="notepad-container">
    <div class="notepad-sidebar">
      <div class="sidebar-header">
        <el-input v-model="keyword" placeholder="搜索笔记..." clearable size="default" @input="onKeywordChange">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
        <el-button v-if="!batchMode" type="primary" :icon="Plus" circle class="add-btn" @click="createNote" />
        <el-button v-else type="danger" :icon="Delete" circle class="add-btn" :disabled="!checkedIds.size"
          @click="batchDeleteNotes" />
        <el-tooltip :content="batchMode ? '取消多选' : '多选删除'" placement="top">
          <el-button :type="batchMode ? 'warning' : 'default'" :icon="batchMode ? Close : Operation" circle
            class="add-btn" @click="toggleBatchMode" />
        </el-tooltip>
      </div>

      <div class="folder-section">
        <div class="folder-header" @click="folderExpanded = !folderExpanded">
          <el-icon>
            <Folder />
          </el-icon>
          <span>文件夹</span>
          <el-icon class="expand-icon" :class="{ expanded: folderExpanded }">
            <ArrowRight />
          </el-icon>
        </div>
        <div v-show="folderExpanded" class="folder-list">
          <div v-for="folder in folders" :key="folder" class="folder-item" :class="{ active: activeFolder === folder }"
            @click="selectFolder(folder)">
            <el-icon>
              <FolderOpened />
            </el-icon>
            <span class="folder-name">{{ folder }}</span>
            <span class="folder-count">{{ getFolderCount(folder) }}</span>
          </div>
        </div>
      </div>

      <div class="note-list">
        <div v-if="batchMode && noteList.length" class="batch-select-all" @click="toggleSelectAll">
          <el-checkbox :model-value="isAllChecked" :indeterminate="isIndeterminate" />
          <span>{{ isAllChecked ? '取消全选' : '全选' }}</span>
          <span class="checked-count">已选 {{ checkedIds.size }} 项</span>
        </div>
        <div v-for="note in noteList" :key="note.id" class="note-item"
          :class="{ active: selectedId === note.id, pinned: note.pinned, checked: checkedIds.has(note.id!) }"
          @click="onNoteItemClick(note)">
          <div class="note-item-header">
            <el-checkbox v-if="batchMode" :model-value="checkedIds.has(note.id!)"
              @change="(val: boolean) => toggleCheck(note.id!, val)" @click.stop />
            <el-icon v-if="note.pinned" class="pin-icon">
              <Star />
            </el-icon>
            <span class="note-title">{{ note.title || '无标题' }}</span>
          </div>
          <div class="note-item-preview">{{ getPreview(note.content) }}</div>
          <div class="note-item-meta">
            <span>{{ formatDate(note.updatedAt) }}</span>
            <span class="note-folder-tag">{{ note.folder }}</span>
          </div>
        </div>
        <el-empty v-if="!noteList.length" description="暂无笔记" :image-size="60" />
      </div>

      <div class="sidebar-footer">
        <span v-if="batchMode">已选 {{ checkedIds.size }}/{{ total }} 篇</span>
        <span v-else>共 {{ total }} 篇笔记</span>
      </div>
    </div>

    <div class="notepad-main">
      <template v-if="currentNote">
        <div class="editor-header">
          <div class="header-left">
            <el-input v-model="editTitle" placeholder="笔记标题" class="title-input" size="large" @blur="doAutoSave" />
          </div>
          <div class="header-right">
            <el-select v-model="editFolder" placeholder="文件夹" size="default" class="folder-select"
              @change="onFolderChange">
              <el-option v-for="f in folders" :key="f" :label="f" :value="f" />
              <el-option label="+ 新建文件夹" value="__new__" />
            </el-select>
            <el-input v-if="editFolder === '__new__'" v-model="newFolderName" placeholder="文件夹名称" size="default"
              class="new-folder-input" @blur="confirmNewFolder" @keyup.enter="confirmNewFolder" />
            <el-tooltip content="保存" placement="top">
              <el-button type="primary" :icon="Check" circle size="default" @click="doSave" :disabled="!isDirty()" />
            </el-tooltip>
            <el-tooltip :content="currentNote.pinned ? '取消置顶' : '置顶'" placement="top">
              <el-button :type="currentNote.pinned ? 'warning' : 'default'" :icon="Star" circle size="default"
                @click="togglePinNote" />
            </el-tooltip>
            <el-tooltip content="历史记录" placement="top">
              <el-button :icon="Clock" circle size="default" @click="openHistory" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button type="danger" :icon="Delete" circle size="default" @click="deleteNote" />
            </el-tooltip>
          </div>
        </div>

        <div class="editor-body">
          <el-input v-model="editContent" type="textarea" :autosize="{ minRows: 20 }" placeholder="开始记录..."
            class="content-textarea" @blur="doAutoSave" />
        </div>

        <div class="editor-footer">
          <span>最后编辑: {{ formatDate(currentNote.updatedAt) }}</span>
          <span v-if="savingStatus" class="saving-indicator">{{ savingStatus }}</span>
        </div>
      </template>

      <div v-else class="empty-editor">
        <el-icon class="empty-icon">
          <Notebook />
        </el-icon>
        <p>选择或创建一篇笔记</p>
      </div>
    </div>

    <NotepadHistoryDrawer v-model:visible="historyVisible" :list="historyList" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  Plus,
  Star,
  Delete,
  Clock,
  Folder,
  FolderOpened,
  ArrowRight,
  Search,
  Notebook,
  Check,
  Close,
  Operation
} from '@element-plus/icons-vue'
import notepadApi from '@/api/notepad'
import { to } from '@/utils/async'
import { showError, showSuccess } from '@/utils/message'
import NotepadHistoryDrawer from '@/components/notepad/NotepadHistoryDrawer.vue'
import type { NotepadData, NotepadHistoryData } from '@/types'

defineOptions({ name: 'NotepadView' })

const keyword = ref('')
const activeFolder = ref('')
const folderExpanded = ref(true)
const folders = ref<string[]>(['默认'])
const noteList = ref<NotepadData[]>([])
const total = ref(0)
const selectedId = ref<number | null>(null)
const currentNote = ref<NotepadData | null>(null)

const editTitle = ref('')
const editContent = ref('')
const editFolder = ref('默认')
const newFolderName = ref('')
const savingStatus = ref('')

const historyVisible = ref(false)
const historyList = ref<NotepadHistoryData[]>([])

const folderCountMap = ref<Record<string, number>>({})

const batchMode = ref(false)
const checkedIds = ref<Set<number>>(new Set())

const isAllChecked = computed(() => noteList.value.length > 0 && checkedIds.value.size === noteList.value.length)
const isIndeterminate = computed(() => checkedIds.value.size > 0 && checkedIds.value.size < noteList.value.length)

let searchTimer: ReturnType<typeof setTimeout> | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

const getFolderCount = (folder: string): number => folderCountMap.value[folder] || 0

const getPreview = (content: string): string => {
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
  const note: NotepadData = res?.note || {}
  showSuccess('创建成功')
  await loadNotes()
  selectNote(note)
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
  const updated: NotepadData = res?.note || {}
  currentNote.value = { ...updated }
  const idx = noteList.value.findIndex((n) => n.id === selectedId.value)
  if (idx !== -1) noteList.value[idx] = { ...updated }
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
  const note: NotepadData = res?.note || {}
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
  historyList.value = (res?.history?.list || []) as NotepadHistoryData[]
  historyVisible.value = true
}

onMounted(() => {
  Promise.all([loadFolders(), loadNotes()])
})
</script>

<style scoped>
.notepad-container {
  display: flex;
  height: calc(100vh - 110px);
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.notepad-sidebar {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.sidebar-header .el-input {
  flex: 1;
}

.add-btn {
  flex-shrink: 0;
}

.folder-section {
  border-bottom: 1px solid #ebeef5;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  user-select: none;
}

.folder-header:hover {
  background: #f5f7fa;
}

.expand-icon {
  margin-left: auto;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.folder-list {
  padding: 0 8px 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
}

.folder-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.folder-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.folder-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: 11px;
  color: #909399;
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 10px;
}

.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.note-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.note-item:hover {
  background: #f5f7fa;
  border-color: #e4e7ed;
}

.note-item.active {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.note-item.pinned {
  border-left: 3px solid #e6a23c;
}

.note-item.checked {
  background: #fef0f0;
  border-color: #fab6b6;
}

.batch-select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  transition: background 0.2s;
}

.batch-select-all:hover {
  background: #ecf5ff;
}

.checked-count {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.note-item-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.pin-icon {
  color: #e6a23c;
  font-size: 12px;
}

.note-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.note-item-preview {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.note-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #c0c4cc;
}

.note-folder-tag {
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 4px;
  color: #909399;
}

.sidebar-footer {
  padding: 10px 16px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.notepad-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
  min-width: 200px;
}

.title-input :deep(.el-input__wrapper) {
  box-shadow: none;
  font-size: 18px;
  font-weight: 600;
}

.title-input :deep(.el-input__wrapper):hover,
.title-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.folder-select {
  width: 140px;
}

.new-folder-input {
  width: 120px;
}

.editor-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.content-textarea :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  font-size: 14px;
  line-height: 1.8;
  resize: none;
  padding: 0;
  background: transparent;
}

.content-textarea :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

.editor-footer {
  padding: 8px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.saving-indicator {
  color: #67c23a;
}

.empty-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-editor p {
  font-size: 16px;
}
</style>
