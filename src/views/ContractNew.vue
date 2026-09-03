<template>
  <div class="contract-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑合同' : '新增合同' }}</span>
          <div class="header-actions">
            <AppButton @click="goBack">返回列表</AppButton>
            <AppButton type="info" plain @click="insertPageBreak">插入分页符</AppButton>
            <AppButton type="primary" :loading="saving" @click="saveContract">保存合同</AppButton>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="公司名称" prop="companyName" required>
          <el-input v-model="formData.companyName" placeholder="请输入公司名称，相同公司名称在历史记录会自动归纳..." />
        </el-form-item>

        <el-form-item label="合同金额(¥)" required>
          <el-input-number v-model="formData.amount" :min="0" :step="100" placeholder="请输入合同成交金额..." style="width: 100%;" />
        </el-form-item>

        <el-form-item label="合同标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入合同标题..." />
        </el-form-item>

        <el-form-item label="合同时间" prop="contractDate">
          <el-date-picker
            v-model="formData.contractDate"
            type="date"
            placeholder="选择合同日期（必填）"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="合同内容 (支持直接从 Word 文档复制粘贴，保留原格式)" required>
          <div class="editor-wrapper">
            <!-- 工具栏 -->
            <div class="editor-toolbar">
              <el-button-group>
                <AppButton size="small" @click="execCmd('bold')" title="加粗"><strong>B</strong></AppButton>
                <AppButton size="small" @click="execCmd('italic')" title="斜体"><em>I</em></AppButton>
                <AppButton size="small" @click="execCmd('underline')" title="下划线"><u>U</u></AppButton>
                <AppButton size="small" @click="execCmd('strikeThrough')" title="删除线"><s>S</s></AppButton>
              </el-button-group>
              <el-select v-model="fontName" size="small" placeholder="字体" style="width: 110px;" @change="execCmd('fontName', fontName)">
                <el-option v-for="f in fontNames" :key="f" :label="f" :value="f" />
              </el-select>
              <el-select v-model="fontSize" size="small" placeholder="字号" style="width: 80px;" @change="execCmd('fontSize', fontSize)">
                <el-option v-for="s in 7" :key="s" :label="sizeLabels[s - 1]" :value="s" />
              </el-select>
              <el-button-group>
                <AppButton size="small" @click="execCmd('foreColor', fontColor)" title="文字颜色">
                  <span style="color: #409eff;">A</span>
                </AppButton>
                <el-color-picker v-model="fontColor" size="small" @change="execCmd('foreColor', fontColor)" />
              </el-button-group>
              <el-button-group>
                <AppButton size="small" @click="execCmd('justifyLeft')" title="左对齐">
                  <el-icon><svg viewBox="0 0 1024 1024" width="14" height="14"><path fill="currentColor" d="M128 128h768v64H128zM128 320h512v64H128zM128 512h768v64H128zM128 704h512v64H128z"/></svg></el-icon>
                </AppButton>
                <AppButton size="small" @click="execCmd('justifyCenter')" title="居中">
                  <el-icon><svg viewBox="0 0 1024 1024" width="14" height="14"><path fill="currentColor" d="M128 128h768v64H128zM256 320h512v64H256zM128 512h768v64H128zM256 704h512v64H256z"/></svg></el-icon>
                </AppButton>
                <AppButton size="small" @click="execCmd('justifyRight')" title="右对齐">
                  <el-icon><svg viewBox="0 0 1024 1024" width="14" height="14"><path fill="currentColor" d="M128 128h768v64H128zM384 320h512v64H384zM128 512h768v64H128zM384 704h512v64H384z"/></svg></el-icon>
                </AppButton>
              </el-button-group>
              <AppButton size="small" @click="execCmd('insertUnorderedList')" title="无序列表">• 列表</AppButton>
              <AppButton size="small" @click="execCmd('insertOrderedList')" title="有序列表">1. 列表</AppButton>
              <AppButton size="small" @click="execCmd('removeFormat')" title="清除格式">清除</AppButton>
              <AppButton type="warning" size="small" :icon="MagicStick" @click="smartFormat" title="根据合同文字内容自动识别标题、双方、条款、签署区并套用专业排版">智能排版</AppButton>
            </div>
            <!-- 编辑区域（原生 contentEditable，粘贴时保留 Word 格式） -->
            <div
              ref="editorRef"
              class="editor-content"
              contenteditable="true"
              @input="onEditorInput"
              @paste="onPaste"
            ></div>
          </div>
        </el-form-item>

        <el-form-item label="合同附件">
          <FileUpload v-model="attachments" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'

