<template>
  <div class="memo-page">
    <el-card shadow="never" class="memo-card">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="按标题或内容搜索"
          clearable
          :prefix-icon="Search"
          style="max-width: 320px"
        />
        <el-button type="primary" :icon="Plus" @click="openCreate">新增备忘录</el-button>
        <el-tag type="info" effect="plain">{{ isAdmin ? '管理员可查看全部备忘录' : '仅显示自己的备忘录' }}</el-tag>
      </div>

      <el-table :data="filteredList" v-loading="loading" stripe border class="smart-table" :header-cell-style="headerStyle">
        <template #empty>
          <el-empty description="暂无备忘录" />
        </template>
        <el-table-column prop="updatedAt" label="最后更新" width="160" align="center">
          <template #default="{ row }">{{ formatTime(row.updatedAt || row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="220" />
        <el-table-column prop="content" label="内容" min-width="360" show-overflow-tooltip />
        <el-table-column prop="ownerName" label="创建人" width="120" v-if="isAdmin" />
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">修改</el-button>
            <el-button link type="info" size="small" @click="openHistory(row)">查看历史</el-button>
            <el-button link type="danger" size="small" @click="removeMemo(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增备忘录' : '修改备忘录'" width="720px">
      <el-form label-width="88px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="10" placeholder="请输入备忘内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMemo">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="historyVisible" :title="historyTitle" size="50%">
      <el-timeline v-if="historyList.length">
        <el-timeline-item
          v-for="item in historyList"
          :key="item.id"
          :timestamp="formatTime(item.createdAt)"
          placement="top"
        >
          <el-card shadow="never" class="history-card">
            <div class="history-head">
              <strong>{{ item.title }}</strong>
              <el-tag size="small" :type="actionTag(item.action)">{{ actionLabel(item.action) }}</el-tag>
            </div>
            <p class="history-content">{{ item.content }}</p>
            <div class="history-meta">{{ item.operatorName }} · {{ formatTime(item.createdAt) }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无历史记录" />
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { memoApi } from '@/api/memo'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const isAdmin = computed(() => user.role === 'admin')
const headerStyle = { background: '#f8fafc', color: '#475569', fontWeight: 'bold', textAlign: 'center' }

const list = ref([])
const loading = ref(false)
const keyword = ref('')

const dialogVisible = ref(false)
const dialogMode = ref('create')
const editingId = ref(null)
const form = reactive({ title: '', content: '' })

const historyVisible = ref(false)
const historyTitle = ref('备忘录历史')
const historyList = ref([])

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(item => `${item.title || ''} ${item.content || ''}`.toLowerCase().includes(kw))
})

const loadList = async () => {
  loading.value = true
  try {
    const res = await memoApi.list()
    list.value = res.list || []
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '获取备忘录失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.title = ''
  form.content = ''
  editingId.value = null
}

const openCreate = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  form.title = row.title || ''
  form.content = row.content || ''
  dialogVisible.value = true
}

const saveMemo = async () => {
  if (!form.title.trim()) return ElMessage.warning('标题不能为空')
  if (!form.content.trim()) return ElMessage.warning('内容不能为空')
  try {
    if (dialogMode.value === 'create') {
      await memoApi.create({ title: form.title, content: form.content })
      ElMessage.success('备忘录已创建')
    } else {
      await memoApi.update(editingId.value, { title: form.title, content: form.content })
      ElMessage.success('备忘录已更新')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '保存失败')
  }
}

const removeMemo = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除备忘录「${row.title}」吗？`, '提示', { type: 'warning' })
    await memoApi.remove(row.id)
    ElMessage.success('删除成功')
    await loadList()
  } catch {}
}

const openHistory = async (row) => {
  historyTitle.value = `${row.title} · 历史记录`
  historyVisible.value = true
  try {
    const res = await memoApi.history(row.id)
    historyList.value = res.histories || []
  } catch (error) {
    historyList.value = []
    ElMessage.error(error?.response?.data?.message || '获取历史失败')
  }
}

const actionTag = (action) => ({ create: 'success', update: 'warning', delete: 'danger' }[action] || 'info')
const actionLabel = (action) => ({ create: '创建', update: '修改', delete: '删除' }[action] || action)

const formatTime = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(loadList)
</script>

<style scoped>
.memo-page { padding: 0; }
.memo-card { border-radius: 12px; border: none; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
.history-card { border-radius: 10px; margin-bottom: 10px; }
.history-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.history-content { margin: 12px 0 8px; white-space: pre-wrap; color: #334155; line-height: 1.7; }
.history-meta { color: #94a3b8; font-size: 12px; }
</style>
