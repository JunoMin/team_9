import type { Land } from '../types/land.ts'

// UI 개발 전용 가상 데이터입니다. 실제 공급 토지, 공고, 가격을 나타내지 않습니다.
export const demoLands: Land[] = [
  {
    id: 'demo-a',
    name: '샘플 토지 A',
    region: 'pyeongtaek',
    purpose: 'detached',
    areaM2: 285,
    priceWon: 230_000_000,
  },
  {
    id: 'demo-b',
    name: '샘플 토지 B',
    region: 'pyeongtaek',
    purpose: 'detached',
    areaM2: 300,
    priceWon: 270_000_000,
  },
  {
    id: 'demo-c',
    name: '샘플 토지 C',
    region: 'pyeongtaek',
    purpose: 'detached',
    areaM2: 325,
    priceWon: 300_000_000,
  },
  {
    id: 'demo-d',
    name: '샘플 토지 D',
    region: 'anseong',
    purpose: 'detached',
    areaM2: 200,
    priceWon: 90_000_000,
  },
  {
    id: 'demo-e',
    name: '샘플 토지 E',
    region: 'anseong',
    purpose: 'neighborhood',
    areaM2: 500,
    priceWon: 420_000_000,
  },
  {
    id: 'demo-f',
    name: '샘플 토지 F',
    region: 'osan',
    purpose: 'commercial',
    areaM2: 480,
    priceWon: 490_000_000,
  },
  {
    id: 'demo-g',
    name: '샘플 토지 G',
    region: 'osan',
    purpose: 'detached',
    areaM2: 310,
    priceWon: 350_000_000,
  },
  {
    id: 'demo-h',
    name: '샘플 토지 H',
    region: 'pyeongtaek',
    purpose: 'neighborhood',
    areaM2: 290,
    priceWon: 290_000_000,
  },
]