import { createRequiredRule } from '@/utils/formRules'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import * as dompurify from 'dompurify'
const DOMPurify = (dompurify as any).default || dompurify
import contractApi from '@/api/contract'
import { useFormSubmit } from '@/composables/useFormSubmit'
import FileUpload from '@/components/common/FileUpload.vue'

const route = useRoute()
const router = useRouter()

const isEdit = ref(false)
const contractId = ref<number>(0)
const formRef = ref()
const formData = reactive({
  companyName: '',
  amount: 0,
  title: '',
  contractDate: ''
})
const rules = {
  title: [createRequiredRule('合同标题')],
  contractDate: [createRequiredRule('合同时间')],
  companyName: [createRequiredRule('公司名称')]
}
const { submitLoading: saving, withSubmitLock } = useFormSubmit({ lockDuration: 300 })
const attachments = ref<any[]>([])

// 编辑器 DOM 引用
const editorRef = ref<HTMLElement>()
const isEmpty = ref(true)

// 工具栏状态
const fontName = ref('宋体')
const fontSize = ref(3)
const fontColor = ref('#000000')
const fontNames = ['宋体', '黑体', '微软雅黑', '楷体', '仿宋', 'Arial', 'Times New Roman']
const sizeLabels = ['极小', '较小', '小', '中', '大', '较大', '极大']



// 执行格式化命令
const execCmd = (cmd: string, val?: string) => {
  document.execCommand(cmd, false, val)
  editorRef.value?.focus()
  onEditorInput()
}

// 编辑器内容变化
const onEditorInput = () => {
  const html = editorRef.value?.innerHTML || ''
  isEmpty.value = !html || html === '<br>' || html === '<p><br></p>'
  autoResize()
}

// 自适应高度：内容多高编辑器就多高，避免滚动看不全
const autoResize = () => {
  const editor = editorRef.value
  if (!editor) return
  editor.style.height = 'auto'
  editor.style.height = Math.max(300, editor.scrollHeight) + 'px'
}

// 粘贴处理：清理 Word 特有标记，保留内联样式与表格结构；纯文本粘贴时把换行转成 <p>
const onPaste = (e: ClipboardEvent) => {
  e.preventDefault()
  let html = e.clipboardData?.getData('text/html') || ''
  const text = e.clipboardData?.getData('text/plain') || ''
  
  if (!html) {
    document.execCommand('insertText', false, text)
    onEditorInput()
    return
  }

  // Sanitize completely via DOMPurify, allowing necessary styles and tags.
  const safeHtml = DOMPurify.sanitize(html, { 
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'table', 'tbody', 'tr', 'td', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['style', 'class', 'colspan', 'rowspan']
  })

  const temp = document.createElement('div')
  temp.innerHTML = safeHtml

  // 尝试清理空 div
  temp.querySelectorAll('div').forEach(div => {
    if (!div.querySelector('div, p, table')) {
      const p = document.createElement('p')
      p.innerHTML = div.innerHTML
      div.replaceWith(p)
    }
  })

  // 确保表格带边框（Word 表格边框通常由 mso 样式定义，清理后丢失）
  // 关键：html-to-docx 不识别 CSS 简写 border:，必须用分边 border-top/right/bottom/left
  temp.querySelectorAll('table').forEach(table => {
    table.setAttribute('border', '1')
    table.setAttribute('cellspacing', '0')
    table.setAttribute('cellpadding', '0')
    const tStyle = table.getAttribute('style') || ''
    table.setAttribute('style', `${tStyle}${tStyle && !tStyle.endsWith(';') ? '; ' : ''}border-collapse: collapse;`)
    table.querySelectorAll('td, th').forEach(cell => {
      const cStyle = cell.getAttribute('style') || ''
      if (!/border-(top|right|bottom|left)\s*:/i.test(cStyle)) {
        cell.setAttribute('style', `${cStyle}${cStyle && !cStyle.endsWith(';') ? '; ' : ''}border-top: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; border-left: 1px solid #000;`)
      }
    })
  })

  document.execCommand('insertHTML', false, temp.innerHTML)
  onEditorInput()
  setTimeout(autoResize, 50)
}

