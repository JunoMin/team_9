# 9조 · 토지 맞춤 검색기

지역 → 용도 → 예산 → 면적을 선택하면 토지 목록을 보여 주는 공동 개발용 UI 템플릿입니다. 땅야의 조건 선택과 마이홈 자가진단의 단계별 흐름을 참고해 단순하게 구성했습니다. 화면의 ‘우리땅’은 변경 가능한 임시 이름입니다.

현재 검색은 LH 공고·선착순 수의계약 스냅숏을 사용합니다. **건축 규제 보기**에는 수집 엑셀을 연결했으며,
필지 일치 규제값과 지구·공고 참고자료를 구분합니다. [규제 연결 기준과 갱신 방법](docs/regulations.md),
[토지 데이터 갱신 방법](docs/data.md)을 참고하세요.

## 시작하기

Node.js 24와 pnpm 11.25.0을 사용합니다.

```bash
npm install -g pnpm@11.25.0
pnpm install
pnpm dev
```

터미널에 표시된 로컬 주소를 브라우저에서 엽니다. API 키나 별도 서버 설정은 필요하지 않습니다.

```bash
pnpm check      # 정적 검사, 검색 테스트, 프로덕션 빌드
pnpm preview    # 빌드 결과 확인 (pnpm build 실행 후)
```

## GitHub Pages 배포

배포 주소(Pages 활성화 후): https://junomin.github.io/team_9/

최초 한 번 저장소 관리자 또는 maintainer가 [Settings → Pages](https://github.com/JunoMin/team_9/settings/pages)의 **Build and deployment → Source**를 **GitHub Actions**로 선택합니다. 비공개 저장소에서 Pages를 사용하려면 소유자 계정에 GitHub Pro 이상의 지원 요금제가 필요합니다.

이후 `main`에 push하면 검사와 빌드를 통과한 사이트가 자동 배포됩니다. 수동 배포는 **Actions → Deploy GitHub Pages → Run workflow**에서 실행할 수 있습니다. 실제 배포 성공 여부와 주소는 해당 실행의 `deploy` 작업에서 확인합니다.

`vite.config.ts`의 `base: '/team_9/'`가 프로젝트 주소에 맞게 정적 파일 경로를 지정합니다. 로컬에서도 터미널에 표시되는 `/team_9/` 주소를 사용합니다.

## 화면에서 확인할 것

- 네 단계의 선택 카드와 이전·다음 이동
- 선택한 조건 요약, 조건 수정, 전체 초기화
- 조건에 맞는 결과와 가격·면적 정렬
- 결과가 없는 경우의 안내
- 모바일 화면과 키보드 조작

예: **평택시 → 단독주택용지 → 3억 원 이하 → 300㎡ 안팎**을 선택하면 샘플 A·B·C가 나옵니다. 같은 조건에서 예산을 1억 원 이하로 바꾸면 결과 없음 화면을 확인할 수 있습니다.

면적의 ‘안팎’은 화면 시연을 위해 ±10%로 설정했습니다. ‘평택시’는 해당 지역만 필터링하며 거리·주변 지역 검색은 포함하지 않습니다. 이 범위와 선택지는 `src/config/searchSteps.ts`에서 바꿀 수 있습니다.

## 코드 구조

```text
src/
  App.tsx                 단계 이동과 화면 조합
  components/             선택 카드, 단계 탭, 조건 요약, 결과 목록
  config/searchSteps.ts   선택지·조건 범위
  data/demoLands.ts        가상 예시 데이터
  lib/search.ts           조건 검색·가격 표기
  types/land.ts           화면에 필요한 데이터 타입
  index.css               색상·레이아웃·모바일 스타일
tests/search.test.ts       필터 경계값과 예외 상황 검사
.github/                  PR·이슈 양식과 CI
```

React + TypeScript + Vite로 구성했습니다. 검색 규칙은 화면과 분리되어 있어 데이터 연결 작업과 UI 작업을 나눠 진행할 수 있습니다. 폰트는 Google Fonts의 Noto Sans KR을 사용하며, 로드되지 않으면 시스템 폰트로 표시합니다.

## 팀원이 이어서 채울 부분

- 실제 데이터의 필드와 `Land` 타입 간 매핑
- 데이터 조회 중·실패 상태, 실제 공고 상세 연결
- 실제 데이터로 조건 범위와 검색 결과 검증
- 토지 비교 설명과 담당자 문의 연결 방식

이번 템플릿의 범위는 선택형 검색 화면입니다. 위 항목은 구현되어 있지 않으며, 기존 과제의 상세 내용에 맞춰 팀에서 채웁니다. 담당자와 작업 방법은 [CONTRIBUTING.md](CONTRIBUTING.md)에 정리해 주세요.
