import type { Land, LandSource, SaleMethod, SuuiDetail } from '../types/land.ts'

// LH 원본(공고 공급정보·수의계약 목록)을 화면용 Land로 바꾸기 전의 중간 형태입니다.
export interface LhLot {
  source: LandSource
  noticeId: string
  noticeName: string
  regionName: string
  // 사업지구명은 수의계약 목록에만 별도 필드로 옵니다. 공고 API는 공고명 안에만 있습니다.
  districtName: string
  status: string
  postedOn: string
  closesOn: string
  detailUrl: string
  saleMethod: SaleMethod
  useName: string
  address: string
  lotNo: string
  areaM2: number | null
  priceWon: number | null
  contactPhone: string
  suui?: SuuiDetail
}

// 시도명(CNP_CD_NM·cnpNm) → 지역 선택지 id. 원본은 시도 단위까지만 일정하게 제공됩니다.
export const lhRegionIds: Record<string, string> = {
  서울특별시: 'seoul',
  전남광주통합특별시: 'gwangju-jeonnam',
  부산광역시: 'busan',
  대구광역시: 'daegu',
  인천광역시: 'incheon',
  대전광역시: 'daejeon',
  울산광역시: 'ulsan',
  세종특별자치시: 'sejong',
  경기도: 'gyeonggi',
  충청북도: 'chungbuk',
  충청남도: 'chungnam',
  경상북도: 'gyeongbuk',
  경상남도: 'gyeongnam',
  제주특별자치도: 'jeju',
  강원특별자치도: 'gangwon',
  전북특별자치도: 'jeonbuk',
}

// 용지 용도명 → 용도 선택지 id. 위에서부터 처음 맞는 규칙을 씁니다.
const purposeRules: [test: (use: string) => boolean, id: string][] = [
  [(use) => use.includes('점포겸용'), 'detached-shop'],
  [(use) => use.includes('주거전용') || use.includes('단독주택'), 'detached'],
  [(use) => use.includes('근린생활'), 'neighborhood'],
  [(use) => use.includes('상업용지'), 'commercial'],
  [(use) => use.includes('공장'), 'industrial'],
]

export function lhPurposeId(useName: string): string {
  return purposeRules.find(([test]) => test(useName))?.[1] ?? 'other'
}

export function lhRegionId(regionName: string): string {
  return lhRegionIds[regionName] ?? 'other'
}

// 가격이나 면적이 없는 필지는 조건 검색에 쓸 수 없으므로 null을 반환합니다.
export function toLand(lot: LhLot, id: string): Land | null {
  if (!lot.areaM2 || !lot.priceWon) return null
  return {
    id,
    name: [lot.address, lot.lotNo].filter(Boolean).join(' '),
    region: lhRegionId(lot.regionName),
    purpose: lhPurposeId(lot.useName),
    areaM2: lot.areaM2,
    priceWon: lot.priceWon,
    source: lot.source,
    regionName: lot.regionName,
    useName: lot.useName,
    address: lot.address,
    lotNo: lot.lotNo,
    status: lot.status,
    saleMethod: lot.saleMethod,
    noticeId: lot.noticeId,
    noticeName: lot.noticeName,
    districtName: lot.districtName || undefined,
    postedOn: lot.postedOn || undefined,
    closesOn: lot.closesOn || undefined,
    detailUrl: lot.detailUrl || undefined,
    contactPhone: lot.contactPhone || undefined,
    suui: lot.suui,
  }
}

// 수의계약 원본의 'YYYYMMDD' 날짜를 'YYYY-MM-DD'로 바꿉니다.
export function toIsoDate(value: unknown): string | undefined {
  const match = String(value ?? '').match(/^(\d{4})(\d{2})(\d{2})$/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined
}

// '1,010.3' 같은 원본 숫자 문자열을 숫자로 바꿉니다. 비었거나 숫자가 아니면 null입니다.
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const text = value.replaceAll(',', '').trim()
  if (!text) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}
