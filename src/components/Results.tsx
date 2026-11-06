import { useState } from 'react'
import { dateStamp, downloadFile } from '../lib/download'
import { formatPrice, labelFor, pricePerM2, sortLands, toCsv, type SortOrder } from '../lib/search'
import type { Land } from '../types/land'
import { LandRegulations } from './LandRegulations'

const PAGE_SIZE = 20

interface Props {
  lands: Land[]
  selectedIds: ReadonlySet<string>
  onToggle: (land: Land) => void
  onEdit: () => void
}

export function Results({ lands, selectedIds, onToggle, onEdit }: Props) {
  const [order, setOrder] = useState<SortOrder>('price')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sorted = sortLands(lands, order)

  if (lands.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          ⌕
        </span>
        <h3>이 조건에 맞는 토지가 없어요</h3>
        <p>예산이나 면적 범위를 넓혀 다시 찾아보세요.</p>
        <button type="button" className="button secondary" onClick={onEdit}>
          조건 바꾸기
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="results-toolbar">
        <p>
          조건에 맞는 필지 <strong>{lands.length.toLocaleString('ko-KR')}개</strong>
        </p>
        <div className="results-actions">
          <button
            type="button"
            className="text-button"
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
              <option value="price">가격 낮은 순</option>
              <option value="pricePerM2">㎡당 가격 낮은 순</option>
              <option value="area">면적 작은 순</option>
            </select>
          </label>
        </div>
      </div>
      <ul className="result-list">
        {sorted.slice(0, visible).map((land) => {
          const selected = selectedIds.has(land.id)
          return (
            <li key={land.id} className={`land-card ${selected ? 'is-selected' : ''}`}>
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
                        공고 보기<span className="sr-only"> (새 창)</span> ↗
                      </a>
                    </>
                  )}
                </p>
                <label className="select-lot">
                  <input type="checkbox" checked={selected} onChange={() => onToggle(land)} />
                  상세 검토할 필지로 선택
                </label>
              </div>
              <dl className="land-numbers">
                <div>
                  <dt>면적</dt>
                  <dd>
                    {land.areaM2.toLocaleString('ko-KR')}㎡{' '}
                    <small>약 {Math.round(land.areaM2 / 3.3058).toLocaleString('ko-KR')}평</small>
                  </dd>
                </div>
                <div>
                  <dt>㎡당</dt>
                  <dd>{pricePerM2(land).toLocaleString('ko-KR')}원</dd>
                </div>
                <div>
                  <dt>{land.saleMethod === '입찰' ? '예정가격' : '공급가격'}</dt>
                  <dd className="price">{formatPrice(land.priceWon)}</dd>
                </div>
              </dl>
              <LandRegulations />
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
    </>
  )
}
