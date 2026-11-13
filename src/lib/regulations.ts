import { lhRegionId } from '../data/lhMapping.ts'
import type { Land } from '../types/land.ts'
import type { RegulationDataset, RegulationParcel } from '../types/regulations.ts'

const nameKey = (value: string | undefined) => (value ?? '').normalize('NFKC').replace(/\s/g, '')
// Preserve sub-lot boundaries: 12-34 and 123-4 are different parcels.
export const lotKey = (value: string | undefined) => {
  const key = nameKey(value)
  return !key || /^(?:-|미정|미기재|없음|0)$/.test(key) ? '' : key.replace(/-0$/, '')
}
const sameArea = (a: number, b: number) => Number.isFinite(a) && Math.abs(a - b) < 0.01
const sameRegion = (region: string, land: Land) =>
  land.regionName
    ? nameKey(region) === nameKey(land.regionName)
    : lhRegionId(region) !== 'other' && lhRegionId(region) === land.region

export function resolveRegulations(data: RegulationDataset, land: Land) {
  const noticeLots = data.noticeParcels.filter(
    (p) =>
      Boolean(lotKey(land.lotNo)) &&
      p.noticeId === land.noticeId &&
      sameRegion(p.region, land) &&
      lotKey(p.lot) === lotKey(land.lotNo) &&
      sameArea(p.areaM2, land.areaM2) &&
      nameKey(p.address) === nameKey(land.address),
  )
  const linkedRows = new Set(noticeLots.map((p) => p.sourceRow).filter((r) => r !== null))
  const districtParcels = land.districtName
    ? data.parcels.filter(
        (p) => sameRegion(p.region, land) && nameKey(p.district) === nameKey(land.districtName),
      )
    : []
  const candidates = data.parcels.filter(
    (p) =>
      linkedRows.has(p.row) ||
      (districtParcels.includes(p) &&
        Boolean(lotKey(land.lotNo)) &&
        (!p.locality || nameKey(land.address).endsWith(nameKey(p.locality))) &&
        [p.plannedLot, p.confirmedLot].some(
          (lot) => Boolean(lot) && lotKey(lot) === lotKey(land.lotNo),
        ) &&
        sameArea(p.areaM2, land.areaM2)),
  )
  const parcel: RegulationParcel | undefined = candidates.length === 1 ? candidates[0] : undefined
  const directNoticeIds = new Set(
    [land.noticeId, ...noticeLots.map((p) => p.noticeId)].filter(Boolean),
  )
  const relatedNoticeIds = new Set(districtParcels.flatMap((p) => p.relatedNoticeIds))
  const notices = data.notices.filter(
    (n) => directNoticeIds.has(n.id) || relatedNoticeIds.has(n.id),
  )
  const ids = new Set(notices.map((n) => n.id))
  const documents = data.documents.filter(
    (d, index, all) =>
      ids.has(d.noticeId) &&
      all.findIndex(
        (other) => ids.has(other.noticeId) && other.url === d.url && other.title === d.title,
      ) === index,
  )
  // The workbook's six sample rows describe blocks, not mapped cadastral lots.
  // Never use them as the selected parcel's numeric limits without a verified block mapping.
  const samples = data.samples.filter((sample) => ids.has(sample.noticeId))
  const conflicts = parcel
    ? [
        ['건폐율', parcel.coverage, land.suui?.buildingCoverage],
        ['용적률', parcel.floorArea, land.suui?.floorAreaRatio],
      ]
        .filter(
          ([, excel, search]) =>
            typeof excel === 'number' && typeof search === 'number' && excel !== search,
        )
        .map(([label, excel, search]) => `${label}: 엑셀 ${excel}%, 검색 목록 ${search}%`)
    : []
  return {
    parcel,
    candidates,
    notices,
    documents,
    samples,
    conflicts,
    match: parcel
      ? ('parcel' as const)
      : candidates.length > 1
        ? ('ambiguous' as const)
        : notices.length || districtParcels.length
          ? ('reference' as const)
          : ('none' as const),
  }
}

export function regulationValue(value: number | null | undefined, unit: string) {
  if (value === null || value === undefined) return '자료 없음'
  if (value === 0) return '0 (원본값 · 확인 필요)'
  return `${value.toLocaleString('ko-KR')}${unit}`
}
