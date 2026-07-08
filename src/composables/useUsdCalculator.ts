import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { toNum, ceil, fixed2, normalizeRate, rmbToUsdCeil } from '@/utils/number'

interface UsdTableRow {
  quantity: string
  unitPriceRmb: string
  unitPriceUsd: string
  subTotal: number
}

interface UsdCalculatorReturn {
  globalExchangeRate: Ref<string>
  manualTotalRmbBase: Ref<string>
  globalDomesticRmb: Ref<string>
  globalDomesticUsd: Ref<string>
  globalIntlRmb: Ref<string>
  globalIntlUsd: Ref<string>
  tableData: Ref<UsdTableRow[]>
  defaultRow: () => UsdTableRow
  handleDomesticRmbChange: () => void
  handleDomesticUsdChange: () => void
  handleIntlRmbChange: () => void
  handleIntlUsdChange: () => void
  calculateTotals: (row: UsdTableRow) => void
  calculateRow: (row: UsdTableRow) => void
  handleRateChange: () => void
  productsTotalUsd: ComputedRef<number>
  grandTotalUsd: ComputedRef<number>
  grandTotalRmb: ComputedRef<string>
  diffRmb: ComputedRef<string>
}

export const useUsdCalculator = (): UsdCalculatorReturn => {

  const globalExchangeRate = ref('6.8')

  const manualTotalRmbBase = ref('')

  const globalDomesticRmb = ref('')
  const globalDomesticUsd = ref('')
  const globalIntlRmb = ref('')
  const globalIntlUsd = ref('')

  const tableData = ref<UsdTableRow[]>([])

  const defaultRow = (): UsdTableRow => ({
    quantity: '',
    unitPriceRmb: '',
    unitPriceUsd: '',
    subTotal: 0
  })

  const handleDomesticRmbChange = (): void => {
    const rate = normalizeRate(globalExchangeRate.value)
    const rmb = toNum(globalDomesticRmb.value)
    globalDomesticUsd.value = rmb ? rmbToUsdCeil(rmb, rate).toString() : ''
  }

  const handleDomesticUsdChange = (): void => {
    const rate = normalizeRate(globalExchangeRate.value)
    const usd = toNum(globalDomesticUsd.value)
    globalDomesticRmb.value = usd ? ceil(usd * rate).toString() : ''
  }

  const handleIntlRmbChange = (): void => {
    const rate = normalizeRate(globalExchangeRate.value)
    const rmb = toNum(globalIntlRmb.value)
    globalIntlUsd.value = rmb ? rmbToUsdCeil(rmb, rate).toString() : ''
  }

  const handleIntlUsdChange = (): void => {
    const rate = normalizeRate(globalExchangeRate.value)
    const usd = toNum(globalIntlUsd.value)
    globalIntlRmb.value = usd ? ceil(usd * rate).toString() : ''
  }

  const calculateTotals = (row: UsdTableRow): void => {
    row.subTotal = fixed2(toNum(row.quantity) * toNum(row.unitPriceUsd))
  }

  const calculateRow = (row: UsdTableRow): void => {
    const rate = normalizeRate(globalExchangeRate.value)
    const rmb = toNum(row.unitPriceRmb)

    row.unitPriceUsd = rmb ? rmbToUsdCeil(rmb, rate).toString() : ''
    calculateTotals(row)
  }

  const handleRateChange = (): void => {
    handleDomesticRmbChange()
    handleIntlRmbChange()
    tableData.value.forEach(calculateRow)
  }

  const productsTotalUsd = computed(() =>
    fixed2(tableData.value.reduce((s, r) => s + toNum(r.subTotal), 0))
  )

  const grandTotalUsd = computed(() =>
    fixed2(
      productsTotalUsd.value +
      toNum(globalDomesticUsd.value) +
      toNum(globalIntlUsd.value)
    )
  )

  const grandTotalRmb = computed(() => {
    const rate = normalizeRate(globalExchangeRate.value)
    return (grandTotalUsd.value * rate).toFixed(2)
  })

  const diffRmb = computed(() => {
    return (
      parseFloat(grandTotalRmb.value) -
      toNum(manualTotalRmbBase.value)
    ).toFixed(2)
  })

  return {
    globalExchangeRate,
    manualTotalRmbBase,
    globalDomesticRmb,
    globalDomesticUsd,
    globalIntlRmb,
    globalIntlUsd,
    tableData,
    defaultRow,

    handleDomesticRmbChange,
    handleDomesticUsdChange,
    handleIntlRmbChange,
    handleIntlUsdChange,

    calculateTotals,
    calculateRow,
    handleRateChange,

    productsTotalUsd,
    grandTotalUsd,
    grandTotalRmb,
    diffRmb
  }
}