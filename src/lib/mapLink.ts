import type { Land } from '../types/land.ts'

// '734-0' → '734', '-'처럼 지번이 없으면 빈 문자열입니다.
function jibun(lotNo = ''): string {
  if (!/^\d+(-\d+)?$/.test(lotNo)) return ''
  return lotNo.replace(/-0$/, '')
}

// 네이버 지도 검색어. 수의계약 주소는 '시도 사업지구명 동' 형태라 사업지구명은 지명 검색에 쓰지 않고,
// 지번이 없을 때만 동과 함께 지구 위치를 찾는 단서로 씁니다.
export function naverMapQuery(land: Land): string {
  const number = jibun(land.lotNo)
  const address = land.address ?? land.name
  if (land.source !== 'lh-suui' || !land.districtName) {
    return [address, number].filter(Boolean).join(' ')
  }
  const dong = address
    .replace(land.regionName ?? '', '')
    .replace(land.districtName, '')
    .trim()
  if (number) return [land.regionName, dong, number].filter(Boolean).join(' ')
  const district = land.districtName.replace(/\(.*?\)/g, '').trim()
  return [district, dong].filter(Boolean).join(' ')
}

export function naverMapUrl(land: Land): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(naverMapQuery(land))}`
}
