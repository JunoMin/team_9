import {
  M2_PER_PYEONG,
  isComplete,
  searchSteps,
  selectedChoice,
  toPyeong,
} from '../config/searchSteps.ts'
import type { Land, SearchCriteria } from '../types/land.ts'

export type SortOrder = 'price' | 'area' | 'unitPrice'

const matches = (selected: string[], value: string) =>
  selected.includes('any') || selected.includes(value)

export function searchLands(lands: readonly Land[], criteria: SearchCriteria): Land[] {
  if (!isComplete(criteria)) return []
  const budget = selectedChoice(criteria, searchSteps[2])!
  const area = selectedChoice(criteria, searchSteps[3])!

  return lands
    .filter(
      (land) =>
        matches(criteria.region, land.region) &&
        matches(criteria.purpose, land.purpose) &&
        (budget.max === undefined || land.priceWon <= budget.max) &&
        (area.min === undefined || land.areaM2 >= area.min) &&
        (area.max === undefined || land.areaM2 <= area.max),
    )
    .sort((a, b) => a.priceWon - b.priceWon || a.id.localeCompare(b.id))
}

export interface EmptyDiagnosis {
  // 선택한 지역·용도에 판매 중인 필지 수. 0이면 지역·용도 조합 자체에 토지가 없습니다.
  poolCount: number
  priceWon?: { min: number; max: number }
  areaM2?: { min: number; max: number }
  // 예산·면적을 하나씩만 적용했을 때 남는 필지 수. 'any'를 고른 조건은 null입니다.
  budgetOnly: { label: string; count: number } | null
  areaOnly: { label: string; count: number } | null
  // 고른 면적 범위 안에서 가장 싼 필지와, 고른 예산 안에서 가장 넓은 필지. 예산·면적을 어디까지 바꿔야 하는지 알려 줍니다.
  cheapestInArea?: Land
  largestInBudget?: Land
}

// 결과가 0개일 때 어떤 조건 때문에 비었는지 설명할 숫자를 모읍니다.
export function diagnoseEmpty(lands: readonly Land[], criteria: SearchCriteria): EmptyDiagnosis {
  const budget = selectedChoice(criteria, searchSteps[2])
  const area = selectedChoice(criteria, searchSteps[3])
  const pool = lands.filter(
    (land) => matches(criteria.region, land.region) && matches(criteria.purpose, land.purpose),
  )
  const inBudget = (land: Land) => budget?.max === undefined || land.priceWon <= budget.max
  const inArea = (land: Land) =>
    (area?.min === undefined || land.areaM2 >= area.min) &&
    (area?.max === undefined || land.areaM2 <= area.max)
  const byBudget = pool.filter(inBudget)
  const byArea = pool.filter(inArea)
  const range = (values: number[]) => ({ min: Math.min(...values), max: Math.max(...values) })
  const constrained = (choice: typeof budget, bounded: boolean) =>
    choice && bounded ? choice : null

  return {
    poolCount: pool.length,
    priceWon: pool.length ? range(pool.map((land) => land.priceWon)) : undefined,
    areaM2: pool.length ? range(pool.map((land) => land.areaM2)) : undefined,
    budgetOnly: constrained(budget, budget?.max !== undefined)
      ? { label: budget!.label, count: byBudget.length }
      : null,
    areaOnly: constrained(area, area?.min !== undefined || area?.max !== undefined)
      ? { label: area!.label, count: byArea.length }
      : null,
    cheapestInArea: [...byArea].sort((a, b) => a.priceWon - b.priceWon)[0],
    largestInBudget: [...byBudget].sort((a, b) => b.areaM2 - a.areaM2)[0],
  }
}

export function pricePerM2(land: Land): number {
  return Math.round(land.priceWon / land.areaM2)
}

export function pricePerPyeong(land: Land): number {
  return Math.round((land.priceWon / land.areaM2) * M2_PER_PYEONG)
}

