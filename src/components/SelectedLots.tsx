import { useState } from 'react'
import { lhLandsFetchedAt } from '../data/lhLands.generated'
import { buildPayload, saveSelectedLots } from '../handoff/selectedLots'
import { formatPrice } from '../lib/search'
import type { Land } from '../types/land'

interface Props {
  lands: Land[]
  onRemove: (land: Land) => void
  onClear: () => void
}

// PRD 3단계 [HITL]: 사람이 고른 필지를 A02(규제)·A03(실거래) 입력 JSON으로 넘깁니다.
export function SelectedLots({ lands, onRemove, onClear }: Props) {
  const [handedOff, setHandedOff] = useState<{ at: string; count: number; key: string } | null>(
    null,
  )

  const selectionKey = lands.map((land) => land.id).join('|')

  function handOff() {
    const payload = buildPayload(lands, lhLandsFetchedAt)
    saveSelectedLots(payload)
    setHandedOff({
      at: new Date().toLocaleTimeString('ko-KR'),
      count: lands.length,
      key: selectionKey,
    })
  }

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
      <button
        type="button"
        className="button primary handoff-button"
        disabled={lands.length === 0}
        onClick={handOff}
      >
        {handedOff?.key === selectionKey
          ? `✓ 넘기기 완료 (${handedOff.count}개)`
          : '규제·시세 분석으로 넘기기'}
      </button>
      {lands.length > 0 && (
        <button type="button" className="reset-button" onClick={onClear}>
          선택 모두 해제
        </button>
      )}
      <p className="summary-tip" role="status">
        {handedOff
          ? `${handedOff.at}에 선택 필지 ${handedOff.count}개를 다음 분석 단계로 넘겼어요.`
          : '선택한 필지 정보는 이 브라우저에 저장되어 다음 분석 단계에서 씁니다.'}
      </p>
    </section>
  )
}
