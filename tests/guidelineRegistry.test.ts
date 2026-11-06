import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  type GuidelineEntry,
  type GuidelineRegistry,
  guidelinesFor,
  validateRegistry,
} from '../src/data/guidelineRegistry.ts'
import type { Land } from '../src/types/land.ts'

const entry: GuidelineEntry = {
  district: '창원가포',
  noticeIds: ['BN-0008055'],
  title: '창원가포 지구단위계획 시행지침',
  file: 'guidelines/files/창원가포/시행지침.pdf',
  sourceUrl: 'https://apply.lh.or.kr/',
  downloadedOn: '2026-11-06',
  registeredBy: 'tester',
}
const registry: GuidelineRegistry = { version: 1, entries: [entry] }
const land: Land = {
  id: 'x',
  name: 'x',
  region: 'gyeongnam',
  purpose: 'detached',
  areaM2: 1,
  priceWon: 1,
}

test('저장소의 registry.json은 형식 검사를 통과한다', () => {
  const saved = JSON.parse(
    readFileSync(new URL('../guidelines/registry.json', import.meta.url), 'utf8'),
  ) as GuidelineRegistry
  assert.deepEqual(validateRegistry(saved), [])
})

test('공고ID 또는 사업지구명으로 지침을 찾는다', () => {
  assert.equal(guidelinesFor(registry, { ...land, noticeId: 'BN-0008055' }).length, 1)
  assert.equal(guidelinesFor(registry, { ...land, districtName: '창원가포' }).length, 1)
  assert.equal(guidelinesFor(registry, { ...land, noticeId: 'BN-0000000' }).length, 0)
})

test('빈 값·경로·날짜 형식 오류를 알려 준다', () => {
  const errors = validateRegistry({
    version: 1,
    entries: [{ ...entry, title: '', file: 'other/a.pdf', downloadedOn: '2026.11.06' }],
  })
  assert.equal(errors.length, 3)
})
