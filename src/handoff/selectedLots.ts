import type { Land, SaleMethod } from '../types/land.ts'

// PRD Section 3의 3단계 출력: 사용자가 고른 필지를 A02(규제)·A03(실거래)에 넘기는 형식입니다.
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
  priceWon: number
  pricePerM2: number
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
    priceWon: land.priceWon,
    pricePerM2: Math.round(land.priceWon / land.areaM2),
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

// 다음 단계 화면이 같은 브라우저에서 바로 읽을 수 있게 저장합니다. 저장소를 못 쓰면 조용히 넘어갑니다.
export function saveSelectedLots(payload: SelectedLotsPayload) {
  try {
    localStorage.setItem(SELECTED_LOTS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 사생활 보호 모드 등에서는 JSON 내려받기로만 넘깁니다.
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
