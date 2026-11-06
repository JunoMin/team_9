import { isComplete, searchSteps, selectedChoice } from '../config/searchSteps.ts'
import type { Land, SearchCriteria } from '../types/land.ts'

export type SortOrder = 'price' | 'area' | 'pricePerM2'

export function searchLands(lands: readonly Land[], criteria: SearchCriteria): Land[] {
  if (!isComplete(criteria)) return []
  const budget = selectedChoice(criteria, searchSteps[2])!
  const area = selectedChoice(criteria, searchSteps[3])!

  return lands
    .filter(
      (land) =>
        (criteria.region === 'any' || land.region === criteria.region) &&
        (criteria.purpose === 'any' || land.purpose === criteria.purpose) &&
        (budget.max === undefined || land.priceWon <= budget.max) &&
        (area.min === undefined || land.areaM2 >= area.min) &&
        (area.max === undefined || land.areaM2 <= area.max),
    )
    .sort((a, b) => a.priceWon - b.priceWon || a.id.localeCompare(b.id))
}

export function pricePerM2(land: Land): number {
  return Math.round(land.priceWon / land.areaM2)
}

const sortKeys: Record<SortOrder, (land: Land) => number> = {
  price: (land) => land.priceWon,
  area: (land) => land.areaM2,
  pricePerM2,
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
  ['공급가격(원)', (land) => land.priceWon],
  ['㎡당 가격(원)', pricePerM2],
  ['공고 상태', (land) => land.status ?? ''],
  ['공고일', (land) => land.postedOn ?? ''],
  ['마감일', (land) => land.closesOn ?? ''],
  ['공고 링크', (land) => land.detailUrl ?? ''],
]

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
