import { searchSteps, selectedChoice } from '../config/searchSteps'
import type { SearchCriteria } from '../types/land'

interface Props {
  criteria: SearchCriteria
  onEdit: (index: number) => void
  onReset: () => void
}

export function SelectionSummary({ criteria, onEdit, onReset }: Props) {
  const selectedCount = searchSteps.filter((step) => selectedChoice(criteria, step)).length
  return (
    <aside className="summary-panel" aria-labelledby="summary-title">
      <div className="summary-heading">
        <h2 id="summary-title">내가 고른 조건</h2>
        <span>
          {selectedCount}
          <span className="muted"> / 4</span>
        </span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${selectedCount * 25}%` }} />
      </div>
      <dl className="summary-list">
        {searchSteps.map((step, index) => {
          const choice = selectedChoice(criteria, step)
          return (
            <div key={step.key}>
              <dt>{step.label}</dt>
              <dd>
                {choice ? (
                  <button
                    type="button"
                    onClick={() => onEdit(index)}
                    aria-label={`${step.label}: ${choice.label}, 수정`}
                  >
                    {choice.label}
                    <span aria-hidden="true">↗</span>
                  </button>
                ) : (
                  <span className="unselected">선택 전</span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
      <button
        type="button"
        className="reset-button"
        onClick={onReset}
        disabled={selectedCount === 0}
      >
        <span aria-hidden="true">↺</span> 조건 초기화
      </button>
      <p className="summary-tip">
        선택한 조건을 누르면
        <br />
        언제든 다시 바꿀 수 있어요.
      </p>
    </aside>
  )
}
