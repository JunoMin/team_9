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

- `HomeHero`: 소개 이미지와 검색 시작 링크. 네 조건 표시는 기존 `searchSteps`와 `summaryLabel`을 재사용합니다.
- `FeaturedLands`: 실제 LH 데이터에서 최대 4개를 보여 줍니다. 용도별로 나눈 뒤 게시일 내림차순, 같은 날짜는 가격 오름차순으로 정렬합니다. 같은 사업지구(없으면 주소)는 한 번만 표시합니다. 게시일 없는 수의계약 필지는 뒤에 옵니다.
- 카드의 책갈피는 기존 검토 목록과 같은 선택 상태를 사용합니다. 상세 보기는 기존 `LotDetailDialog`를 재사용합니다.
- 지역·용도·예산·면적 검색, 규제 팝업, CSV, 3km 시세와 LH 지도 연결은 기존 컴포넌트를 사용합니다.
- 920px 이하에서 검색과 요약을 세로로 배치하고, 600px 이하에서 소개 검색 영역을 2열로, 공급 카드를 1열로 표시합니다. 최소 320px 화면을 지원합니다.

## 이미지·아이콘

- `public/images/landscape-hero.webp`: AI로 생성한 소개용 풍경. 실제 공급 필지 사진이 아니며 화면에도 이를 표시합니다. 토지 카드에 확인되지 않은 사진·위치 이미지를 붙이지 않습니다.
- `public/icons/`: [Phosphor Icons](https://github.com/phosphor-icons/core)의 regular 아이콘입니다. MIT 라이선스는 같은 폴더의 `LICENSE`에 있습니다. 새 의존성 없이 필요한 아이콘만 사용합니다.
- 제목의 [Noto Serif KR](https://notofonts.github.io/noto-docs/specimen/NotoSerifCJKkr/)은 Google Fonts에서 불러오며, 본문은 기존 Noto Sans KR을 유지합니다.

새 기능은 공통 색상·버튼 클래스를 재사용하고, 화면 상태는 색상 외에도 문구·`aria-pressed`·체크박스로 구분해 주세요. 공유 스타일 변경 전 다른 팀원의 작업 범위를 확인합니다.
