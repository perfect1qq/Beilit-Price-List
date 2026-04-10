#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * 前端关键回归（静态规则）：
 * 1) 查看模式隐藏智能解析区域
 * 2) 历史查看态提供“回到新增报价”
 * 3) 鉴权过期处理不关闭标签页，且不使用 localStorage.clear()
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relPath) {
  const full = path.join(root, relPath)
  return fs.readFileSync(full, 'utf8')
}

function run() {
  const quotationView = read('src/views/QuotationList.vue')
  assert(
    quotationView.includes('v-if="!isViewMode" type="primary" :icon="DocumentAdd"'),
    '智能解析按钮未按查看模式隐藏'
  )
  assert(
    quotationView.includes('<el-card v-if="!isViewMode" shadow="never" class="inner-card">'),
    '粘贴内容区域未按查看模式隐藏'
  )
  assert(
    quotationView.includes('v-if="isViewMode && enteredFromHistory" type="primary" plain @click="backToCreate">回到新增报价</el-button>'),
    '查看页缺少“回到新增报价”按钮'
  )

  const authSession = read('src/utils/authSession.js')
  assert(!authSession.includes('window.close('), '发现 window.close，存在关闭标签页风险')
  assert(!authSession.includes('localStorage.clear('), '发现 localStorage.clear，存在误删本地数据风险')

  const navbar = read('src/layout/components/Navbar.vue')
  assert(!navbar.includes('localStorage.clear('), 'Navbar 中仍存在 localStorage.clear')

  console.log('[regression-ui] all checks passed')
}

try {
  run()
} catch (error) {
  console.error('[regression-ui] failed:', error.message)
  process.exit(1)
}
