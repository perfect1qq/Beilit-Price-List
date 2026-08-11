import { formatDateOnly } from '@/utils/date'

export interface CompanyGroup<T> {
  companyName: string
  count: number
  latestDate: string
  latestTime: string
  records: T[]
}

export interface YearGroup<T> {
  year: number
  count: number
  latestDate: string
  companyGroups: CompanyGroup<T>[]
}

const toDateValue = (record: any): number => {
  const value = record.createdAt || record.updatedAt || ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

export const groupByCompany = <T>(records: T[] = [], getCompanyName: (r: T) => string): CompanyGroup<T>[] => {
  const map = new Map<string, CompanyGroup<T>>()

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    const companyName = getCompanyName(record) || '未命名公司'
    let group = map.get(companyName)
    if (!group) {
      group = { companyName, count: 0, latestDate: '', latestTime: '', records: [] }
      map.set(companyName, group)
    }
    group.records.push(record)
  }

  const groups: CompanyGroup<T>[] = []
  for (const group of map.values()) {
    const recordsSorted = group.records.sort((a, b) => toDateValue(b) - toDateValue(a))
    const firstDateStr = (recordsSorted[0] as any)?.createdAt || (recordsSorted[0] as any)?.updatedAt || ''
    groups.push({
      companyName: group.companyName,
      count: recordsSorted.length,
      latestDate: formatDateOnly(firstDateStr),
      latestTime: firstDateStr,
      records: recordsSorted
    })
  }
  
  return groups
}

export const groupByYearAndCompany = <T>(records: T[] = [], getCompanyName: (r: T) => string): YearGroup<T>[] => {
  const yearMap = new Map<number, T[]>()

  for (const record of records) {
    const date = new Date((record as any).createdAt || (record as any).updatedAt || '')
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear()
      if (!yearMap.has(year)) yearMap.set(year, [])
      yearMap.get(year)!.push(record)
    }
  }

  const yearGroups: YearGroup<T>[] = []

  for (const [year, yearRecords] of yearMap) {
    const companyGroups = groupByCompany(yearRecords, getCompanyName)
    const totalRecords = companyGroups.reduce((sum, g) => sum + g.count, 0)

    let latestDate = ''
    for (const cg of companyGroups) {
      if (!latestDate || cg.latestTime > latestDate) {
        latestDate = cg.latestDate
      }
    }

    yearGroups.push({
      year,
      count: totalRecords,
      latestDate,
      companyGroups,
    })
  }

  yearGroups.sort((a, b) => b.year - a.year)

  return yearGroups
}
