# 즐겨찾기 동작과 기존 데이터 형식

즐겨찾기는 헤더 버튼으로 여는 패널에서 확인합니다. 현재 페이지의 React 상태로만 유지되며 새로고침하거나 새로 접속하면 비워집니다.
메인 화면은 `localStorage`에 저장하거나 이전 선택을 복원하지 않습니다. 분석으로 넘기기 버튼과 후속 분석 안내도 제공하지 않습니다.

## 기존 선택 필지 JSON (현재 UI에서 사용하지 않음)

기존 `team9.selectedLots.v1` 키와 `src/handoff/selectedLots.ts`의 타입·함수는 과거 데이터 계약 참고용입니다. 현재 화면에서는 불러오지 않습니다.

```json
{
  "version": 1,
  "selectedAt": "2026-11-06T02:40:00.000Z",
  "dataFetchedAt": "2026-11-06T02:23:51.243Z",
  "lots": [
    {
      "lotId": "BN-0008055-입찰-732-13",
      "noticeId": "BN-0008055",
      "noticeName": "창원가포 공공주택지구(단독, 근생, 도시지원, 주차장) 용지 공급 공고",
      "detailUrl": "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=BN-0008055&...",
      "districtName": null,
      "regionName": "경상남도",
      "address": "경상남도 창원시 마산합포구 가포동",
      "lotNo": "732-13",
      "useName": "실수요자택지 점포겸용",
      "purpose": "detached-shop",
      "saleMethod": "입찰",
      "areaM2": 255,
      "priceWon": 244035000,
      "pricePerM2": 957000
    }
  ]
}
```

아래 A02·A03 표기는 기존 데이터 계약의 참고용이며, 현재 UI는 별도의 후속 분석 단계로 넘기지 않습니다.

| 필드                                           | 쓰는 곳 | 설명                                                                                                                                    |
| ---------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `noticeId`, `detailUrl`                        | A02     | 시행지침 찾기. 수의계약 필지는 `SUUI-지구코드`이고 공고 상세가 없습니다.                                                                |
| `districtName`                                 | A02     | 수의계약 필지의 사업지구명. 공고 필지는 `null`(공고명에 포함)                                                                           |
| `address`, `lotNo`                             | A03     | 지오코딩 입력. 지번이 `1-3블록` 같은 블록 표기일 수 있습니다.                                                                           |
| `areaM2`, `priceWon`, `pricePerM2`             | A03     | LH 공급가 비교. 입찰은 예정가격, 추첨·수의계약은 공급가격입니다.                                                                        |
| `useName`                                      | A02     | 원본 공급용도명 (규제 조항 검색어)                                                                                                      |
| `areaPyeong`, `pricePerPyeong`                 | A03·A04 | 평(1평 = 3.305785㎡)과 평당가                                                                                                           |
| `zoning`, `buildingCoverage`, `floorAreaRatio` | A02     | 수의계약 목록의 용도지역·건폐율(%)·용적률(%). 공고 필지는 `null`이라 시행지침에서 찾아야 합니다. 값이 있어도 지침 원문과 대조해 주세요. |

## 0단계 출력: 시행지침 등록 목록

1. `pnpm guidelines:targets`를 실행하면 `guidelines/TARGETS.md`에 판매 중인 공고·지구 목록과 공고 상세 링크, 등록 여부가 정리됩니다.
2. 공고 상세의 첨부파일에서 지구단위계획 시행지침을 내려받아 `guidelines/files/<지구명>/`에 넣습니다.
3. `guidelines/registry.json`의 `entries`에 한 줄 추가합니다.

```json
{
  "district": "창원가포",
  "noticeIds": ["BN-0008055"],
  "title": "창원가포 공공주택지구 지구단위계획 시행지침",
  "file": "guidelines/files/창원가포/시행지침.pdf",
  "sourceUrl": "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=BN-0008055&...",
  "downloadedOn": "2026-11-06",
  "registeredBy": "github-id",
  "note": "2025.03 변경 지침"
}
```

4. `pnpm guidelines:targets`를 다시 실행해 ✅로 바뀌는지 확인하고 PR을 올립니다. 형식 오류나 없는 파일이 있으면 스크립트가 알려 줍니다.

A02는 `registry.json`을 읽어 색인합니다. 필지와 지침은 `noticeIds`(공고 필지) 또는 `district`(수의계약 필지의 `districtName`)로 연결하며, 연결 함수는 `src/data/guidelineRegistry.ts`의 `guidelinesFor()`입니다. 등록된 지침이 없으면 PRD대로 "확인 불가"로 처리합니다.