// 智能排版：根据合同文字内容自动识别结构并套用专业排版
// 支持：合同标题、合同编号、中文/阿拉伯数字条款、子项、列表、双方分栏、签署区、制表符合并表格
const smartFormat = () => {
  const editor = editorRef.value
  if (!editor) return

  const html = editor.innerHTML
  if (!html || html === '<br>' || html === '<p><br></p>') {
    return ElMessage.warning('合同内容为空，无法排版')
  }

  // === 步骤1：标准化 - 把所有块（div/h1-h6/p/裸文本/<br>分隔文本）统一转成 <p> ===
  // 将编辑器直接的裸文本节点包装成 <p>
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null)
  const textNodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = node.textContent || ''
    if (text.trim() && node.parentElement === editor) {
      textNodes.push(node as Text)
    }
  }
  textNodes.forEach(textNode => {
    const p = document.createElement('p')
    p.textContent = textNode.textContent
    editor.replaceChild(p, textNode)
  })

  // 将 div（无子块）的文本内容转为 <p>
  editor.querySelectorAll('div').forEach(div => {
    if (!div.querySelector('p, div, table, h1, h2, h3, h4, h5, h6')) {
      const p = document.createElement('p')
      p.innerHTML = div.innerHTML
      div.replaceWith(p)
    }
  })
  // 把 h1-h6 转成 <p> 统一处理
  editor.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    const p = document.createElement('p')
    p.textContent = h.textContent
    h.replaceWith(p)
  })

  // === 步骤2：把含 <br> 的段落按行拆成多个 <p> ===
  editor.querySelectorAll('p').forEach(p => {
    if (p.querySelector('br')) {
      const parts = p.innerHTML.split(/<br\s*\/?>/i)
      const frag = document.createDocumentFragment()
      parts.forEach(part => {
        const newP = document.createElement('p')
        newP.innerHTML = part
        frag.appendChild(newP)
      })
      p.replaceWith(frag)
    }
  })

  // === 步骤3：合并连续的制表符分隔行为 <table> ===
  // 识别规则：含制表符 \t 的行视为表格行；连续多行（>=2）合并成表格
  const allParas = Array.from(editor.querySelectorAll(':scope > p'))
  const tableGroups: { start: number; end: number; cols: number }[] = []
  let i = 0
  while (i < allParas.length) {
    const text = allParas[i].textContent || ''
    if (text.includes('\t')) {
      const start = i
      let maxCols = text.split('\t').length
      let j = i + 1
      while (j < allParas.length && (allParas[j].textContent || '').includes('\t')) {
        const cols = (allParas[j].textContent || '').split('\t').length
        if (cols > maxCols) maxCols = cols
        j++
      }
      if (j - start >= 2) {
        // 只合并连续>=2行的制表符行（单行可能只是文本中含制表符）
        tableGroups.push({ start, end: j, cols: maxCols })
      }
      i = j
    } else {
      i++
    }
  }
  // 从后往前替换，避免索引偏移
  for (let k = tableGroups.length - 1; k >= 0; k--) {
    const { start, end, cols } = tableGroups[k]
    const table = document.createElement('table')
    table.setAttribute('border', '1')
    table.setAttribute('cellspacing', '0')
    table.setAttribute('cellpadding', '0')
    const tbody = document.createElement('tbody')
    for (let m = start; m < end; m++) {
      const tr = document.createElement('tr')
      const cells = (allParas[m].textContent || '').split('\t')
      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td')
        td.textContent = (cells[c] || '').trim()
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    allParas[start].replaceWith(table)
    for (let m = start + 1; m < end; m++) {
      allParas[m].remove()
    }
  }

  // === 步骤4：遍历所有 <p>，按内容识别合同结构并套用样式 ===
  // 样式常量
  const FONT = "font-family: 宋体, SimSun; color: #000;"
  const STYLE_TITLE = `font-size: 22pt; font-weight: bold; text-align: center; margin: 20px 0 12px; ${FONT}`
  const STYLE_CONTRACT_NO = `text-align: right; font-size: 10.5pt; color: #666; margin: 5px 0; ${FONT}`
  const STYLE_PARTIES = `font-size: 12pt; margin: 8px 0; ${FONT}`
  const STYLE_PREAMBLE = `font-size: 12pt; text-indent: 2em; line-height: 1.8; margin: 5px 0; ${FONT}`
  const STYLE_SECTION_TITLE = `font-size: 14pt; font-weight: bold; margin: 16px 0 8px; ${FONT}`
  const STYLE_LIST = `font-size: 12pt; margin: 5px 0 5px 2em; line-height: 1.8; ${FONT}`
  const STYLE_SUB_ITEM = `font-size: 12pt; margin: 5px 0 5px 4em; line-height: 1.8; ${FONT}`
  const STYLE_BANK_INFO = `font-size: 12pt; margin: 3px 0 3px 2em; line-height: 1.8; ${FONT}`
  const STYLE_SIGNATURE = `font-size: 12pt; text-align: right; margin: 10px 60px 5px 0; ${FONT}`
  const STYLE_BODY = `font-size: 12pt; text-indent: 2em; line-height: 1.8; margin: 5px 0; ${FONT}`

  let titleFound = false
  let inSignatureBlock = false

  editor.querySelectorAll(':scope > p').forEach(p => {
    const text = (p.textContent || '').trim()
    p.removeAttribute('class')

    // 空段落
    if (!text) {
      p.setAttribute('style', 'margin: 6px 0;')
      return
    }

    // 1. 合同标题：第一个短行，含"合同/协议/契约/书"等关键词
    if (!titleFound && text.length < 30 && /(合同|协议|契约|意向书|声明书?|确认书|订单|合同书|协议书)/.test(text)) {
      p.setAttribute('style', STYLE_TITLE)
      titleFound = true
      return
    }

    // 2. 合同编号
    if (/合同编号|编号\s*[:：]|No\.?\s/i.test(text) && text.length < 60) {
      p.setAttribute('style', STYLE_CONTRACT_NO)
      return
    }

    // 3. 双方信息：购买方/供货方/甲方/乙方 等 + 冒号或括号标注
    if (/^(购买方|供货方|甲方|乙方|供方|需方|买方|卖方|出租方|承租方|发包方|承包方|委托方|受托方|出让方|受让方|许可方|被许可方|定作方|承揽方|托运方|运输方)[\s\u4e00-\u9fa5a-zA-Z]*[：:（(]/.test(text) && text.length < 80) {
      p.setAttribute('style', STYLE_PARTIES)
      return
    }

    // 4. 条款标题：一、二、三、 / 第一条 / 第1条 / 一、XX：
    if (/^[一二三四五六七八九十]+[、，。]/.test(text) || /^第[一二三四五六七八九十百\d]+条/.test(text)) {
      p.setAttribute('style', STYLE_SECTION_TITLE)
      inSignatureBlock = false
      return
    }

    // 5. 子项标题：1. / 1、 / (1) / （1） 后跟文字（不是合同条款"第一条"）
    if (/^\d+[.、)]\s+/.test(text) || /^[（(]\d+[)）]\s*/.test(text)) {
      // 判断是子项（带括号）还是主列表（1、）
      if (/^[（(]\d+[)）]/.test(text)) {
        p.setAttribute('style', STYLE_SUB_ITEM)
      } else {
        p.setAttribute('style', STYLE_LIST)
      }
      return
    }

    // 6. 银行账户信息（公司名称/开户行/账号）
    if (/^(公司名称|开\s*户\s*行|账\s*号|户\s*名|收款账户)/.test(text)) {
      p.setAttribute('style', STYLE_BANK_INFO)
      return
    }

    // 7. 签署区："甲 方\t乙 方" 分栏标题 或 盖章/签字/日期/委托代表 等
    if (/^甲\s*方[\s\t]*乙\s*方$/.test(text) || /^(盖章|签字|签名|委托代表|经办人|法人代表|联系电话|传真|单位地址|供方名称|需方名称|户名|开户行|账号)/.test(text) || /\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/.test(text)) {
      // 如果是"甲 方 乙 方"这种分栏标题，进入签署块模式
      if (/^甲\s*方[\s\t]*乙\s*方$/.test(text)) {
        inSignatureBlock = true
        p.setAttribute('style', 'font-size: 12pt; font-weight: bold; margin: 20px 0 8px; display: flex; justify-content: space-between; ' + FONT)
      } else {
        inSignatureBlock = true
        p.setAttribute('style', STYLE_SIGNATURE)
      }
      return
    }

    // 8. 签署块内的字段（需方名称/供方名称等）
    if (inSignatureBlock && /^(需方名称|供方名称|单位地址|法人代表|委托代表|盖章|联系电话|传真|日期|户名|开户行|账号)/.test(text)) {
      p.setAttribute('style', STYLE_SIGNATURE)
      return
    }

    // 9. 序言段（"甲乙双方..."开头的合同引言）
    if (/^甲乙双方/.test(text) || /^双方根据/.test(text)) {
      p.setAttribute('style', STYLE_PREAMBLE)
      return
    }

    // 10. 默认正文
    p.setAttribute('style', STYLE_BODY)
  })

  // === 步骤5：处理已有 <table>，统一边框样式（不加颜色标记） ===
  // 关键：html-to-docx 不识别 CSS 简写 border:，必须用分边 border-top/right/bottom/left
  editor.querySelectorAll('table').forEach(table => {
    table.removeAttribute('class')
    table.setAttribute('border', '1')
    table.setAttribute('cellspacing', '0')
    table.setAttribute('cellpadding', '0')
    table.setAttribute('style', `border-collapse: collapse; width: 100%; margin: 10px 0; ${FONT}`)
    table.querySelectorAll('td, th').forEach(cell => {
      cell.removeAttribute('class')
      cell.setAttribute('style', `border-top: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 6px 8px; font-size: 10.5pt; ${FONT}`)
    })
  })

  onEditorInput()
  setTimeout(autoResize, 50)
  ElMessage.success('已应用智能排版')
}

