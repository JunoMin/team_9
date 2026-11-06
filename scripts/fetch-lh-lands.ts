// LH 토지 데이터를 받아 src/data/lhLands.generated.ts로 저장합니다.
//
//   pnpm data:lh   (.env 또는 환경변수에 LH_SERVICE_KEY 필요)
//
// 1. 공공데이터포털 B552555 분양임대공고문 조회로 판매 중인 토지 공고 목록을 받습니다.
// 2. 공고별 공급정보 조회로 필지(용도·주소·면적·가격)를 받습니다.
// 3. 선착순 수의계약 필지는 OpenAPI에 없어 LH청약플러스 페이지의 숨은 JSON(dsDbsListJson)에서 읽습니다.
//
// 인증키는 이 스크립트에서만 쓰고 결과 파일과 브라우저 번들에는 넣지 않습니다.
import { writeFile } from 'node:fs/promises'
import { type LhLot, toIsoDate, toLand, toNumber } from '../src/data/lhMapping.ts'
import type { Land } from '../src/types/land.ts'

const API = 'https://apis.data.go.kr/B552555'
const LIST_URL = `${API}/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1`
const SUPPLY_URL = `${API}/lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1`
const SUUI_URL =
  'https://apply.lh.or.kr/lhapply/apply/bor_ctrt_psb_dst/0/lfn_getTabChange.do?mi=201527'
const OUTPUT = new URL('../src/data/lhLands.generated.ts', import.meta.url)

const LAND_TYPE = '01' // 공고유형코드 UPP_AIS_TP_CD: 토지
const OPEN_STATUSES = ['공고중', '접수중', '정정공고중'] // 접수마감 공고는 제외
const MONTHS = 6
const MAX_RPS = 10 // 게이트웨이 호출 제한보다 낮게 유지

type Row = Record<string, unknown>

const serviceKey = process.env.LH_SERVICE_KEY?.trim()
if (!serviceKey) {
  console.error('LH_SERVICE_KEY가 없습니다. .env.example을 .env로 복사해 인증키를 넣어 주세요.')
  process.exit(1)
}

let nextSlot = 0
async function throttle() {
  const now = Date.now()
  const wait = nextSlot - now
  nextSlot = Math.max(now, nextSlot) + 1000 / MAX_RPS
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
}

// 응답은 [{resHeader}, {dsList...}] 배열이라 하나의 객체로 합칩니다.
async function getApi(url: string, params: Record<string, string>): Promise<Row> {
  const query = new URLSearchParams({ serviceKey: serviceKey!, ...params })
  for (let attempt = 0; ; attempt++) {
    await throttle()
    const response = await fetch(`${url}?${query}`, { headers: { Accept: 'application/json' } })
    if (response.status === 429 && attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)))
      continue
    }
    const body = await response.text()
    let data: unknown
    try {
      data = JSON.parse(body)
    } catch {
      // 인증 오류 등 게이트웨이 오류는 XML로 옵니다.
      throw new Error(`API 응답이 JSON이 아닙니다 (${response.status}): ${body.slice(0, 200)}`)
    }
    const merged: Row = Object.assign({}, ...(Array.isArray(data) ? data : [data]))
    const header = (merged.resHeader as Row[] | undefined)?.[0]
    if (header && header.SS_CODE !== 'Y') throw new Error(`API 오류: ${JSON.stringify(header)}`)
    return merged
  }
}

function yyyymmdd(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '')
}

async function listNotices(status: string): Promise<Row[]> {
  const end = new Date()
  const start = new Date(end.getTime() - MONTHS * 30 * 86_400_000)
  const rows: Row[] = []
  for (let page = 1; page <= 20; page++) {
    const data = await getApi(LIST_URL, {
      PG_SZ: '100',
      PAGE: String(page),
      UPP_AIS_TP_CD: LAND_TYPE,
      PAN_ST_DT: yyyymmdd(start),
      PAN_ED_DT: yyyymmdd(end),
      PAN_SS: status,
    })
    const chunk = (data.dsList as Row[] | undefined) ?? []
    rows.push(...chunk)
    if (!chunk.length || rows.length >= Number(chunk[0].ALL_CNT ?? 0)) break
  }
  return rows
}

// 입찰(dsList01)은 예정가격, 추첨(dsList02)은 공급가격을 씁니다.
async function noticeLots(notice: Row): Promise<LhLot[]> {
  const params: Record<string, string> = {
    SPL_INF_TP_CD: String(notice.SPL_INF_TP_CD),
    CCR_CNNT_SYS_DS_CD: String(notice.CCR_CNNT_SYS_DS_CD),
    PAN_ID: String(notice.PAN_ID),
    UPP_AIS_TP_CD: String(notice.UPP_AIS_TP_CD),
  }
  if (notice.AIS_TP_CD) params.AIS_TP_CD = String(notice.AIS_TP_CD)
  const data = await getApi(SUPPLY_URL, params)
  const lists = [
    ['dsList01', '입찰', 'SPL_XPC_AMT'],
    ['dsList02', '추첨', 'SPL_AMT'],
  ] as const
  return lists.flatMap(([key, saleMethod, priceField]) =>
    ((data[key] as Row[] | undefined) ?? []).map((row) => ({
      source: 'lh-notice' as const,
      noticeId: String(notice.PAN_ID),
      noticeName: String(notice.PAN_NM ?? ''),
      regionName: String(notice.CNP_CD_NM ?? ''),
      districtName: '',
      status: String(notice.PAN_SS ?? ''),
      postedOn: String(notice.PAN_NT_ST_DT ?? ''),
      closesOn: String(notice.CLSG_DT ?? ''),
      detailUrl: String(notice.DTL_URL ?? '').trim(),
      saleMethod,
      useName: String(row.LND_US_DS_CD_NM ?? ''),
      address: String(row.LGDN_DTL_ADR ?? ''),
      lotNo: String(row.LNO ?? ''),
      areaM2: toNumber(row.AR),
      priceWon: toNumber(row[priceField]),
      contactPhone: '',
    })),
  )
}

