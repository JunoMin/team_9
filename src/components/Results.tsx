import { useState } from 'react'
import { dateStamp, downloadFile } from '../lib/download'
import { marketPriceUrl, naverMapUrl } from '../lib/mapLink'
import {
  areaPyeong,
  filterByUse,
  formatPrice,
  labelFor,
  pricePerM2,
  pricePerPyeong,
  sortLands,
  suuiPayment,
  toCsv,
  useNameCounts,
  type SortOrder,
} from '../lib/search'
import type { Land } from '../types/land'
import { RegulationsDialog } from './RegulationsDialog'

const PAGE_SIZE = 20
const USE_CHIP_LIMIT = 12

interface Props {
  lands: Land[]
  useKeyword: string
  onUseKeyword: (keyword: string) => void
  selectedIds: ReadonlySet<string>
  onToggle: (land: Land) => void
  onEdit: () => void
}

const manwon = (won: number) => `${Math.round(won / 10_000).toLocaleString('ko-KR')}만 원`

// 수의계약 목록에만 있는 용도지역·건폐율·납부 조건 등을 한 줄로 보여 줍니다.
function suuiFacts(land: Land): string[] {
  const detail = land.suui
  if (!detail) return []
  const { buildingCoverage: bcr, floorAreaRatio: far } = detail
  return [
    detail.zoning ?? '',
    bcr !== undefined || far !== undefined ? `건폐율 ${bcr ?? '-'}% / 용적률 ${far ?? '-'}%` : '',
    suuiPayment(land),
    detail.usableFrom ? `${detail.usableFrom.replaceAll('-', '.')} 사용 가능` : '',
    detail.brokerAllowed ? '중개 알선 가능' : '',
    land.contactPhone ? `문의 ${land.contactPhone}` : '',
  ].filter(Boolean)
}

