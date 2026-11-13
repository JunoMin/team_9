import { formatPrice } from '../lib/search'
import type { Land } from '../types/land'

interface Props {
  lands: Land[]
  onRemove: (land: Land) => void
  onClear: () => void
}

export function SelectedLots({ lands, onRemove, onClear }: Props) {
  return (
    <section className="selected-panel" aria-labelledby="selected-title">
      <div className="summary-heading">
        <h2 id="selected-title">검토할 필지</h2>
        <span>{lands.length}개</span>
      </div>
      {lands.length === 0 ? (
        <p className="selected-empty">결과 목록에서 상세 검토할 필지를 선택해 주세요.</p>
      ) : (
        <ul className="selected-list">
          {lands.map((land) => (
            <li key={land.id}>
              <span>
                <strong>{land.name}</strong>
                <small>
                  {land.useName} · {formatPrice(land.priceWon)}
                </small>
              </span>
              <button
                type="button"
                onClick={() => onRemove(land)}
                aria-label={`${land.name} 선택 해제`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {lands.length > 0 && (
        <button type="button" className="reset-button" onClick={onClear}>
          선택 모두 해제
        </button>
      )}
    </section>
  )
}
