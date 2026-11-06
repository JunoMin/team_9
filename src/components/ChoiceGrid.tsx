import type { SearchStep } from '../types/land'

interface Props {
  step: SearchStep
  selected: string[]
  onSelect: (value: string) => void
}

// 여러 개 고르는 단계는 체크박스, 나머지는 라디오로 그립니다.
export function ChoiceGrid({ step, selected, onSelect }: Props) {
  return (
    <fieldset className="choice-grid">
      <legend className="sr-only">{step.title}</legend>
      {step.choices.map((choice) => {
        const checked = selected.includes(choice.id)
        return (
          <label key={choice.id} className={`choice ${checked ? 'is-selected' : ''}`}>
            <input
              type={step.multiple ? 'checkbox' : 'radio'}
              name={step.key}
              value={choice.id}
              checked={checked}
              onChange={() => onSelect(choice.id)}
            />
            <span className="choice-text">
              <strong>{choice.label}</strong>
              <span>{choice.description}</span>
            </span>
            <span className={step.multiple ? 'check-mark' : 'radio-mark'} aria-hidden="true" />
          </label>
        )
      })}
    </fieldset>
  )
}
