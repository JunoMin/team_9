export type StepKey = 'region' | 'purpose' | 'budget' | 'area'

export type SearchCriteria = Record<StepKey, string | null>

export interface Choice {
  id: string
  label: string
  description: string
  min?: number
  max?: number
}

export interface SearchStep {
  key: StepKey
  label: string
  title: string
  description: string
  choices: Choice[]
}

export interface Land {
  id: string
  name: string
  region: string
  purpose: string
  areaM2: number
  priceWon: number
  // 아래는 실제 LH 데이터에만 있는 선택 필드입니다. 예시 데이터에는 없습니다.
  source?: LandSource
  regionName?: string
  useName?: string
  address?: string
  lotNo?: string
  status?: string
  saleMethod?: SaleMethod
  noticeId?: string
  noticeName?: string
  districtName?: string
  postedOn?: string
  closesOn?: string
  detailUrl?: string
  contactPhone?: string
}

export type LandSource = 'lh-notice' | 'lh-suui'

// 입찰은 예정가격, 추첨·수의계약은 공급가격을 priceWon으로 씁니다.
export type SaleMethod = '입찰' | '추첨' | '수의계약'
