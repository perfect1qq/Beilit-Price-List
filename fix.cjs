
const fs = require('fs');
let content = fs.readFileSync('d:/work/Beilit-Price-List/src/views/ShelfMaterialWeight.vue', 'utf8');

const newFunc = \const SUMMARY_CALCULATORS: Record<string, (data: any[]) => string> = {
  '重量(kg/m)': (data) => {
    let total = 0
    data.forEach(row => {
      const val = parseFloat(calculateWeight(row))
      if (!isNaN(val)) total += val
    })
    return total.toFixed(1)
  },
  '总重量(kg)': (data) => {
    let total = 0
    data.forEach(row => {
      const val = parseFloat(calculateTotalWeight(row))
      if (!isNaN(val)) total += val
    })
    return total.toFixed(3)
  }
}

const getSummaries = (param: { columns: any[]; data: any[] }) => {
  const { columns, data } = param
  const sums: string[] = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    const calculator = SUMMARY_CALCULATORS[column.label]
    if (calculator) {
      sums[index] = calculator(data)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}\;

content = content.replace(/const getSummaries = \\(param: \\{ columns: any\\[\\]; data: any\\[\\] \\}\\) => \\{[\\s\\S]*?return sums\\r?\\n\\}/, newFunc);

fs.writeFileSync('d:/work/Beilit-Price-List/src/views/ShelfMaterialWeight.vue', content, 'utf8');

