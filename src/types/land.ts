export type StepKey = 'region' | 'purpose' | 'budget' | 'area'

// 단계마다 고른 선택지 id 목록입니다. 여러 개를 고를 수 있는 단계(multiple)만 2개 이상이 됩니다.
export type SearchCriteria = Record<StepKey, string[]>

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
  multiple?: boolean
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
  suui?: SuuiDetail
}

// 선착순 수의계약 목록에만 있는 정보입니다. 공고 필지의 규제·납부 조건은 공고문에서 확인합니다.
export interface SuuiDetail {
  zoning?: string
  buildingCoverage?: number
  floorAreaRatio?: number
  paymentMethod?: string
  paymentMonths?: number
  usableFrom?: string
  brokerAllowed: boolean
}

export type LandSource = 'lh-notice' | 'lh-suui'

// 입찰은 예정가격, 추첨·수의계약은 공급가격을 priceWon으로 씁니다.
export type SaleMethod = '입찰' | '추첨' | '수의계약'
