import assert from 'node:assert/strict'
import test from 'node:test'
import {
  districtCity,
  marketPriceQuery,
  marketPriceUrl,
  naverMapQuery,
  naverMapUrl,
} from '../src/lib/mapLink.ts'
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

test('수의계약 필지는 사업지구명 대신 그 앞의 지역명과 동·지번으로 찾는다', () => {
  const land: Land = {
    ...base,
    source: 'lh-suui',
    regionName: '경상남도',
    districtName: '밀양부북',
    address: '경상남도 밀양부북 부북면',
    lotNo: '956-4',
  }
  assert.equal(naverMapQuery(land), '경상남도 밀양 부북면 956-4')
  const suburb = {
    ...land,
    regionName: '경기도',
    districtName: '남양주진접',
    address: '경기도 남양주진접 진접읍',
  }
  assert.equal(naverMapQuery(suburb), '경기도 남양주 진접읍 956-4')
})

test('사업지구명 앞의 지역명은 같은 시도의 시·군 이름만 쓴다', () => {
  assert.equal(districtCity('경상남도', '밀양나노융합국가산단'), '밀양')
  assert.equal(districtCity('경기도', '남양주진접'), '남양주')
  assert.equal(districtCity('경기도', '남양뉴타운'), '')
  assert.equal(districtCity('강원특별자치도', '남원주역세권'), '')
  assert.equal(districtCity('충청북도', '남청주현도'), '')
  assert.equal(districtCity('부산광역시', '부산명지'), '')
  assert.equal(districtCity('충청남도', '석문국가산단'), '')
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

test('반경 시세 조회 주소는 지번이 있으면 네이버 지도 검색어와 같다', () => {
  const notice = { ...base, address: '경상남도 창원시 마산합포구 가포동', lotNo: '734-0' }
  assert.equal(marketPriceQuery(notice), '경상남도 창원시 마산합포구 가포동 734')
  const suui: Land = {
    ...base,
    source: 'lh-suui',
    regionName: '충청남도',
    districtName: '논산강산',
    address: '충청남도 논산강산 강산동',
    lotNo: '634-0',
  }
  assert.equal(marketPriceQuery(suui), '충청남도 논산 강산동 634')
})

test('지번 없는 수의계약 필지의 반경 시세 조회 주소는 사업지구명 대신 지역명을 쓴다', () => {
  const land: Land = {
    ...base,
    source: 'lh-suui',
    regionName: '경기도',
    districtName: '양주회천(택)',
    address: '경기도 양주회천(택) 고암동',
    lotNo: '-',
  }
  assert.equal(marketPriceQuery(land), '경기도 양주 고암동')
})

test('반경 시세 조회 페이지 주소에 배포 경로·주소·반경을 넣는다', () => {
  const land = { ...base, address: '경기도 파주시 와동동', lotNo: '1690-4' }
  const [path, query] = marketPriceUrl(land, '/team_9/').split('?')
  assert.equal(path, '/team_9/landtrade-radius.html')
  const params = new URLSearchParams(query)
  assert.equal(params.get('addr'), '경기도 파주시 와동동 1690-4')
  assert.equal(params.get('radius'), '3')
})

test('네이버 지도 검색 주소로 인코딩한다', () => {
  const url = naverMapUrl({ ...base, address: '경기도 파주시 와동동', lotNo: '1690-4' })
  assert.equal(
    url,
    `https://map.naver.com/p/search/${encodeURIComponent('경기도 파주시 와동동 1690-4')}`,
  )
})
