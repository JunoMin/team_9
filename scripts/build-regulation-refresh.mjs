import fs from 'node:fs/promises'
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool'

const [template, manifest, output] = process.argv.slice(2)
const data = JSON.parse(await fs.readFile(manifest, 'utf8'))
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(template))
console.log((await wb.inspect({ kind: 'sheet', include: 'id,name', maxChars: 1500 })).ndjson)
const literal = (v) => (typeof v === 'string' && /^[=+@-]/.test(v) ? `'${v}` : v)
const dateValue = (value) =>
  /^\d{4}\.\d{2}\.\d{2}$/.test(value || '')
    ? new Date(value.replaceAll('.', '-') + 'T00:00:00Z')
    : value || null
function sheet(name, headers, rows, widths) {
  if (wb.worksheets.items.some((s) => s.name === name)) {
    throw new Error(
      `Use the original reviewed workbook as template, not an automatic output: ${name}`,
    )
  }
  const ws = wb.worksheets.add(name)
  const end = Math.max(7, rows.length + 6)
  ws.showGridLines = false
  ws.getRange('A2').values = [[name]]
  ws.getRange('A2').format.font = { name: '맑은 고딕', size: 15, bold: true }
  ws.getRange('A4').values = [
    [`확인: ${data.checkedAt} · ${data.complete ? '전체 수집 완료' : '시험 수집 (일부 공고)'}`],
  ]
  ws.getRangeByIndexes(5, 0, 1, headers.length).values = [headers]
  if (rows.length)
    ws.getRangeByIndexes(6, 0, rows.length, headers.length).values = rows.map((r) => r.map(literal))
  const all = ws.getRangeByIndexes(5, 0, end - 5, headers.length)
  all.format.font = { name: '맑은 고딕', size: 10 }
  all.format.verticalAlignment = 'center'
  all.format.rowHeight = 48
  all.format.wrapText = true
  ws.getRangeByIndexes(5, 0, 1, headers.length).format = {
    fill: '#233E62',
    font: { bold: true, color: '#FFFFFF' },
    horizontalAlignment: 'center',
    rowHeight: 32,
  }
  widths.forEach((width, i) => {
    ws.getRangeByIndexes(5, i, end - 5, 1).format.columnWidth = width
  })
  const last = String.fromCharCode(64 + headers.length)
  ws.tables.add(`A6:${last}${end}`, true, `RefreshTable${wb.worksheets.items.length}`)
  ws.freezePanes.freezeRows(6)
  ws.freezePanes.freezeColumns(2)
  return ws
}
const files = [],
  parcels = []
for (const n of data.notices) {
  for (const a of n.attachments || []) {
    files.push([
      n.region,
      n.id,
      a.id,
      a.name,
      a.path || '',
      a.sha256 || '',
      a.bytes ?? null,
      a.changed ? '신규·변경 (검토 필요)' : '변경 없음',
      a.url,
      a.error || '',
      n.url,
    ])
    for (const e of a.extracted || [])
      files.push([
        n.region,
        n.id,
        a.id,
        e.name,
        e.path,
        e.sha256,
        e.bytes,
        'ZIP 내부 (검토 필요)',
        a.url,
        '',
        n.url,
      ])
  }
  for (const p of n.parcels || [])
    parcels.push([
      n.region,
      n.id,
      n.title,
      JSON.stringify(p.headers),
      JSON.stringify(p.cells),
      n.url,
    ])
}
const notices = sheet(
  '자동공고',
  [
    '지역',
    '공고 ID',
    '공고명',
    '게시일',
    '마감일',
    '상태',
    '수집 파일 수',
    '원문 URL',
    '제외 사유',
  ],
  data.notices.map((n) => [
    n.region,
    n.id,
    n.title,
    dateValue(n.posted),
    dateValue(n.deadline),
    n.status,
    n.attachments?.length || 0,
    n.url,
    n.excluded || '',
  ]),
  [20, 18, 65, 15, 15, 14, 14, 45, 30],
)
notices.getRange(`D7:E${Math.max(7, data.notices.length + 6)}`).setNumberFormat('yyyy-mm-dd')
sheet(
  '자동파일',
  [
    '지역',
    '공고 ID',
    '파일 ID',
    '파일명',
    '저장 경로',
    'SHA256',
    '크기(byte)',
    '변경 상태',
    '다운로드 URL',
    '오류',
    '공고 URL',
  ],
  files,
  [20, 18, 18, 65, 55, 35, 16, 28, 45, 30, 45],
)
sheet(
  '자동필지',
  ['지역', '공고 ID', '공고명', '원문 표 머리글', '원문 필지 값', '공고 URL'],
  parcels,
  [20, 18, 65, 60, 80, 45],
)
sheet(
  '자동갱신안내',
  ['항목', '내용'],
  [
    ['확인 시각', data.checkedAt],
    [
      '수집 범위',
      `${data.scope.startDate} ~ ${data.scope.endDate} / ${data.scope.statuses.join(', ')}`,
    ],
    [
      '기존 시트',
      '기준 엑셀의 수동 검토 데이터와 선착순원본은 기존 기준일 그대로 보존합니다. 최신 웹 자료는 자동공고·자동파일·자동필지에 있습니다.',
    ],
    [
      '규제값',
      '신규·변경 PDF의 건폐율·용적률·층수는 수동 검토 후 반영합니다. 자동 수집일은 규제 검증일이 아닙니다.',
    ],
    ['외부 로그인', '사용자 요청으로 세종 외부 로그인 자료는 수집하지 않습니다.'],
    ['이번 목록에서 빠진 공고', data.absentNoticeIds?.join(', ') || '없음'],
    [
      '서비스 반영',
      '자동 배포하지 않습니다. 검토한 공통양식 엑셀을 기존 import-regulations.py로 변환한 후 검사·PR·배포합니다.',
    ],
  ],
  [25, 110],
)
wb.recalculate()
console.log(
  (
    await wb.inspect({
      kind: 'region',
      sheetId: notices.name,
      range: 'A6:H9',
      maxChars: 1800,
      tableMaxCols: 8,
    })
  ).ndjson,
)
if (process.env.REGULATION_PREVIEW === '1') {
  const image = await wb.render({
    sheetName: notices.name,
    range: 'A1:G10',
    scale: 1,
    format: 'png',
  })
  await fs.writeFile(output + '.png', new Uint8Array(await image.arrayBuffer()))
}
await (await SpreadsheetFile.exportXlsx(wb)).save(output)
console.log('Workbook saved:', output)
