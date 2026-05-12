import type { FormItemRule } from 'element-plus'

const TRIGGER_BLUR_CHANGE: string[] = ['blur', 'change']
const TRIGGER_BLUR: string = 'blur'

export const noSpaceRawValidator = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value && !value.trim()) callback(new Error('不能只包含空格'))
  else callback()
}

export const noWhitespaceRawValidator = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value && value.trim() !== value) callback(new Error('不能有前后空格'))
  else callback()
}

export const noWhitespaceValidator = (_label: string = '该字段'): FormItemRule => ({
  validator: noWhitespaceRawValidator,
  trigger: TRIGGER_BLUR_CHANGE
})

export const noSpaceValidator = (_label: string = '该字段'): FormItemRule => ({
  validator: noSpaceRawValidator,
  trigger: TRIGGER_BLUR_CHANGE
})

export const createRequiredRule = (label: string = '该字段'): FormItemRule => ({
  required: true,
  message: `请输入${label}`,
  trigger: TRIGGER_BLUR_CHANGE
})

export const createMaxLengthRule = (max: number, label: string = '该字段'): FormItemRule => ({
  max,
  message: `${label}不能超过${max}个字符`,
  trigger: TRIGGER_BLUR_CHANGE
})

export const createMinLengthRule = (min: number, label: string = '该字段'): FormItemRule => ({
  min,
  message: `${label}不能少于${min}个字符`,
  trigger: TRIGGER_BLUR_CHANGE
})

export const quotationNameRule: FormItemRule[] = [
  createRequiredRule('报价单名称'),
  createMaxLengthRule(100, '报价单名称'),
  noWhitespaceValidator('报价单名称')
]

export const companyNameRule: FormItemRule[] = [
  createRequiredRule('公司名称'),
  createMaxLengthRule(100, '公司名称'),
  noWhitespaceValidator('公司名称')
]

export const beamNameRule: FormItemRule[] = [
  createRequiredRule('横梁名称'),
  { ...createMaxLengthRule(50, '横梁名称'), trigger: TRIGGER_BLUR_CHANGE },
  noSpaceValidator('横梁名称')
]

export const recordNameRule: FormItemRule[] = [
  createRequiredRule('记录名称'),
  createMaxLengthRule(100, '记录名称'),
  noSpaceValidator('记录名称')
]

export const positiveDecimalRule = (label: string = '该字段'): FormItemRule[] => [
  createRequiredRule(label),
  noSpaceValidator(label)
]

export const memoTitleRule: FormItemRule[] = [
  { required: true, message: '请输入任务名称', trigger: TRIGGER_BLUR },
  createMaxLengthRule(100, '任务名称'),
  noSpaceValidator('任务名称')
]

export const memoLabelRule: FormItemRule[] = [
  { required: true, message: '请选择或输入分类', trigger: TRIGGER_BLUR },
  createMaxLengthRule(20, '分类'),
  noSpaceValidator('分类')
]

export const memoContentRule: FormItemRule[] = [
  { required: true, message: '请输入详细说明', trigger: TRIGGER_BLUR },
  createMaxLengthRule(2000, '详细说明')
]
