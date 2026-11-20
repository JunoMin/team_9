import type { Land } from '../types/land.ts'

// 수집 엑셀에 아직 없는 공고 필지의 건축 규제를 공고문·시행지침에서 직접 옮긴 값입니다.
// 공고 ID·지번·면적이 모두 같을 때만 씁니다. 원문에 없는 항목은 비워 두고 '상담 요청'으로 표시합니다.
export interface NoticeRegulation {
  noticeId: string
  lotNo: string
  areaM2: number
  block: string
  use: string
  coverage: number
  floorArea: number
  maxFloors: number
  minFloors?: number
  maxHeight?: string
  allowed?: string
  prohibited?: string
  sources: { title: string; url: string; detail: string }[]
  checkedOn: string
}

const fileUrl = (fileId: string) => `https://apply.lh.or.kr/lhapply/lhFile.do?fileid=${fileId}`

export const noticeRegulations: NoticeRegulation[] = [
  {
    noticeId: 'BN-0008127',
    lotNo: '201-2',
    areaM2: 2816,
    block: '상업1-2',
    use: '상업시설용지',
    coverage: 70,
    floorArea: 800,
    maxFloors: 15,
    maxHeight: '85m 이하 (군부대 조건부 동의에 따른 높이)',
    allowed:
      '「건축법 시행령」 별표1의 제1·2종 근린생활시설, 문화 및 집회시설(마권관련시설·관람장 제외), 종교집회장(건물의 부수용도인 경우), 판매시설 중 상점·대형마트·전문점·백화점·쇼핑센터, 의료시설(정신병원·요양병원·격리병원·장례식장 제외), 교육연구시설(자동차학원·무도학원 제외), 운동시설(옥외철탑 골프연습장 제외), 업무시설, 관광숙박시설, 위락시설(주거지역과 차단·이격된 경우), 주차장·세차장, 방송통신시설',
    prohibited:
      '허용용도 이외의 용도, 「교육환경 보호에 관한 법률」 등 기타 법령에 따라 해당 토지에 불허되는 용도',
    sources: [
      {
        title: '고양장항 상업시설용지 공급공고문',
        url: fileUrl('69204177'),
        detail: '1쪽 공급대상토지 표(건폐율·용적률·최고층수), 9쪽 유의사항(최고 높이 85m)',
      },
      {
        title: '지구단위계획 시행지침(5차변경) 상업시설용지',
        url: fileUrl('69204258'),
        detail: '제2조 건축물의 용도(표 2-4-1), 제3조 건축물의 규모(표 2-4-2)',
      },
    ],
    checkedOn: '2026-11-20',
  },
  {
    noticeId: 'BN-0008196',
    lotNo: '311-1',
    areaM2: 4714,
    block: '상1-1',
    use: '일반상업용지',
    coverage: 80,
    floorArea: 600,
    maxFloors: 10,
    minFloors: 6,
    sources: [
      {
        title: '수원당수2지구 상업용지(상업1-1) 재공급 공고문',
        url: fileUrl('69483409'),
        detail: '1쪽 공급대상 토지 표(건폐율·용적률·최고/최저 층수)',
      },
    ],
    checkedOn: '2026-11-20',
  },
]

const lotKey = (value: string | undefined) => (value ?? '').trim().replace(/-0$/, '')

export function findNoticeRegulation(land: Land): NoticeRegulation | undefined {
  return noticeRegulations.find(
    (item) =>
      item.noticeId === land.noticeId &&
      lotKey(item.lotNo) === lotKey(land.lotNo) &&
      Math.abs(item.areaM2 - land.areaM2) < 0.01,
  )
}
