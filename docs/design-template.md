# 공통 디자인 템플릿

Landfolk의 풍경 중심 첫 화면, 짙은 초록색, 넓은 여백을 토지 검색 서비스에 맞게 적용했습니다.

## 함께 쓰는 스타일

`src/main.tsx`에서 기존 `index.css` 다음에 `design.css`를 불러옵니다. 새 디자인은 `.design-template` 안에만 적용됩니다. 기능별 컴포넌트의 데이터·이벤트 코드는 유지하고, 공통 외관은 `src/design.css`에서 관리합니다.

| 용도             | 토큰 / 클래스                          |
| ---------------- | -------------------------------------- |
| 주요 버튼·강조   | `--green: #07594c`                     |
| 짙은 배경        | `--design-forest: #063e35`             |
| 본문·보조 문구   | `--design-ink`, `--muted`              |
| 페이지·카드 배경 | `--design-paper`, `--design-sage`      |
| 구분선           | `--border`                             |
| 큰 소개 제목     | `--design-serif` / Noto Serif KR       |
| 섹션 제목        | `.section-heading`, `.section-eyebrow` |
| 주요·보조 버튼   | `.button.primary`, `.button.secondary` |

## 컴포넌트와 연결

- `HomeHero`: 지역·용도·예산·면적을 한 선택창에서 바꾸고 바로 검색합니다. `ChoiceGrid`, `searchSteps`, `summaryLabel`을 재사용하고 지역 복수 선택과 용도 단어 입력을 지원합니다. 선택하지 않은 조건은 전체로 검색합니다.
- 헤더의 ‘조건으로 찾기’, 공급 카드 영역의 ‘내 조건으로 찾기’, 결과의 조건 수정은 모두 같은 선택창을 엽니다. 별도의 하단 단계별 검색은 없습니다.
- 검색하면 소개 이미지를 줄이고 검색창 바로 아래에 결과를 표시합니다. 결과 화면에서 조건을 바꾸면 목록에 반영됩니다. 검토할 필지는 홈과 결과 화면에서 같은 선택 상태를 유지합니다.
- `FeaturedLands`: 실제 LH 데이터에서 최대 4개를 보여 줍니다. 용도별로 나눈 뒤 게시일 내림차순, 같은 날짜는 가격 오름차순으로 정렬합니다. 같은 사업지구(없으면 주소)는 한 번만 표시합니다. 게시일 없는 수의계약 필지는 뒤에 옵니다.
- 카드의 책갈피는 기존 검토 목록과 같은 선택 상태를 사용합니다. 상세 보기는 기존 `LotDetailDialog`를 재사용합니다.
- 지역·용도·예산·면적 검색, 규제 팝업, CSV, 3km 시세와 LH 지도 연결은 기존 컴포넌트를 사용합니다.
- 920px 이하에서 검색과 요약을 세로로 배치하고, 600px 이하에서 소개 검색 영역을 2열로, 공급 카드를 1열로 표시합니다. 최소 320px 화면을 지원합니다.

## 3km 시세 페이지

`public/landtrade-radius.html`은 독립 HTML이라 Vite의 메인 CSS 번들을 사용하지 않습니다. 배포 후에도 동일하게 보이도록 `public/radius-design.css`를 상대 경로로 불러옵니다. 이 파일의 색상 토큰은 `src/design.css`와 맞춰 관리합니다. 헤더·풍경 이미지·서체·입력 카드·어두운 조회 조건 패널과 지도·차트·거래 표에 공통 스타일을 적용했습니다. 조회 API, 주소/반경 전달, 필터·정렬·엑셀 다운로드는 기존 동작을 유지합니다.

## 이미지·아이콘

- `public/images/landscape-hero.webp`: AI로 생성한 소개용 풍경. 실제 공급 필지 사진이 아니며 화면에도 이를 표시합니다. 토지 카드에 확인되지 않은 사진·위치 이미지를 붙이지 않습니다.
- `public/icons/`: [Phosphor Icons](https://github.com/phosphor-icons/core)의 regular 아이콘입니다. MIT 라이선스는 같은 폴더의 `LICENSE`에 있습니다. 새 의존성 없이 필요한 아이콘만 사용합니다.
- 제목의 [Noto Serif KR](https://notofonts.github.io/noto-docs/specimen/NotoSerifCJKkr/)은 Google Fonts에서 불러오며, 본문은 기존 Noto Sans KR을 유지합니다.

새 기능은 공통 색상·버튼 클래스를 재사용하고, 화면 상태는 색상 외에도 문구·`aria-pressed`·체크박스로 구분해 주세요. 공유 스타일 변경 전 다른 팀원의 작업 범위를 확인합니다.