// 读取编辑器 HTML（含完整内联样式）
const getEditorHtml = (): string => {
  return editorRef.value?.innerHTML || ''
}

onMounted(async () => {
  const id = Number(route.query.id)
  if (id) {
    isEdit.value = true
    contractId.value = id
    try {
      const res = await contractApi.get(id)
      formData.companyName = res.contract.companyName || ''
      formData.amount = res.contract.amount || 0
      formData.title = res.contract.title
      const fallbackDate = res.contract.contractDate || res.contract.createdAt || ''
      formData.contractDate = fallbackDate ? String(fallbackDate).slice(0, 10) : ''
      if (editorRef.value && res.contract.content) {
        editorRef.value.innerHTML = DOMPurify.sanitize(res.contract.content)
      }
      isEmpty.value = false
      try {
        attachments.value = JSON.parse(res.contract.attachments || '[]')
      } catch {
        attachments.value = []
      }
      // DOM 渲染后自适应高度
      setTimeout(autoResize, 50)
    } catch (e: any) {
      ElMessage.error(e.message || '获取合同详情失败')
    }
  }
})

const goBack = () => {
  router.push('/contract/history')
}

const insertPageBreak = () => {
  editorRef.value?.focus()
  document.execCommand('insertHTML', false, '<div style="page-break-before: always; border-bottom: 2px dashed #ccc; margin: 10px 0; text-align: center; color: #999; font-size: 12px;">--- 分页符 ---</div><p><br></p>')
  onEditorInput()
  setTimeout(autoResize, 50)
  ElMessage.success('已插入分页符')
}



