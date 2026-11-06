import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyCriteria } from '../src/config/searchSteps.ts'
import { demoLands } from '../src/data/demoLands.ts'
import { formatPrice, searchLands } from '../src/lib/search.ts'
import type { Land, SearchCriteria } from '../src/types/land.ts'

const criteria: SearchCriteria = {
  region: 'pyeongtaek',
  purpose: 'detached',
  budget: 'under-300m',
  area: 'around-300',
}

test('평택·단독주택·3억 이하·300㎡ 안팎은 A, B, C만 반환한다', () => {
  assert.deepEqual(
    searchLands(demoLands, criteria).map((land) => land.id),
    ['demo-a', 'demo-b', 'demo-c'],
  )
})

test('가격 상한과 면적 양 끝값을 포함하고 범위 밖은 제외한다', () => {
  const base: Land = { ...demoLands[0], priceWon: 300_000_000 }
  const lands: Land[] = [
    { ...base, id: 'lower', areaM2: 270 },
    { ...base, id: 'upper', areaM2: 330 },
    { ...base, id: 'too-small', areaM2: 269.99 },
    { ...base, id: 'too-large', areaM2: 330.01 },
    { ...base, id: 'too-expensive', areaM2: 300, priceWon: 300_000_001 },
  ]
  assert.deepEqual(
    searchLands(lands, criteria).map((land) => land.id),
    ['lower', 'upper'],
  )
})

test('미완성 조건과 잘못된 선택값으로 검색하지 않는다', () => {
  assert.deepEqual(searchLands(demoLands, emptyCriteria), [])
  assert.deepEqual(searchLands(demoLands, { ...criteria, area: 'unknown' }), [])
})

test('일치하는 데이터가 없으면 빈 목록을 반환한다', () => {
  assert.deepEqual(searchLands(demoLands, { ...criteria, budget: 'under-100m' }), [])
})

test('무관 조건은 전체를 가격 오름차순으로 반환하고 원본은 변경하지 않는다', () => {
  const before = structuredClone(demoLands)
  const all = searchLands(demoLands, { region: 'any', purpose: 'any', budget: 'any', area: 'any' })
  assert.equal(all.length, demoLands.length)
  assert.equal(all[0].id, 'demo-d')
  assert.ok(all.every((land, index) => index === 0 || all[index - 1].priceWon <= land.priceWon))
  assert.deepEqual(demoLands, before)
})

test('원화 가격을 손실 없이 읽기 쉬운 단위로 표시한다', () => {
  assert.equal(formatPrice(230_000_000), '2억 3,000만 원')
  assert.equal(formatPrice(300_000_000), '3억 원')
  assert.equal(formatPrice(90_000_000), '9,000만 원')
  assert.equal(formatPrice(10_001), '1만 1 원')
  assert.equal(formatPrice(0), '0 원')
})
