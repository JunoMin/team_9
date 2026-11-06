import type { Land } from '../types/land.ts'

// PRD Section 3의 0단계: 사람이 내려받아 등록한 지구단위계획 시행지침 목록입니다.
// 실제 목록은 guidelines/registry.json에 있고, A02가 이 목록을 읽어 색인합니다.
export interface GuidelineEntry {
  district: string
  noticeIds: string[]
  title: string
  file: string
  sourceUrl: string
  downloadedOn: string
  registeredBy: string
  note?: string
}

export interface GuidelineRegistry {
  version: 1
  entries: GuidelineEntry[]
}

// 공고 필지는 공고ID로, 수의계약 필지는 사업지구명으로 지침과 연결합니다.
export function guidelinesFor(registry: GuidelineRegistry, land: Land): GuidelineEntry[] {
  return registry.entries.filter(
    (entry) =>
      (land.noticeId !== undefined && entry.noticeIds.includes(land.noticeId)) ||
      (land.districtName !== undefined && entry.district === land.districtName),
  )
}

export function validateRegistry(registry: GuidelineRegistry): string[] {
  const errors: string[] = []
  if (registry.version !== 1) errors.push('version은 1이어야 합니다.')
  registry.entries.forEach((entry, index) => {
    const where = `entries[${index}]`
    for (const key of ['district', 'title', 'file', 'sourceUrl', 'downloadedOn'] as const) {
      if (!entry[key]?.trim()) errors.push(`${where}.${key}가 비어 있습니다.`)
    }
    if (!entry.file.startsWith('guidelines/files/'))
      errors.push(`${where}.file은 guidelines/files/ 아래에 두어야 합니다.`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.downloadedOn))
      errors.push(`${where}.downloadedOn은 YYYY-MM-DD 형식이어야 합니다.`)
  })
  return errors
}
