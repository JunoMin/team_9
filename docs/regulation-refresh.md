# 건축 규제 자료 정기 수집

Windows 작업 스케줄러로 LH청약플러스 **공고중 + 상담요청** 공고와 첨부파일을 수집합니다.
API 키 없이 웹페이지를 읽습니다. 기본은 한국 시간 **매일 03:00**입니다.
기존 토지 목록 API 갱신 워크플로와 독립적으로 실행합니다.

## 설정

`config/regulation-refresh.example.json`을 `config/regulation-refresh.local.json`으로 복사합니다.
로컬 설정은 Git에 올리지 않습니다. 경로는 저장소 기준 상대 경로 또는 절대 경로입니다.

- `time`: 실행 시각 (`03:00`, 한국 시간)
- `intervalDays`: 실행 간격 (1이면 매일, 7이면 7일마다)
- `enabled`: false이면 수집 중지
- `startDate`: 기본 1900-01-01. 오래된 상담요청 공고도 놓치지 않도록 날짜 하한을 넓게 둡니다.
- `workbook`: 수동 검토한 기존 공통양식 엑셀. 자동 생성 결과물을 넣지 않습니다.
- `outputDirectory`: PDF·엑셀·실행 기록을 저장할 폴더
- `maxDownloadMB`: 첨부파일 및 ZIP 추출 크기 상한. 초과 시 오류 기록, 기존 정상 결과 유지
- `pythonExecutable`, `nodeExecutable`, `artifactNodeModules`: 설치된 Python, Node, Codex 번들 Node 패키지 경로

Python 3.12 이상과 Codex 번들 `@oai/artifact-tool`이 필요합니다.
등록 스크립트는 Python 라이브러리를 출력 폴더에 설치하고 번들 Node 패키지에 junction을 연결합니다.
예약 실행 스크립트는 출력 폴더에도 복사하므로 저장소의 작업 브랜치 전환에 영향받지 않습니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/register-regulation-refresh.ps1
```

**시간·간격 또는 코드를 변경하면 위 명령을 다시 실행**합니다.
현재 Windows 시간대가 한국 표준시인지 검사하며, 로그인한 사용자 권한으로 실행합니다.
PC가 켜져 있고 사용자가 로그인되어 있어야 합니다. 절전 깨우기를 요청하지만 하드웨어 설정에 따라
깨우지 못할 수 있습니다. 예약을 놓치면 다음 실행 가능 시점에 실행합니다. 꺼진 PC를 켜지는 못합니다.

```powershell
# 즉시 실행 (중복 실행 방지 및 로그 기록 포함)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-regulation-refresh.ps1
# 다음 실행 시각
Get-ScheduledTaskInfo LH-Regulations-Nightly
# 중지
Disable-ScheduledTask LH-Regulations-Nightly
```

## 결과와 반영 범위

출력 폴더의 `LH_건축규제_자동갱신.xlsx`가 마지막 전체 수집 성공본입니다.
기준 엑셀의 원래 시트를 보존하고 다음 시트를 추가합니다.

- 자동공고: 지역별 현재 공고 상태와 원문 URL
- 자동파일: PDF·ZIP·지침 파일, 다운로드 URL, SHA256, 신규·변경 여부, 로컬 저장 경로
- 자동필지: 웹페이지 공급필지 표의 원문 머리글과 값
- 자동갱신안내: 확인 시각, 범위, 기존 시트와 최신 수집의 구분

모든 페이지를 순회하고 사이트 총건수와 비교합니다. PDF 서명, ZIP 형식, HTML 오류 응답을 검사합니다.
서버가 제공하면 ETag/Last-Modified로 재검증하고, 제공하지 않으면 다시 내려받아 SHA256을 비교합니다.
파일 ID가 같아도 내용 변경을 확인합니다. ZIP 안 지침도 안전한 파일명으로 추출합니다.
이전 원문은 삭제하지 않습니다. 보관 용량은 수집량에 따라 증가합니다.

오류가 하나라도 있으면 최신 성공 엑셀과 `latest.json`을 교체하지 않습니다.
`last-error.json`, 실행 로그, `runs/실행시각/manifest.json`에서 실패를 확인합니다.
엑셀이 열려 있어 교체에 실패한 경우에도 이전 성공 상태를 유지합니다.
`status.json`의 lastSuccess는 전체 수집과 엑셀 저장이 성공한 시각입니다.

**수집 자동화이며 규제값 해석·서비스 자동 배포는 아닙니다.** 기존 규제 표본과 선착순 원본의
건폐율·용적률·층수·연락처는 기준 엑셀 그대로 보존합니다. 신규·변경 지침은 검토 후 공통양식에
반영하고 [기존 변환 절차](regulations.md)로 서비스 데이터 PR을 만듭니다.
세종 외부 로그인 자료는 계속 제외합니다. 외부 사이트·별도 자료실 링크를 자동 탐색하지 않습니다.

## 검증

```powershell
# 설치된 Python으로 실행. 예: $python = 로컬 설정의 pythonExecutable
$env:PYTHONPATH = '../outputs/regulation-refresh/runtime/pydeps'
& $python -m unittest discover -s tests -p 'test_regulation_refresh.py'
& $python scripts/refresh-regulations.py --list-only
& $python scripts/refresh-regulations.py --limit 3
```

`--list-only`와 `--limit`은 시험 모드이며 최신 성공본을 덮어쓰지 않습니다.
