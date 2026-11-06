import assert from 'node:assert/strict'
import test from 'node:test'
import { lhLands } from '../src/data/lhLands.generated.ts'
import { SELECTED_LOTS_VERSION, buildPayload, toSelectedLot } from '../src/handoff/selectedLots.ts'

test('선택 필지 JSON에 A02·A03이 쓰는 값이 모두 들어간다', () => {
  const land = lhLands.find((item) => item.source === 'lh-notice')!
  const lot = toSelectedLot(land)
  assert.equal(lot.lotId, land.id)
  assert.equal(lot.noticeId, land.noticeId)
  assert.equal(lot.detailUrl, land.detailUrl)
  assert.equal(lot.address, land.address)
  assert.equal(lot.lotNo, land.lotNo)
  assert.equal(lot.useName, land.useName)
  assert.equal(lot.areaM2, land.areaM2)
  assert.equal(lot.priceWon, land.priceWon)
  assert.equal(lot.pricePerM2, Math.round(land.priceWon / land.areaM2))
})

test('payload는 버전·시각·데이터 기준 시점을 담는다', () => {
  const now = new Date('2026-11-06T00:00:00Z')
  const payload = buildPayload(lhLands.slice(0, 2), '2026-11-05T00:00:00Z', now)
  assert.equal(payload.version, SELECTED_LOTS_VERSION)
  assert.equal(payload.selectedAt, '2026-11-06T00:00:00.000Z')
  assert.equal(payload.dataFetchedAt, '2026-11-05T00:00:00Z')
  assert.equal(payload.lots.length, 2)
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), payload)
})
