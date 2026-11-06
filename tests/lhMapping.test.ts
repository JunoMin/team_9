import assert from 'node:assert/strict'
import test from 'node:test'
import { type LhLot, lhPurposeId, lhRegionId, toLand, toNumber } from '../src/data/lhMapping.ts'
import { lhLands } from '../src/data/lhLands.generated.ts'

const lot: LhLot = {
  source: 'lh-notice',
  noticeId: 'BN-0000001',
  noticeName: '테스트 공고',
  regionName: '경기도',
  status: '공고중',
  closesOn: '2026.11.23',
  detailUrl: 'https://apply.lh.or.kr/',
  saleMethod: '입찰',
  useName: '실수요자택지 주거전용',
  address: '경기도 이천시 중리동',
  lotNo: '501-5',
  areaM2: 1010.3,
  priceWon: 5_142_427_000,
  contactPhone: '',
}

test('원본 숫자 문자열을 숫자로 바꾸고 빈 값은 null로 둔다', () => {
  assert.equal(toNumber('1,010.3'), 1010.3)
  assert.equal(toNumber(48126), 48126)
  assert.equal(toNumber(''), null)
  assert.equal(toNumber('-'), null)
  assert.equal(toNumber(undefined), null)
})

test('용지 용도명을 용도 선택지 id로 묶는다', () => {
  assert.equal(lhPurposeId('실수요자택지 주거전용'), 'detached')
  assert.equal(lhPurposeId('블록형단독주택용지'), 'detached')
  assert.equal(lhPurposeId('실수요자택지 점포겸용'), 'detached-shop')
  assert.equal(lhPurposeId('근린생활시설'), 'neighborhood')
  assert.equal(lhPurposeId('일반상업용지'), 'commercial')
  assert.equal(lhPurposeId('일반공장(분양)'), 'industrial')
  assert.equal(lhPurposeId('주차장'), 'other')
})

test('시도명을 지역 id로 바꾸고 모르는 이름은 other로 둔다', () => {
  assert.equal(lhRegionId('경기도'), 'gyeonggi')
  assert.equal(lhRegionId('전남광주통합특별시'), 'gwangju-jeonnam')
  assert.equal(lhRegionId(''), 'other')
})

test('필지를 Land로 바꾸고 가격·면적이 없으면 제외한다', () => {
  const land = toLand(lot, 'id-1')
  assert.equal(land?.name, '경기도 이천시 중리동 501-5')
  assert.equal(land?.region, 'gyeonggi')
  assert.equal(land?.purpose, 'detached')
  assert.equal(land?.priceWon, 5_142_427_000)
  assert.equal(land?.contactPhone, undefined)
  assert.equal(toLand({ ...lot, priceWon: null }, 'id-2'), null)
  assert.equal(toLand({ ...lot, areaM2: 0 }, 'id-3'), null)
})

test('생성된 LH 데이터는 id가 유일하고 검색에 필요한 값을 모두 가진다', () => {
  assert.ok(lhLands.length > 0)
  assert.equal(new Set(lhLands.map((land) => land.id)).size, lhLands.length)
  for (const land of lhLands) {
    assert.ok(land.areaM2 > 0 && land.priceWon > 0, land.id)
    assert.ok(land.region && land.purpose, land.id)
  }
})
