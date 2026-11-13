import assert from 'node:assert/strict'
import test from 'node:test'
import {
  emptyCriteria,
  searchSteps,
  summaryLabel,
  toggleChoice,
} from '../src/config/searchSteps.ts'
import { lhLands } from '../src/data/lhLands.generated.ts'
import {
  areaPyeong,
  filterByUse,
  formatPrice,
  pricePerM2,
  pricePerPyeong,
  searchLands,
  sortLands,
  toCsv,
  useNameCounts,
} from '../src/lib/search.ts'
import type { Land, SearchCriteria } from '../src/types/land.ts'

const base: Land = {
  id: 'base',
  name: '테스트 필지',
  region: 'gyeonggi',
  purpose: 'detached',
  areaM2: 300,
  priceWon: 300_000_000,
}

const criteria: SearchCriteria = {
  region: ['gyeonggi'],
  purpose: ['detached'],
  budget: ['under-300m'],
  area: ['upto-100py'],
}

test('지역·용도·예산·면적 조건을 모두 만족하는 필지만 가격순으로 반환한다', () => {
  const lands: Land[] = [
    { ...base, id: 'b', priceWon: 280_000_000 },
    { ...base, id: 'a', priceWon: 250_000_000 },
    { ...base, id: 'other-region', region: 'chungnam' },
    { ...base, id: 'other-purpose', purpose: 'commercial' },
  ]
  assert.deepEqual(
    searchLands(lands, criteria).map((land) => land.id),
    ['a', 'b'],
  )
})

test('여러 지역을 고르면 그중 하나에 속한 필지를 모두 반환한다', () => {
  const lands: Land[] = [
    { ...base, id: 'gg' },
    { ...base, id: 'cn', region: 'chungnam' },
    { ...base, id: 'gn', region: 'gyeongnam' },
  ]
  assert.deepEqual(
    searchLands(lands, { ...criteria, region: ['gyeonggi', 'chungnam'] }).map((land) => land.id),
    ['cn', 'gg'],
  )
})

test('지역 선택: 여러 개를 고르고 다시 누르면 빠지며, 전국은 단독으로만 쓴다', () => {
  assert.deepEqual(toggleChoice([], 'gyeonggi', true), ['gyeonggi'])
  assert.deepEqual(toggleChoice(['gyeonggi'], 'chungnam', true), ['gyeonggi', 'chungnam'])
  assert.deepEqual(toggleChoice(['gyeonggi', 'chungnam'], 'gyeonggi', true), ['chungnam'])
  assert.deepEqual(toggleChoice(['gyeonggi'], 'any', true), ['any'])
  assert.deepEqual(toggleChoice(['any'], 'gyeonggi', true), ['gyeonggi'])
  assert.deepEqual(toggleChoice(['under-300m'], 'under-1b'), ['under-1b'])
  const region = searchSteps[0]
  assert.equal(
    summaryLabel({ ...criteria, region: ['gyeonggi', 'chungnam', 'gyeongnam'] }, region),
    '경기도 외 2곳',
  )
})

test('가격 상한과 면적(평) 경계값을 포함하고 범위 밖은 제외한다', () => {
  const lands: Land[] = [
    { ...base, id: 'upper', areaM2: 330.58 },
    { ...base, id: 'too-large', areaM2: 330.6 },
    { ...base, id: 'too-expensive', priceWon: 300_000_001 },
  ]
  assert.deepEqual(
    searchLands(lands, criteria).map((land) => land.id),
    ['upper'],
  )
  const middle = searchLands([{ ...base, id: 'lower', areaM2: 330.58 }], {
    ...criteria,
    area: ['100-200py'],
  })
  assert.deepEqual(
    middle.map((land) => land.id),
    ['lower'],
  )
})

test('미완성 조건과 잘못된 선택값으로 검색하지 않는다', () => {
  assert.deepEqual(searchLands([base], emptyCriteria), [])
  assert.deepEqual(searchLands([base], { ...criteria, area: ['unknown'] }), [])
})

