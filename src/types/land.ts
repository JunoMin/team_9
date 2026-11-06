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
}
