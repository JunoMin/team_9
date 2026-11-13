import { areaPyeong, pricePerM2, pricePerPyeong } from '../lib/search.ts'
import type { Land, SaleMethod } from '../types/land.ts'

// 검토 목록의 브라우저 저장 형식입니다. 기존에 저장한 선택과의 호환성을 유지합니다.
// 필드를 바꾸면 version을 올리고 docs/handoff.md도 같이 고쳐 주세요.
export const SELECTED_LOTS_VERSION = 1
export const SELECTED_LOTS_STORAGE_KEY = 'team9.selectedLots.v1'

export interface SelectedLot {
  lotId: string
  noticeId: string
  noticeName: string
  detailUrl: string | null
  districtName: string | null
  regionName: string
  address: string
  lotNo: string
  useName: string
  purpose: string
  saleMethod: SaleMethod | null
  areaM2: number
  areaPyeong: number
  priceWon: number
  pricePerM2: number
  pricePerPyeong: number
  // 수의계약 목록에 있는 값입니다. 공고 필지는 null이며 A02가 시행지침에서 찾습니다.
  zoning: string | null
  buildingCoverage: number | null
  floorAreaRatio: number | null
}

export interface SelectedLotsPayload {
  version: typeof SELECTED_LOTS_VERSION
  selectedAt: string
  dataFetchedAt: string
  lots: SelectedLot[]
}

export function toSelectedLot(land: Land): SelectedLot {
  return {
    lotId: land.id,
    noticeId: land.noticeId ?? '',
    noticeName: land.noticeName ?? '',
    detailUrl: land.detailUrl ?? null,
    districtName: land.districtName ?? null,
    regionName: land.regionName ?? '',
    address: land.address ?? land.name,
    lotNo: land.lotNo ?? '',
    useName: land.useName ?? '',
    purpose: land.purpose,
    saleMethod: land.saleMethod ?? null,
    areaM2: land.areaM2,
    areaPyeong: areaPyeong(land),
    priceWon: land.priceWon,
    pricePerM2: pricePerM2(land),
    pricePerPyeong: pricePerPyeong(land),
    zoning: land.suui?.zoning ?? null,
    buildingCoverage: land.suui?.buildingCoverage ?? null,
    floorAreaRatio: land.suui?.floorAreaRatio ?? null,
  }
}

export function buildPayload(
  lands: readonly Land[],
  dataFetchedAt: string,
  now = new Date(),
): SelectedLotsPayload {
  return {
    version: SELECTED_LOTS_VERSION,
    selectedAt: now.toISOString(),
    dataFetchedAt,
    lots: lands.map(toSelectedLot),
  }
}

// 새로고침 후에도 검토 목록을 복원할 수 있게 저장합니다. 저장소를 못 쓰면 조용히 넘어갑니다.
export function saveSelectedLots(payload: SelectedLotsPayload) {
  try {
    localStorage.setItem(SELECTED_LOTS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 사생활 보호 모드 등에서는 저장되지 않습니다.
  }
}

export function loadSelectedLots(): SelectedLotsPayload | null {
  try {
    const raw = localStorage.getItem(SELECTED_LOTS_STORAGE_KEY)
    const payload = raw ? (JSON.parse(raw) as SelectedLotsPayload) : null
    return payload?.version === SELECTED_LOTS_VERSION ? payload : null
  } catch {
    return null
  }
}