function unescapeHtml(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

async function suuiLots(): Promise<LhLot[]> {
  const response = await fetch(SUUI_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const page = await response.text()
  const match = page.match(/name=['"]dsDbsListJson['"]\s+value='([\s\S]*?)'\s*\/?>/)
  if (!match) throw new Error('수의계약 페이지에서 dsDbsListJson을 찾지 못했습니다.')
  const rows = JSON.parse(unescapeHtml(match[1])) as Row[]
  return rows.map((row) => ({
    source: 'lh-suui' as const,
    noticeId: `SUUI-${row.bzdtCd}`,
    noticeName: `${row.bzdtNm ?? ''} 선착순 수의계약`,
    regionName: String(row.cnpNm ?? ''),
    districtName: String(row.bzdtNm ?? ''),
    status: '수의계약중',
    postedOn: '',
    closesOn: '',
    detailUrl: SUUI_URL,
    saleMethod: '수의계약' as const,
    useName: String(row.stlSplPpNm || row.stlSplPpCsNm || ''),
    address: [row.cnpNm, row.bzdtNm, row.lctAraNm].filter(Boolean).join(' '),
    lotNo: String(row.cfmt || row.cfmtXpc || ''),
    areaM2: toNumber(row.lndAr),
    priceWon: toNumber(row.splAmt),
    contactPhone: String(row.iqyTlno ?? ''),
    suui: {
      zoning: String(row.ppAraNm ?? '') || undefined,
      buildingCoverage: toNumber(row.btlrRt) ?? undefined,
      floorAreaRatio: toNumber(row.bukRt) ?? undefined,
      paymentMethod: String(row.stlPcRcpMdDsNm ?? '') || undefined,
      paymentMonths: toNumber(row.pcPymCnMcnt) ?? undefined,
      usableFrom: toIsoDate(row.lndUsPsbDt),
      brokerAllowed: row.trdMdtLndYn === 'Y',
    },
  }))
}

async function main() {
  const notices = new Map<string, Row>()
  for (const status of OPEN_STATUSES) {
    for (const notice of await listNotices(status)) notices.set(String(notice.PAN_ID), notice)
  }
  console.log(`판매 중 토지 공고 ${notices.size}건`)

  const lots: LhLot[] = []
  const failed: string[] = []
  await Promise.all(
    [...notices.values()].map(async (notice) => {
      try {
        lots.push(...(await noticeLots(notice)))
      } catch (error) {
        failed.push(`${notice.PAN_ID} ${notice.PAN_NM}: ${(error as Error).message}`)
      }
    }),
  )
  const suui = await suuiLots()
  console.log(`공고 필지 ${lots.length}건, 수의계약 필지 ${suui.length}건`)
  lots.push(...suui)

  // 같은 공고 안에서 지번이 겹칠 수 있어 순번을 붙여 id를 유일하게 만듭니다.
  const seen = new Map<string, number>()
  const lands: Land[] = []
  for (const lot of lots) {
    const base = `${lot.noticeId}-${lot.saleMethod}-${lot.lotNo || 'lot'}`
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    const land = toLand(lot, count === 1 ? base : `${base}-${count}`)
    if (land) lands.push(land)
  }
  lands.sort((a, b) => a.id.localeCompare(b.id))

  const fetchedAt = new Date().toISOString()
  const body = [
    '// 자동 생성 파일입니다. 직접 고치지 말고 `pnpm data:lh`로 다시 만드세요.',
    `// 출처: LH 분양임대공고 OpenAPI(공고중·접수중·정정공고중) + LH청약플러스 선착순 수의계약 토지`,
    "import type { Land } from '../types/land.ts'",
    '',
    `export const lhLandsFetchedAt = '${fetchedAt}'`,
    '',
    // 객체 리터럴 수천 개는 tsc 타입 추론이 감당하지 못해, 필지마다 JSON 한 줄로 두고 읽을 때 파싱합니다.
    'const rows: string[] = [',
    ...lands.map((land) => `  ${JSON.stringify(JSON.stringify(land))},`),
    ']',
    '',
    'export const lhLands: Land[] = rows.map((row) => JSON.parse(row) as Land)',
    '',
  ].join('\n')
  await writeFile(OUTPUT, body, 'utf8')

  console.log(`필지 ${lands.length}건 저장 (가격·면적 없음 ${lots.length - lands.length}건 제외)`)
  if (failed.length) {
    console.warn(`공급정보 조회 실패 ${failed.length}건:\n  ${failed.slice(0, 10).join('\n  ')}`)
  }
}

await main()