const saveContract = async () => {
  if (!formData.contractDate) {
    return ElMessage.warning('请选择合同时间');
  }
  if (!formData.title.trim()) {
    return ElMessage.warning('请输入合同标题')
  }

  const html = getEditorHtml()
  if (!html || isEmpty.value) {
    return ElMessage.warning('请输入合同内容')
  }

  await withSubmitLock(async () => {
    try {
      const finalAttachments = attachments.value.map(f => ({
        name: f.name,
        url: f.response?.data?.url || f.url,
        size: f.response?.data?.size || f.size || 0
      }))

      if (isEdit.value) {
        await contractApi.update(contractId.value, {
          companyName: formData.companyName,
          amount: formData.amount,
          title: formData.title,
          content: html,
          attachments: JSON.stringify(finalAttachments),
          contractDate: formData.contractDate || null,
        })
        ElMessage.success('合同更新成功')
        router.push('/contract/history')
      } else {
        await contractApi.create({
          companyName: formData.companyName,
          amount: formData.amount,
          title: formData.title,
          content: html,
          attachments: JSON.stringify(finalAttachments),
          contractDate: formData.contractDate || null,
        })
        ElMessage.success('合同创建成功')
        router.push('/contract/history')
      }
    } catch (e: any) {
      ElMessage.error(e.message || '保存失败')
    }
  })
}
</script>

<style scoped>
.contract-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.editor-wrapper {
  border: 1px solid var(--el-border-color);
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fff;
}
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color);
  background-color: #f8f8f8;
}
.editor-content {
  min-height: 300px;
  padding: 16px;
  font-family: '宋体', SimSun, serif;
  font-size: 14px;
  line-height: 1.8;
  outline: none;
  overflow-y: hidden;
}
.editor-content:empty::before {
  content: '请在此输入合同正文，或直接从 Word 复制粘贴...';
  color: #999;
}
.editor-content table {
  border-collapse: collapse;
}
.editor-content td,
.editor-content th {
  border: 1px solid #000;
  padding: 4px;
}
</style>
