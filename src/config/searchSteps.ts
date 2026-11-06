import type { SearchCriteria, SearchStep } from '../types/land.ts'

export const emptyCriteria: SearchCriteria = {
  region: null,
  purpose: null,
  budget: null,
  area: null,
}

// 화면 선택지와 필터 기준을 한곳에서 관리합니다. 실제 데이터의 코드 체계는 연동 시 매핑합니다.
export const searchSteps: SearchStep[] = [
  {
    key: 'region',
    label: '지역',
    title: '어느 지역의 땅을 찾으세요?',
    description: '관심 있는 지역 한 곳을 선택해 주세요.',
    choices: [
      { id: 'pyeongtaek', label: '평택시', description: '경기도 평택' },
      { id: 'anseong', label: '안성시', description: '경기도 안성' },
      { id: 'osan', label: '오산시', description: '경기도 오산' },
      { id: 'any', label: '전체 지역', description: '지역을 넓게 둘러볼게요' },
    ],
  },
  {
    key: 'purpose',
    label: '용도',
    title: '어떤 용도의 땅이 필요하세요?',
    description: '찾으시는 공급 용도를 골라 주세요.',
    choices: [
      { id: 'detached', label: '단독주택용지', description: '단독주택을 위한 땅' },
      { id: 'neighborhood', label: '근린생활시설용지', description: '생활 편의시설을 위한 땅' },
      { id: 'commercial', label: '상업용지', description: '상업시설을 위한 땅' },
      { id: 'any', label: '용도 무관', description: '여러 용도를 둘러볼게요' },
    ],
  },
  {
    key: 'budget',
    label: '예산',
    title: '생각하신 예산은 얼마인가요?',
    description: '토지 전체 가격의 상한을 선택해 주세요.',
    choices: [
      {
        id: 'under-100m',
        label: '1억 원 이하',
        description: '최대 100,000,000원',
        max: 100_000_000,
      },
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
      { id: 'any', label: '예산 무관', description: '가격 제한 없이 볼게요' },
    ],
  },
  {
    key: 'area',
    label: '면적',
    title: '어느 정도 넓이면 좋을까요?',
    description: '원하는 면적과 가까운 범위를 선택해 주세요.',
    choices: [
      {
        id: 'around-200',
        label: '200㎡ 안팎',
        description: '180–220㎡ · 약 54–67평',
        min: 180,
        max: 220,
      },
      {
        id: 'around-300',
        label: '300㎡ 안팎',
        description: '270–330㎡ · 약 82–100평',
        min: 270,
        max: 330,
      },
      {
        id: 'around-500',
        label: '500㎡ 안팎',
        description: '450–550㎡ · 약 136–166평',
        min: 450,
        max: 550,
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
