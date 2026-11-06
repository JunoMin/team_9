import type { SearchStep } from '../types/land'

interface Props {
  step: SearchStep
  selected: string | null
  onSelect: (value: string) => void
}

export function ChoiceGrid({ step, selected, onSelect }: Props) {
  return (
    <fieldset className="choice-grid">
      <legend className="sr-only">{step.title}</legend>
      {step.choices.map((choice) => (
        <label key={choice.id} className={`choice ${selected === choice.id ? 'is-selected' : ''}`}>
          <input
            type="radio"
            name={step.key}
            value={choice.id}
            checked={selected === choice.id}
            onChange={() => onSelect(choice.id)}
          />
          <span className="choice-text">
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
          </span>
          <span className="radio-mark" aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  )
}