export function Results({ lands, useKeyword, onUseKeyword, selectedIds, onToggle, onEdit }: Props) {
  const [order, setOrder] = useState<SortOrder>('price')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [regulationsLand, setRegulationsLand] = useState<Land | null>(null)
  const filtered = filterByUse(lands, useKeyword)
  const sorted = sortLands(filtered, order)
  const uses = useNameCounts(lands).slice(0, USE_CHIP_LIMIT)

  if (lands.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          ⌕
        </span>
        <h3>이 조건에 맞는 토지가 없어요</h3>
        <p>지역을 더 고르거나 예산·면적 범위를 넓혀 다시 찾아보세요.</p>
        <button type="button" className="button secondary" onClick={onEdit}>
          조건 바꾸기
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="use-chips" role="group" aria-label="용도로 좁히기">
        {uses.map(([use, count]) => (
          <button
            key={use}
            type="button"
            aria-pressed={useKeyword === use}
            onClick={() => {
              onUseKeyword(useKeyword === use ? '' : use)
              setVisible(PAGE_SIZE)
            }}
          >
            {use} <span>{count.toLocaleString('ko-KR')}</span>
          </button>
        ))}
        {useKeyword && !uses.some(([use]) => use === useKeyword) && (
          <button type="button" aria-pressed="true" onClick={() => onUseKeyword('')}>
            ‘{useKeyword}’ 포함 <span>×</span>
          </button>
        )}
      </div>
      <div className="results-toolbar">
        <p>
          조건에 맞는 필지 <strong>{filtered.length.toLocaleString('ko-KR')}개</strong>
          {useKeyword && (
            <span className="muted"> / 전체 {lands.length.toLocaleString('ko-KR')}개</span>
          )}
        </p>
        <div className="results-actions">
          <button
            type="button"
            className="text-button"
            disabled={sorted.length === 0}
            onClick={() =>
              downloadFile(
                `lh-토지후보-${dateStamp()}.csv`,
                toCsv(sorted),
                'text/csv;charset=utf-8',
              )
            }
          >
            CSV 내려받기
          </button>
          <label className="sort-label">
            <span className="sr-only">결과 정렬</span>
            <select value={order} onChange={(event) => setOrder(event.target.value as SortOrder)}>
              <option value="price">총액 낮은 순</option>
              <option value="unitPrice">평당가 낮은 순</option>
              <option value="area">면적 작은 순</option>
            </select>
          </label>
        </div>
      </div>
      {sorted.length === 0 && (
        <div className="empty-state">
          <h3>‘{useKeyword}’이(가) 들어간 용도가 없어요</h3>
          <button type="button" className="button secondary" onClick={() => onUseKeyword('')}>
            용도 단어 지우기
          </button>
        </div>
      )}
      <ul className="result-list">
        {sorted.slice(0, visible).map((land) => {
          const selected = selectedIds.has(land.id)
          const facts = suuiFacts(land)
          return (
            <li key={land.id} className={`land-card ${selected ? 'is-selected' : ''}`}>
              <a
                className="market-button"
                href={marketPriceUrl(land, import.meta.env.BASE_URL)}
                target="_blank"
                rel="noreferrer"
              >
                3km 내 시세<span className="sr-only"> (새 창)</span> ↗
              </a>
              <div className="land-description">
                <div className="land-tags">
                  <span>{land.useName ?? labelFor('purpose', land.purpose)}</span>
                  {land.saleMethod && <span className="method-tag">{land.saleMethod}</span>}
                  {land.closesOn && <span className="muted-tag">{land.closesOn} 마감</span>}
                </div>
                <h3>{land.name}</h3>
                <p>
                  {land.districtName ?? land.noticeName}
                  {land.detailUrl && (
                    <>
                      {' · '}
                      <a href={land.detailUrl} target="_blank" rel="noreferrer">
                        {land.source === 'lh-suui' ? '수의계약 목록' : '공고 보기'}
                        <span className="sr-only"> (새 창)</span> ↗
                      </a>
                    </>
                  )}
                </p>
                {facts.length > 0 && <p className="suui-facts">{facts.join(' · ')}</p>}
                <div className="card-actions">
                  <label className="select-lot">
                    <input type="checkbox" checked={selected} onChange={() => onToggle(land)} />
                    상세 검토할 필지로 선택
                  </label>
                  <button
                    type="button"
                    className="regulations-button"
                    aria-haspopup="dialog"
                    onClick={() => setRegulationsLand(land)}
                  >
                    건축 규제 보기
                  </button>
                  <a
                    className="regulations-button"
                    href={naverMapUrl(land)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    네이버 지도<span className="sr-only"> (새 창)</span> ↗
                  </a>
                </div>
              </div>
              <dl className="land-numbers">
                <div>
                  <dt>면적</dt>
                  <dd>
                    {areaPyeong(land).toLocaleString('ko-KR')}평{' '}
                    <small>{land.areaM2.toLocaleString('ko-KR')}㎡</small>
                  </dd>
                </div>
                <div>
                  <dt>평당가</dt>
                  <dd>
                    {manwon(pricePerPyeong(land))} <small>㎡당 {manwon(pricePerM2(land))}</small>
                  </dd>
                </div>
                <div>
                  <dt>{land.saleMethod === '입찰' ? '예정가격' : '공급가격'}</dt>
                  <dd className="price">{formatPrice(land.priceWon)}</dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
      {visible < sorted.length && (
        <button
          type="button"
          className="button secondary more-button"
          onClick={() => setVisible(visible + PAGE_SIZE)}
        >
          더 보기 ({visible.toLocaleString('ko-KR')} / {sorted.length.toLocaleString('ko-KR')})
        </button>
      )}
      <p className="results-note">
        LH 공고·수의계약 목록 기준 참고 정보입니다. 신청 전 반드시 공고문 원문을 확인하세요.
      </p>
      <RegulationsDialog land={regulationsLand} onClose={() => setRegulationsLand(null)} />
    </>
  )
}
