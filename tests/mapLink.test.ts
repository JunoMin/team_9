import assert from 'node:assert/strict'
import test from 'node:test'
import { naverMapQuery, naverMapUrl } from '../src/lib/mapLink.ts'
import type { Land } from '../src/types/land.ts'

const base: Land = {
  id: 'x',
  name: 'x',
  region: 'gyeongnam',
  purpose: 'detached',
  areaM2: 1,
  priceWon: 1,
}

test('공고 필지는 주소와 지번으로 찾고 -0은 뗀다', () => {
  const land = { ...base, address: '경상남도 창원시 마산합포구 가포동', lotNo: '734-0' }
  assert.equal(naverMapQuery(land), '경상남도 창원시 마산합포구 가포동 734')
  assert.equal(
    naverMapQuery({ ...land, lotNo: '732-13' }),
    '경상남도 창원시 마산합포구 가포동 732-13',
  )
})

test('수의계약 필지는 사업지구명을 빼고 시도·동·지번으로 찾는다', () => {
  const land: Land = {
    ...base,
    source: 'lh-suui',
    regionName: '충청남도',
    districtName: '논산강산',
    address: '충청남도 논산강산 강산동',
    lotNo: '634-0',
  }
  assert.equal(naverMapQuery(land), '충청남도 강산동 634')
})

test('수의계약 필지에 지번이 없으면 사업지구명(괄호 제외)과 동으로 찾는다', () => {
  const land: Land = {
    ...base,
    source: 'lh-suui',
    regionName: '경기도',
    districtName: '양주회천(택)',
    address: '경기도 양주회천(택) 고암동',
    lotNo: '-',
  }
  assert.equal(naverMapQuery(land), '양주회천 고암동')
})

test('네이버 지도 검색 주소로 인코딩한다', () => {
  const url = naverMapUrl({ ...base, address: '경기도 파주시 와동동', lotNo: '1690-4' })
  assert.equal(
    url,
    `https://map.naver.com/p/search/${encodeURIComponent('경기도 파주시 와동동 1690-4')}`,
  )
})
