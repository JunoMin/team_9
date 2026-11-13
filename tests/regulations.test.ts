import assert from 'node:assert/strict'
import test from 'node:test'
import { regulationData } from '../src/data/regulations.generated.ts'
import { lhLands } from '../src/data/lhLands.generated.ts'
import {
  consultationContact,
  lotKey,
  regulationValue,
  resolveRegulations,
} from '../src/lib/regulations.ts'
import type { Land } from '../src/types/land.ts'
import type { RegulationDataset, RegulationParcel } from '../src/types/regulations.ts'

const parcel: RegulationParcel = {
  row: 2,
  region: '경기도',
  district: '고양삼송',
  locality: '오금동',
  plannedLot: '1074-0',
  confirmedLot: '638-0',
  areaM2: 1558.2,
  use: '블록형단독주택용지',
  zoning: '제1종일반주거지역',
  coverage: 50,
  floorArea: 150,
  floors: 3,
  noticeIds: [],
  relatedNoticeIds: [],
}
const data: RegulationDataset = {
  version: 1,
  asOf: '2026-11-13',
  workbook: 'test.xlsx',
  workbookSha256: 'test',
  parcels: [parcel],
  noticeParcels: [],
  notices: [],
  documents: [],
  samples: [],
}
const land: Land = {
  id: 'test',
  name: 'test',
  region: 'gyeonggi',
  regionName: '경기도',
  districtName: '고양삼송',
  address: '경기도 고양삼송 오금동',
  lotNo: '638-0',
  areaM2: 1558.2,
  priceWon: 1,
  purpose: 'detached',
  source: 'lh-suui',
}

test('예정/확정지번을 모두 연결하고 -0만 정규화한다', () => {
  for (const lotNo of ['638-0', '638', '1074-0'])
    assert.equal(resolveRegulations(data, { ...land, lotNo }).parcel?.row, 2)
  assert.notEqual(lotKey('12-34'), lotKey('123-4'))
})

test('지역·지구·소재지·면적이 다르면 수치를 적용하지 않는다', () => {
  for (const change of [
    { regionName: '충청남도' },
    { districtName: '고양삼송2' },
    { address: '경기도 고양삼송 삼송동' },
    { areaM2: 1559.2 },
    { lotNo: '999' },
  ])
    assert.equal(resolveRegulations(data, { ...land, ...change }).parcel, undefined)
})

test('빈 지번과 대시를 식별자로 쓰지 않는다', () => {
  for (const lotNo of ['', '-', '미정', '0']) {
    const missing = { ...data, parcels: [{ ...parcel, plannedLot: lotNo, confirmedLot: lotNo }] }
    assert.equal(resolveRegulations(missing, { ...land, lotNo }).parcel, undefined)
  }
})

test('중복 후보에서 첫 행을 임의로 선택하지 않는다', () => {
  const result = resolveRegulations(
    { ...data, parcels: [parcel, { ...parcel, row: 3, floors: 7 }] },
    land,
  )
  assert.equal(result.match, 'ambiguous')
  assert.equal(result.parcel, undefined)
})

test('공고 ID만 같다고 다른 필지의 규제표를 적용하지 않는다', () => {
  const selected = lhLands.find((x) => x.noticeId === 'BN-0008180' && x.lotNo === '9019-0')!
  const exact = resolveRegulations(regulationData, selected)
  assert.equal(exact.parcel?.row, 1417)
  const other = resolveRegulations(regulationData, { ...selected, lotNo: 'unmapped' })
  assert.equal(other.parcel, undefined)
  assert.equal(other.samples.length, 2)
  assert.ok(other.documents.length > 0)
})

test('0·공란·불일치를 구분한다', () => {
  assert.equal(regulationValue(null, '%'), '상담 요청')
  assert.match(regulationValue(0, '%'), /원본값/)
  assert.equal(regulationValue(50, '%'), '50%')
  const result = resolveRegulations(data, {
    ...land,
    suui: { buildingCoverage: 60, brokerAllowed: false },
  })
  assert.equal(result.parcel?.coverage, 50)
  assert.equal(result.conflicts.length, 1)
})

test('등록되지 않은 필지는 미연결 상태다', () => {
  assert.equal(resolveRegulations(data, { ...land, districtName: '다른지구' }).match, 'none')
})

test('상담은 엑셀 분양문의처, 검색 필지 문의처, 대표번호 순으로 연결한다', () => {
  const selected = { ...land, contactPhone: '031-111-2222' }
  const excel = consultationContact({ ...parcel, contactPhone: '043-901-4342' }, selected)
  assert.equal(excel.phone, '043-901-4342')
  assert.equal(excel.href, 'tel:0439014342')
  assert.equal(excel.isFallback, false)
  assert.equal(consultationContact(undefined, selected).phone, '031-111-2222')
  const fallback = consultationContact({ ...parcel, contactPhone: '-' }, land)
  assert.equal(fallback.phone, '1600-1004')
  assert.equal(fallback.href, 'tel:16001004')
  assert.equal(fallback.isFallback, true)
})

test('실제 엑셀에서 가져온 분양문의처로 상담한다', () => {
  const selected = lhLands.find((x) => x.noticeId === 'BN-0008180' && x.lotNo === '9041-0')!
  const result = resolveRegulations(regulationData, selected)
  assert.equal(consultationContact(result.parcel, selected).phone, '043-901-4342')
})

test('수집 엑셀의 출처·표본·원문 URL이 서비스 데이터에 남는다', () => {
  assert.equal(regulationData.parcels.length, 1625)
  assert.equal(regulationData.samples.length, 6)
  assert.equal(regulationData.notices.length, 99)
  assert.match(regulationData.workbookSha256, /^[a-f0-9]{64}$/)
  assert.ok(regulationData.documents.every((d) => d.url.startsWith('https://apply.lh.or.kr/')))
  assert.doesNotMatch(JSON.stringify(regulationData), /C:\\|C:\/|file:\/\//)
})

test('실제 검색 목록에서 필지 연결은 유효한 지번만 사용한다', () => {
  let matched = 0
  for (const selected of lhLands) {
    const result = resolveRegulations(regulationData, selected)
    if (!result.parcel) continue
    matched++
    assert.ok(lotKey(selected.lotNo), selected.id)
    assert.ok(Math.abs(result.parcel.areaM2 - selected.areaM2) < 0.01, selected.id)
  }
  assert.ok(matched > 1000, `연결 필지 ${matched}건`)
})