test('무관 조건은 실제 데이터 전체를 반환하고 원본은 변경하지 않는다', () => {
  const before = lhLands.slice(0, 5).map((land) => land.id)
  const all = searchLands(lhLands, {
    region: ['any'],
    purpose: ['any'],
    budget: ['any'],
    area: ['any'],
  })
  assert.equal(all.length, lhLands.length)
  assert.ok(all.every((land, index) => index === 0 || all[index - 1].priceWon <= land.priceWon))
  assert.deepEqual(
    lhLands.slice(0, 5).map((land) => land.id),
    before,
  )
})

test('지역·용도 선택지는 실제 데이터에 있는 id만 쓴다', () => {
  for (const key of ['region', 'purpose'] as const) {
    const ids = new Set(lhLands.map((land) => land[key]))
    const step = searchSteps.find((s) => s.key === key)!
    for (const choice of step.choices.filter((c) => c.id !== 'any')) {
      assert.ok(ids.has(choice.id), `${key}:${choice.id}`)
    }
  }
})

test('용도 단어로 원본 용도명을 거르고, 결과의 용도명을 많은 순으로 센다', () => {
  const lands: Land[] = [
    { ...base, id: 'a', useName: '자족시설용지' },
    { ...base, id: 'b', useName: '실수요자택지 주거전용' },
    { ...base, id: 'c', useName: '실수요자택지 주거전용' },
  ]
  assert.deepEqual(
    filterByUse(lands, ' 자족 ').map((land) => land.id),
    ['a'],
  )
  assert.equal(filterByUse(lands, '').length, 3)
  assert.deepEqual(useNameCounts(lands), [
    ['실수요자택지 주거전용', 2],
    ['자족시설용지', 1],
  ])
})

test('평·평당가를 계산하고 평당가 순으로 정렬한다', () => {
  const lands: Land[] = [
    { ...base, id: 'cheap-total', priceWon: 100_000_000, areaM2: 100 },
    { ...base, id: 'cheap-per-area', priceWon: 200_000_000, areaM2: 400 },
  ]
  assert.equal(pricePerM2(lands[0]), 1_000_000)
  assert.equal(pricePerPyeong(lands[0]), 3_305_785)
  assert.equal(areaPyeong({ ...base, areaM2: 330.58 }), 100)
  assert.deepEqual(
    sortLands(lands, 'unitPrice').map((land) => land.id),
    ['cheap-per-area', 'cheap-total'],
  )
  assert.deepEqual(
    sortLands(lands, 'price').map((land) => land.id),
    ['cheap-total', 'cheap-per-area'],
  )
})

test('CSV는 BOM과 머리글을 넣고 쉼표·따옴표를 이스케이프한다', () => {
  const csv = toCsv([
    {
      ...base,
      noticeName: '가포 "A", B 공고',
      suui: {
        buildingCoverage: 60,
        paymentMethod: '분할(무이자)',
        paymentMonths: 36,
        brokerAllowed: true,
      },
    },
  ])
  const [header, row] = csv.slice(1).split('\r\n')
  assert.ok(csv.startsWith('﻿'))
  assert.ok(header.startsWith('공고명,지구명'))
  assert.ok(header.includes('평당가(원)'))
  assert.ok(row.startsWith('"가포 ""A"", B 공고",'))
  assert.ok(row.includes(',60,,분할(무이자) 36개월,'))
})

test('원화 가격을 손실 없이 읽기 쉬운 단위로 표시한다', () => {
  assert.equal(formatPrice(230_000_000), '2억 3,000만 원')
  assert.equal(formatPrice(300_000_000), '3억 원')
  assert.equal(formatPrice(90_000_000), '9,000만 원')
  // 만 원 미만은 반올림한다.
  assert.equal(formatPrice(231_163_800), '2억 3,116만 원')
  assert.equal(formatPrice(231_165_000), '2억 3,117만 원')
  assert.equal(formatPrice(99_996_000), '1억 원')
  assert.equal(formatPrice(10_001), '1만 원')
  assert.equal(formatPrice(4_999), '0 원')
  assert.equal(formatPrice(0), '0 원')
})
