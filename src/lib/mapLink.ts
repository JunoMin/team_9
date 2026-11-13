import type { Land } from '../types/land.ts'

// 도 단위 시도의 시·군 이름('시'·'군' 제외). 사업지구명 앞의 지역명(예: 밀양부북 → 밀양)을 찾는 데 씁니다.
// 광역시·특별시는 시도명에 이미 지역이 들어 있어 넣지 않습니다.
const citiesByRegion: Record<string, string[]> = Object.fromEntries(
  Object.entries({
    경기도:
      '수원 성남 의정부 안양 부천 광명 평택 동두천 안산 고양 과천 구리 남양주 오산 시흥 군포 의왕 하남 용인 파주 이천 안성 김포 화성 광주 양주 포천 여주 연천 가평 양평',
    강원특별자치도:
      '춘천 원주 강릉 동해 태백 속초 삼척 홍천 횡성 영월 평창 정선 철원 화천 양구 인제 고성 양양',
    충청북도: '청주 충주 제천 보은 옥천 영동 증평 진천 괴산 음성 단양',
    충청남도: '천안 공주 보령 아산 서산 논산 계룡 당진 금산 부여 서천 청양 홍성 예산 태안',
    전북특별자치도: '전주 군산 익산 정읍 남원 김제 완주 진안 무주 장수 임실 순창 고창 부안',
    전남광주통합특별시:
      '광주 목포 여수 순천 나주 광양 담양 곡성 구례 고흥 보성 화순 장흥 강진 해남 영암 무안 함평 영광 장성 완도 진도 신안',
    경상북도:
      '포항 경주 김천 안동 구미 영주 영천 상주 문경 경산 의성 청송 영양 영덕 청도 고령 성주 칠곡 예천 봉화 울진 울릉',
    경상남도:
      '창원 진주 통영 사천 김해 밀양 거제 양산 의령 함안 창녕 고성 남해 하동 산청 함양 거창 합천',
    제주특별자치도: '제주 서귀포',
  }).map(([region, names]) => [region, names.split(' ')]),
)

// '734-0' → '734', '-'처럼 지번이 없으면 빈 문자열입니다.
function jibun(lotNo = ''): string {
  if (!/^\d+(-\d+)?$/.test(lotNo)) return ''
  return lotNo.replace(/-0$/, '')
}

// 사업지구명이 시·군 이름으로 시작하면 그 이름을 돌려줍니다. 남양주처럼 긴 이름을 먼저 맞춥니다.
export function districtCity(regionName = '', districtName = ''): string {
  return (
    (citiesByRegion[regionName] ?? [])
      .filter((city) => districtName.startsWith(city))
      .sort((a, b) => b.length - a.length)[0] ?? ''
  )
}

// 수의계약 주소('시도 사업지구명 동')에서 동만 남깁니다.
function suuiDong(land: Land, districtName: string): string {
  return (land.address ?? land.name)
    .replace(land.regionName ?? '', '')
    .replace(districtName, '')
    .trim()
}

// 네이버 지도 검색어. 수의계약 주소는 '시도 사업지구명 동' 형태라 사업지구명 대신 그 앞의 지역명을 쓰고,
// 지번이 없을 때만 사업지구명을 동과 함께 지구 위치를 찾는 단서로 씁니다.
export function naverMapQuery(land: Land): string {
  const number = jibun(land.lotNo)
  if (land.source !== 'lh-suui' || !land.districtName) {
    return [land.address ?? land.name, number].filter(Boolean).join(' ')
  }
  const dong = suuiDong(land, land.districtName)
  if (number) {
    const city = districtCity(land.regionName, land.districtName)
    return [land.regionName, city, dong, number].filter(Boolean).join(' ')
  }
  const district = land.districtName.replace(/\(.*?\)/g, '').trim()
  return [district, dong].filter(Boolean).join(' ')
}

// 반경 실거래가 조회(브이월드 주소 검색)에 넘길 주소. 브이월드는 사업지구명을 찾지 못하므로
// 지번 없는 수의계약 필지도 '시도 지역명 동'으로 넘깁니다.
export function marketPriceQuery(land: Land): string {
  if (land.source !== 'lh-suui' || !land.districtName || jibun(land.lotNo)) {
    return naverMapQuery(land)
  }
  const city = districtCity(land.regionName, land.districtName)
  return [land.regionName, city, suuiDong(land, land.districtName)].filter(Boolean).join(' ')
}

// public/landtrade-radius.html(주소 기준 반경 실거래가 조회)로 가는 주소입니다.
// base는 앱이 배포된 경로(import.meta.env.BASE_URL, 예: '/team_9/')입니다.
export function marketPriceUrl(land: Land, base: string, radiusKm = 3): string {
  const params = new URLSearchParams({ addr: marketPriceQuery(land), radius: String(radiusKm) })
  return `${base}landtrade-radius.html?${params}`
}

export function naverMapUrl(land: Land): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(naverMapQuery(land))}`
}
