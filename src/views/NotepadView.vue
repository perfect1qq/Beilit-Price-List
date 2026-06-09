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
import { onMounted } from 'vue'
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
import NotepadHistoryDrawer from '@/components/notepad/NotepadHistoryDrawer.vue'
import { useNotepad } from '@/composables/useNotepad'

defineOptions({ name: 'NotepadView' })

const {
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
  onKeywordChange,
  selectFolder,
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
} = useNotepad()

onMounted(() => {
  init()
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
  color: #3b82f6;
}

.folder-item.active {
  background: #ecf5ff;
  color: #3b82f6;
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
