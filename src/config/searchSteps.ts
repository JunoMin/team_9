import { lhLands } from '../data/lhLands.generated.ts'
import { lhRegionIds } from '../data/lhMapping.ts'
import type { Choice, SearchCriteria, SearchStep } from '../types/land.ts'

export const emptyCriteria: SearchCriteria = {
  region: [],
  purpose: [],
  budget: [],
  area: [],
}

export const M2_PER_PYEONG = 3.305785

export function toPyeong(areaM2: number) {
  return areaM2 / M2_PER_PYEONG
}

const pyeong = (value: number) => Math.round(value * M2_PER_PYEONG * 100) / 100

function countBy(key: 'region' | 'purpose') {
  const counts = new Map<string, number>()
  for (const land of lhLands) counts.set(land[key], (counts.get(land[key]) ?? 0) + 1)
  return counts
}

const regionCounts = countBy('region')
const purposeCounts = countBy('purpose')

// 지역은 판매 중 필지가 있는 시도만 많은 순으로 보여 줍니다.
const regionChoices: Choice[] = Object.entries(lhRegionIds)
  .filter(([, id]) => regionCounts.has(id))
  .sort(([, a], [, b]) => regionCounts.get(b)! - regionCounts.get(a)!)
  .map(([name, id]) => ({
    id,
    label: name,
    description: `판매 중 ${regionCounts.get(id)!.toLocaleString('ko-KR')}필지`,
  }))

// id는 src/data/lhMapping.ts의 용도 묶음과 같아야 합니다.
const purposeChoices: Choice[] = [
  { id: 'detached', label: '단독주택용지', description: '주거전용 택지' },
  {
    id: 'detached-shop',
    label: '점포겸용 단독주택용지',
    description: '1층 상가를 둘 수 있는 택지',
  },
  { id: 'neighborhood', label: '근린생활시설용지', description: '생활 편의시설을 위한 토지' },
  { id: 'commercial', label: '상업용지', description: '일반·근린·중심상업용지' },
  { id: 'industrial', label: '산업·공장용지', description: '산업단지 공장 용지' },
  { id: 'other', label: '기타 용지', description: '주차장·업무·종교시설 등' },
].map((choice) => ({
  ...choice,
  description: `${choice.description} · ${(purposeCounts.get(choice.id) ?? 0).toLocaleString('ko-KR')}필지`,
}))

// 화면 선택지와 필터 기준을 한곳에서 관리합니다.
export const searchSteps: SearchStep[] = [
  {
    key: 'region',
    label: '지역',
    title: '어느 지역의 토지를 찾으세요?',
    description: '관심 있는 시도를 모두 골라 주세요. 여러 곳을 함께 볼 수 있어요.',
    multiple: true,
    choices: [
      ...regionChoices,
      { id: 'any', label: '전국', description: '지역을 가리지 않고 볼게요' },
    ],
  },
  {
    key: 'purpose',
    label: '용도',
    title: '어떤 용도의 토지가 필요하세요?',
    description: '찾으시는 공급 용도를 골라 주세요.',
    choices: [
      ...purposeChoices,
      { id: 'any', label: '용도 무관', description: '여러 용도를 둘러볼게요' },
    ],
  },
  {
    key: 'budget',
    label: '예산',
    title: '생각하신 예산은 얼마인가요?',
    description: '토지 전체 가격(입찰은 예정가격)의 상한을 선택해 주세요.',
    choices: [
      {
        id: 'under-300m',
        label: '3억 원 이하',
        description: '최대 300,000,000원',
        max: 300_000_000,
      },
      {
        id: 'under-500m',
        label: '5억 원 이하',
        description: '최대 500,000,000원',
        max: 500_000_000,
      },
      {
        id: 'under-1b',
        label: '10억 원 이하',
        description: '최대 1,000,000,000원',
        max: 1_000_000_000,
      },
      {
        id: 'under-3b',
        label: '30억 원 이하',
        description: '최대 3,000,000,000원',
        max: 3_000_000_000,
      },
      { id: 'any', label: '예산 무관', description: '가격 제한 없이 볼게요' },
    ],
  },
  {
    key: 'area',
    label: '면적',
    title: '어느 정도 넓이면 좋을까요?',
    description: '원하는 면적 범위를 평 단위로 선택해 주세요.',
    choices: [
      {
        id: 'upto-100py',
        label: '100평 이하',
        description: '약 330㎡ 이하 · 단독주택 택지 규모',
        max: pyeong(100),
      },
      {
        id: '100-200py',
        label: '100–200평',
        description: '약 330–660㎡',
        min: pyeong(100),
        max: pyeong(200),
      },
      {
        id: '200-500py',
        label: '200–500평',
        description: '약 660–1,650㎡',
        min: pyeong(200),
        max: pyeong(500),
      },
      {
        id: 'over-500py',
        label: '500평 이상',
        description: '약 1,650㎡ 이상 · 상업·산업 용지 규모',
        min: pyeong(500),
      },
      { id: 'any', label: '면적 무관', description: '넓이에 제한 없이 볼게요' },
    ],
  },
]

export function selectedChoices(criteria: SearchCriteria, step: SearchStep) {
  return step.choices.filter((choice) => criteria[step.key].includes(choice.id))
}

// 한 개만 고르는 단계(예산·면적)의 선택지입니다.
export function selectedChoice(criteria: SearchCriteria, step: SearchStep) {
  return selectedChoices(criteria, step)[0]
}

export function isStepDone(criteria: SearchCriteria, step: SearchStep) {
  return selectedChoices(criteria, step).length > 0
}

export function isComplete(criteria: SearchCriteria) {
  return searchSteps.every((step) => isStepDone(criteria, step))
}

// 선택지를 눌렀을 때의 다음 선택 상태. 여러 개 고르는 단계에서 '전국'(any)은 다른 선택과 함께 쓰지 않습니다.
export function toggleChoice(selected: string[], id: string, multiple = false): string[] {
  if (!multiple || id === 'any') return [id]
  const rest = selected.filter((value) => value !== 'any')
  return rest.includes(id) ? rest.filter((value) => value !== id) : [...rest, id]
}

export function summaryLabel(criteria: SearchCriteria, step: SearchStep) {
  const labels = selectedChoices(criteria, step).map((choice) => choice.label)
  return labels.length > 2 ? `${labels[0]} 외 ${labels.length - 1}곳` : labels.join(', ')
}
