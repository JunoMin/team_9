import { useState } from 'react'
import { formatPrice, labelFor } from '../lib/search'
import type { Land } from '../types/land'

interface Props {
  lands: Land[]
  onEdit: () => void
}

export function Results({ lands, onEdit }: Props) {
  const [order, setOrder] = useState('price')
  const sorted =
    order === 'area'
      ? [...lands].sort((a, b) => a.areaM2 - b.areaM2 || a.priceWon - b.priceWon)
      : lands

  if (lands.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          ⌕
        </span>
        <h3>이 조건에 맞는 예시가 없어요</h3>
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
          조건에 맞는 예시 <strong>{lands.length}개</strong>
        </p>
        <label className="sort-label">
          <span className="sr-only">결과 정렬</span>
          <select value={order} onChange={(event) => setOrder(event.target.value)}>
            <option value="price">가격 낮은 순</option>
            <option value="area">면적 작은 순</option>
          </select>
        </label>
      </div>
      <ul className="result-list">
        {sorted.map((land) => (
          <li key={land.id} className="land-card">
            <div className="land-description">
              <div className="land-tags">
                <span>{labelFor('purpose', land.purpose)}</span>
                <span className="example-tag">예시</span>
              </div>
              <h3>{land.name}</h3>
              <p>{labelFor('region', land.region)} · 가상 토지</p>
            </div>
            <dl className="land-numbers">
              <div>
                <dt>면적</dt>
                <dd>
                  {land.areaM2.toLocaleString('ko-KR')}㎡{' '}
                  <small>약 {Math.round(land.areaM2 / 3.3058)}평</small>
                </dd>
              </div>
              <div>
                <dt>전체 가격</dt>
                <dd className="price">{formatPrice(land.priceWon)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <p className="results-note">화면 개발용 예시입니다. 실제 공급 토지와 가격이 아닙니다.</p>
    </>
  )
}
