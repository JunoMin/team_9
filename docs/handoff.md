# 0~3단계 → A02·A03 넘김 형식

PRD Section 3 기준으로 0~3단계(시행지침 등록, 조건 입력, 후보 검색, 필지 선택)가 만드는 결과물과,
4단계(A02 규제 확인, A03 실거래 분석)가 읽을 위치를 정리합니다. 형식을 바꿀 때는 이 문서와 버전을 함께 고칩니다.

## 3단계 출력: 선택 필지 JSON

사용자가 결과 목록에서 필지를 고르고 **규제·시세 분석으로 넘기기**를 누르면 두 곳에 같은 내용이 저장됩니다.

- 브라우저 `localStorage`의 `team9.selectedLots.v1` 키: 같은 사이트의 A02·A03 화면은 `loadSelectedLots()`로 읽습니다.
- `selected-lots-YYYYMMDD.json` 파일 내려받기: 화면 밖(파이썬, Dify 등)에서 처리할 때 씁니다.

타입 정의와 읽기 함수는 `src/handoff/selectedLots.ts`에 있습니다.

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

| 필드                               | 쓰는 곳 | 설명                                                                     |
| ---------------------------------- | ------- | ------------------------------------------------------------------------ |
| `noticeId`, `detailUrl`            | A02     | 시행지침 찾기. 수의계약 필지는 `SUUI-지구코드`이고 공고 상세가 없습니다. |
| `districtName`                     | A02     | 수의계약 필지의 사업지구명. 공고 필지는 `null`(공고명에 포함)            |
| `address`, `lotNo`                 | A03     | 지오코딩 입력. 지번이 `1-3블록` 같은 블록 표기일 수 있습니다.            |
| `areaM2`, `priceWon`, `pricePerM2` | A03     | LH 공급가 비교. 입찰은 예정가격, 추첨·수의계약은 공급가격입니다.         |
| `useName`                          | A02     | 원본 공급용도명 (규제 조항 검색어)                                       |

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
