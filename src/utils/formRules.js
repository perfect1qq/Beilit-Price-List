/**
 * @module utils/formRules
 * @description 表单验证规则集
 * 
 * 提供常用的验证规则和自定义验证器，
 * 统一管理表单校验逻辑，便于维护和复用。
 * 
 * @example
 * import { beamNameRule, memoTitleRule } from '@/utils/formRules'
 * 
 * // 在 el-form-item 上使用
 * :rules="beamNameRule"
 */

/** 验证触发方式配置 */
const TRIGGER_BLUR_CHANGE = ['blur', 'change']
const TRIGGER_BLUR = 'blur'

/**
 * 空格验证器 - 拒绝仅包含空格的输入
 * @param {string} [label='该字段'] - 字段标签名
 * @returns {Object} Element Plus 验证规则对象
 */
const noSpaceValidator = (label = '该字段') => ({
  validator: (rule, value, callback) => {
    if (value && !value.trim()) {
      callback(new Error(`${label}不能只包含空格`))
    } else {
      callback()
    }
  },
  trigger: TRIGGER_BLUR_CHANGE
})

/** ==================== 规则工厂函数 ==================== */

/** 创建必填规则 */
export const createRequiredRule = (label = '该字段') => ({
  required: true,
  message: `请输入${label}`,
  trigger: TRIGGER_BLUR_CHANGE
})

/** 创建最大长度规则 */
export const createMaxLengthRule = (max, label = '该字段') => ({
  max,
  message: `${label}不能超过${max}个字符`,
  trigger: TRIGGER_BLUR_CHANGE
})

/** 创建最小长度规则 */
export const createMinLengthRule = (min, label = '该字段') => ({
  min,
  message: `${label}不能少于${min}个字符`,
  trigger: TRIGGER_BLUR_CHANGE
})

/** ==================== 业务规则集 ==================== */

/** 报价单名称验证规则 */
export const quotationNameRule = [
  createRequiredRule('报价单名称'),
  createMaxLengthRule(100, '报价单名称'),
  noSpaceValidator('报价单名称')
]

/** 公司名称验证规则 */
export const companyNameRule = [
  createRequiredRule('公司名称'),
  createMaxLengthRule(100, '公司名称'),
  noSpaceValidator('公司名称')
]

/** 横梁名称验证规则（表格内使用） */
export const beamNameRule = [
  createRequiredRule('横梁名称'),
  { ...createMaxLengthRule(50, '横梁名称'), trigger: TRIGGER_BLUR_CHANGE },
  noSpaceValidator('横梁名称')
]

/** 横梁名称验证规则（独立输入框使用） */
export const beamNameRule2 = [...beamNameRule]

/** 记录名称验证规则 */
export const recordNameRule = [
  createRequiredRule('记录名称'),
  createMaxLengthRule(100, '记录名称'),
  noSpaceValidator('记录名称')
]

/** 正整数验证规则（仅检查非空） */
export const positiveIntegerRule = (label = '该字段') => [
  createRequiredRule(label),
  noSpaceValidator(label)
]

/** 正小数验证规则（仅检查非空） */
export const positiveDecimalRule = (label = '该字段') => [
  createRequiredRule(label),
  noSpaceValidator(label)
]

/** ==================== 备忘录专用规则 ==================== */

/** 备忘录任务名称验证规则 */
export const memoTitleRule = [
  { required: true, message: '请输入任务名称', trigger: TRIGGER_BLUR },
  createMaxLengthRule(100, '任务名称'),
  noSpaceValidator('任务名称')
]

/** 备忘录分类验证规则 */
export const memoLabelRule = [
  { required: true, message: '请选择或输入分类', trigger: TRIGGER_BLUR },
  createMaxLengthRule(20, '分类'),
  noSpaceValidator('分类')
]

/** 备忘录详细说明验证规则（允许空格） */
export const memoContentRule = [
  { required: true, message: '请输入详细说明', trigger: TRIGGER_BLUR },
  createMaxLengthRule(2000, '详细说明')
]

/** 空格验证器别名导出 */
export const noWhitespaceValidator = (label = '该字段') => noSpaceValidator(label)
