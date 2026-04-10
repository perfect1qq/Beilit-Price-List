import { ref, computed } from 'vue'
import { toNum, ceil, fixed2, normalizeRate, rmbToUsdCeil } from '@/utils/number'

export function useUsdCalculator() {

  const globalExchangeRate = ref('6.8') //全局汇率默认值

  const manualTotalRmbBase = ref('')

  const globalDomesticRmb = ref('')
  const globalDomesticUsd = ref('')
  const globalIntlRmb = ref('')
  const globalIntlUsd = ref('')

  const tableData = ref([])

  const defaultRow = () => ({
    quantity: '',
    unitPriceRmb: '',
    unitPriceUsd: '',
    subTotal: 0
  })

  // ===== 运费 =====
  const handleDomesticRmbChange = () => {
    const rate = normalizeRate(globalExchangeRate.value)
    const rmb = toNum(globalDomesticRmb.value)
    globalDomesticUsd.value = rmb ? rmbToUsdCeil(rmb, rate).toString() : ''
  }

  const handleDomesticUsdChange = () => {
    const rate = normalizeRate(globalExchangeRate.value)
    const usd = toNum(globalDomesticUsd.value)
    globalDomesticRmb.value = usd ? ceil(usd * rate).toString() : ''
  }

  const handleIntlRmbChange = () => {
    const rate = normalizeRate(globalExchangeRate.value)
    const rmb = toNum(globalIntlRmb.value)
    globalIntlUsd.value = rmb ? rmbToUsdCeil(rmb, rate).toString() : ''
  }

  const handleIntlUsdChange = () => {
    const rate = normalizeRate(globalExchangeRate.value)
    const usd = toNum(globalIntlUsd.value)
    globalIntlRmb.value = usd ? ceil(usd * rate).toString() : ''
  }

  // ===== 行计算 =====
  const calculateTotals = (row) => {
    row.subTotal = fixed2(toNum(row.quantity) * toNum(row.unitPriceUsd))
  }

  const calculateRow = (row) => {
    const rate = normalizeRate(globalExchangeRate.value)
    const rmb = toNum(row.unitPriceRmb)

    row.unitPriceUsd = rmb ? rmbToUsdCeil(rmb, rate).toString() : ''
    calculateTotals(row)
  }

  const handleRateChange = () => {
    handleDomesticRmbChange()
    handleIntlRmbChange()
    tableData.value.forEach(calculateRow)
  }

  // ===== 汇总 =====
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