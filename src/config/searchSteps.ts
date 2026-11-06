import { lhLands } from '../data/lhLands.generated.ts'
import { lhRegionIds } from '../data/lhMapping.ts'
import type { Choice, SearchCriteria, SearchStep } from '../types/land.ts'

export const emptyCriteria: SearchCriteria = {
  region: null,
  purpose: null,
  budget: null,
  area: null,
}

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
  { id: 'neighborhood', label: '근린생활시설용지', description: '생활 편의시설을 위한 땅' },
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
    title: '어느 지역의 땅을 찾으세요?',
    description: 'LH가 지금 판매 중인 토지가 있는 시도입니다.',
    choices: [
      ...regionChoices,
      { id: 'any', label: '전체 지역', description: '전국을 둘러볼게요' },
    ],
  },
  {
    key: 'purpose',
    label: '용도',
    title: '어떤 용도의 땅이 필요하세요?',
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
    description: '원하는 면적 범위를 선택해 주세요.',
    choices: [
      {
        id: 'upto-330',
        label: '330㎡ 이하',
        description: '약 100평 이하 · 단독주택 택지 규모',
        max: 330,
      },
      { id: '330-660', label: '330–660㎡', description: '약 100–200평', min: 330, max: 660 },
      { id: '660-1650', label: '660–1,650㎡', description: '약 200–500평', min: 660, max: 1650 },
      {
        id: 'over-1650',
        label: '1,650㎡ 이상',
        description: '약 500평 이상 · 상업·산업 용지 규모',
        min: 1650,
      },
      { id: 'any', label: '면적 무관', description: '넓이에 제한 없이 볼게요' },
    ],
  },
]

export function selectedChoice(criteria: SearchCriteria, step: SearchStep) {
  return step.choices.find((choice) => choice.id === criteria[step.key])
}

export function isComplete(criteria: SearchCriteria) {
  return searchSteps.every((step) => selectedChoice(criteria, step) !== undefined)
}
