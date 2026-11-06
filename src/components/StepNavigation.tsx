import { isStepDone, searchSteps } from '../config/searchSteps'
import type { SearchCriteria } from '../types/land'

interface Props {
  criteria: SearchCriteria
  current: number
  onNavigate: (index: number) => void
}

export function StepNavigation({ criteria, current, onNavigate }: Props) {
  return (
    <nav className="step-navigation" aria-label="검색 조건 선택 단계">
      <ol>
        {searchSteps.map((step, index) => {
          const completed = isStepDone(criteria, step)
          const available = searchSteps
            .slice(0, index)
            .every((prior) => isStepDone(criteria, prior))
          return (
            <li key={step.key}>
              <button
                type="button"
                className={`step ${current === index ? 'is-current' : ''} ${completed ? 'is-complete' : ''}`}
                aria-current={current === index ? 'step' : undefined}
                disabled={!available}
                onClick={() => onNavigate(index)}
              >
                <span className="step-number" aria-hidden="true">
                  {completed && current !== index ? '✓' : index + 1}
                </span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