export function areaPyeong(land: Land): number {
  return Math.round(toPyeong(land.areaM2) * 10) / 10
}

// 원본 용도명(예: '자족시설')에 들어 있는 단어로 한 번 더 거릅니다.
export function filterByUse(lands: readonly Land[], keyword: string): Land[] {
  const word = keyword.trim()
  return word ? lands.filter((land) => (land.useName ?? '').includes(word)) : [...lands]
}

// 결과에 나온 원본 용도명과 필지 수. 많은 순입니다.
export function useNameCounts(lands: readonly Land[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const land of lands) {
    if (land.useName) counts.set(land.useName, (counts.get(land.useName) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

// 평당가와 ㎡당 가격은 순서가 같으므로 하나의 정렬 기준으로 씁니다.
const sortKeys: Record<SortOrder, (land: Land) => number> = {
  price: (land) => land.priceWon,
  area: (land) => land.areaM2,
  unitPrice: (land) => land.priceWon / land.areaM2,
}

export function sortLands(lands: readonly Land[], order: SortOrder): Land[] {
  const key = sortKeys[order]
  return [...lands].sort((a, b) => key(a) - key(b) || a.id.localeCompare(b.id))
}

export function formatPrice(priceWon: number): string {
  const hundredMillion = Math.floor(priceWon / 100_000_000)
  const tenThousand = Math.floor((priceWon % 100_000_000) / 10_000)
  const remainder = priceWon % 10_000
  const parts = [
    hundredMillion ? `${hundredMillion.toLocaleString('ko-KR')}억` : '',
    tenThousand ? `${tenThousand.toLocaleString('ko-KR')}만` : '',
    remainder ? remainder.toLocaleString('ko-KR') : '',
  ].filter(Boolean)
  return `${parts.join(' ') || '0'} 원`
}

export function labelFor(key: 'region' | 'purpose', id: string): string {
  return (
    searchSteps.find((step) => step.key === key)?.choices.find((choice) => choice.id === id)
      ?.label ?? id
  )
}

const csvColumns: [header: string, value: (land: Land) => string | number][] = [
  ['공고명', (land) => land.noticeName ?? ''],
  ['지구명', (land) => land.districtName ?? ''],
  ['시도', (land) => land.regionName ?? ''],
  ['소재지', (land) => land.address ?? land.name],
  ['지번', (land) => land.lotNo ?? ''],
  ['용도', (land) => land.useName ?? labelFor('purpose', land.purpose)],
  ['공급방식', (land) => land.saleMethod ?? ''],
  ['면적(㎡)', (land) => land.areaM2],
  ['면적(평)', areaPyeong],
  ['공급가격(원)', (land) => land.priceWon],
  ['㎡당 가격(원)', pricePerM2],
  ['평당가(원)', pricePerPyeong],
  ['공고 상태', (land) => land.status ?? ''],
  ['공고일', (land) => land.postedOn ?? ''],
  ['마감일', (land) => land.closesOn ?? ''],
  ['용도지역', (land) => land.suui?.zoning ?? ''],
  ['건폐율(%)', (land) => land.suui?.buildingCoverage ?? ''],
  ['용적률(%)', (land) => land.suui?.floorAreaRatio ?? ''],
  ['납부방식', (land) => suuiPayment(land)],
  ['문의 전화', (land) => land.contactPhone ?? ''],
  ['공고 링크', (land) => land.detailUrl ?? ''],
]

export function suuiPayment(land: Land): string {
  const { paymentMethod, paymentMonths } = land.suui ?? {}
  if (!paymentMethod) return ''
  return paymentMonths ? `${paymentMethod} ${paymentMonths}개월` : paymentMethod
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

// 엑셀에서 한글이 깨지지 않도록 앞에 BOM을 붙입니다.
export function toCsv(lands: readonly Land[]): string {
  const rows = [
    csvColumns.map(([header]) => header),
    ...lands.map((land) => csvColumns.map(([, value]) => value(land))),
  ]
  return '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}
