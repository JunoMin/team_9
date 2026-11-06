import { isComplete, searchSteps, selectedChoice } from '../config/searchSteps.ts'
import type { Land, SearchCriteria } from '../types/land.ts'

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
