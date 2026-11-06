// PRD 0단계 준비: 판매 중인 공고·지구별로 시행지침을 받아야 할 곳과 등록 여부를 정리합니다.
//
//   pnpm guidelines:targets   → guidelines/TARGETS.md 생성
//
// 지침 파일은 사람이 공고 상세의 첨부파일에서 내려받아 guidelines/files/에 넣고
// guidelines/registry.json에 한 줄 추가합니다 (docs/handoff.md 참고).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import {
  type GuidelineRegistry,
  guidelinesFor,
  validateRegistry,
} from '../src/data/guidelineRegistry.ts'
import { lhLands, lhLandsFetchedAt } from '../src/data/lhLands.generated.ts'
import type { Land } from '../src/types/land.ts'

const root = new URL('../', import.meta.url)
const registry = JSON.parse(
  readFileSync(new URL('guidelines/registry.json', root), 'utf8'),
) as GuidelineRegistry

const errors = validateRegistry(registry)
for (const entry of registry.entries) {
  if (!existsSync(new URL(entry.file, root))) errors.push(`파일이 없습니다: ${entry.file}`)
}
if (errors.length) {
  console.error(`guidelines/registry.json 확인 필요:\n  ${errors.join('\n  ')}`)
  process.exit(1)
}

interface Target {
  key: string
  name: string
  region: string
  link: string
  lands: Land[]
}

// 공고는 공고ID 단위, 수의계약은 사업지구 단위로 묶습니다.
const targets = new Map<string, Target>()
for (const land of lhLands) {
  const isSuui = land.source === 'lh-suui'
  const key = isSuui ? `지구:${land.districtName}` : `공고:${land.noticeId}`
  const target = targets.get(key) ?? {
    key,
    name: isSuui ? `${land.districtName} (수의계약)` : (land.noticeName ?? ''),
    region: land.regionName ?? '',
    link: isSuui ? '' : (land.detailUrl ?? ''),
    lands: [],
  }
  target.lands.push(land)
  targets.set(key, target)
}

const rows = [...targets.values()]
  .map((target) => ({ ...target, registered: guidelinesFor(registry, target.lands[0]) }))
  .sort((a, b) => b.lands.length - a.lands.length)

const escape = (text: string) => text.replaceAll('|', '\\|')
const lines = [
  '<!-- 자동 생성 파일입니다. `pnpm guidelines:targets`로 다시 만드세요. -->',
  '',
  '# 시행지침 수집 대상',
  '',
  `LH 데이터 기준: ${lhLandsFetchedAt.slice(0, 10)} · 대상 ${rows.length}곳 · 등록 ${rows.filter((row) => row.registered.length).length}곳`,
  '',
  '공고는 상세 페이지 첨부파일에서, 수의계약 지구는 LH청약플러스 해당 사업지구 공고에서 시행지침을 찾습니다.',
  '',
  '| 등록 | 공고·지구 | 시도 | 필지 수 | 공고 상세 | 등록된 지침 |',
  '| --- | --- | --- | ---: | --- | --- |',
  ...rows.map((row) =>
    [
      row.registered.length ? '✅' : '⬜',
      escape(row.name),
      row.region,
      row.lands.length,
      row.link ? `[열기](${row.link})` : '',
      escape(row.registered.map((entry) => entry.title).join(', ')),
    ]
      .join(' | ')
      .replace(/^/, '| ')
      .concat(' |'),
  ),
  '',
]
writeFileSync(new URL('guidelines/TARGETS.md', root), lines.join('\n'), 'utf8')
console.log(
  `대상 ${rows.length}곳 정리 (등록 ${rows.filter((row) => row.registered.length).length}곳)`,
)
