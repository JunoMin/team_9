import { useEffect, useRef } from 'react'
import { ChoiceGrid } from './ChoiceGrid'
import { searchSteps, summaryLabel } from '../config/searchSteps'
import type { SearchCriteria } from '../types/land'

const icons = ['map-pin', 'house-line', 'wallet', 'ruler']
const prompts = ['전국', '용도 무관', '예산 무관', '면적 무관']

export function DesignIcon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <img
      className={`design-icon ${className}`}
      src={`${import.meta.env.BASE_URL}icons/${name}.svg`}
      width="24"
      height="24"
      alt=""
      aria-hidden="true"
    />
  )
}

interface Props {
  criteria: SearchCriteria
  landCount: number
  compact: boolean
  activeStep: number | null
  onOpenStep: (index: number) => void
  onCloseStep: () => void
  onSelect: (index: number, value: string) => void
  onSearch: () => void
  useKeyword: string
  onUseKeyword: (keyword: string) => void
}

export function HomeHero({
  criteria,
  landCount,
  compact,
  activeStep,
  onOpenStep,
  onCloseStep,
  onSelect,
  onSearch,
  useKeyword,
  onUseKeyword,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const pickerStep = activeStep === null ? null : searchSteps[activeStep]

  useEffect(() => {
    const dialog = dialogRef.current
    if (activeStep !== null && dialog && !dialog.open) {
      const scrollPosition = { top: window.scrollY, left: window.scrollX }
      dialog.showModal()
      titleRef.current?.focus({ preventScroll: true })
      window.scrollTo({ ...scrollPosition, behavior: 'instant' })
    } else if (activeStep === null && dialog?.open) {
      dialog.close()
    }
  }, [activeStep])

  return (
    <section className={`home-hero ${compact ? 'is-searching' : ''}`} aria-labelledby="page-title">
      <div className="hero-scene">
        <img
          className="hero-landscape"
          src={`${import.meta.env.BASE_URL}images/landscape-hero.webp`}
          width="1800"
          height="600"
          fetchPriority="high"
          alt=""
        />
        <div className={compact ? 'sr-only' : 'hero-copy'}>
          <p className="hero-eyebrow">LAND, FOR YOUR NEXT CHAPTER</p>
          <h1 id="page-title">나의 내일이 시작되는 땅</h1>
          <p>원하는 조건만 골라보세요. 나머지는 넓게 찾아드릴게요.</p>
        </div>
        <form
          id="search"
          className="hero-search"
          role="search"
          aria-label="토지 조건 검색"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch()
          }}
        >
          <div className="hero-search-fields">
            {searchSteps.map((step, index) => (
              <button
                type="button"
                className="hero-search-field"
                key={step.key}
                onClick={() => onOpenStep(index)}
                aria-haspopup="dialog"
                aria-expanded={activeStep === index}
                aria-controls="hero-picker"
                aria-label={`${step.label}: ${summaryLabel(criteria, step) || prompts[index]}, 선택`}
              >
                <DesignIcon name={icons[index]} />
                <span>
                  <strong>{step.label}</strong>
                  <span>{summaryLabel(criteria, step) || prompts[index]}</span>
                </span>
              </button>
            ))}
          </div>
          <button type="submit" className="hero-search-action">
            토지 찾기 <DesignIcon name="arrow-right" />
          </button>
        </form>
        <p className="hero-search-hint">선택하지 않은 조건은 전체로 검색해요.</p>
        <span className="hero-image-note">AI로 만든 소개용 풍경 · 실제 공급 필지와 무관</span>
      </div>
      {!compact && (
        <div className="hero-assurances">
          <p>
            지금 살펴볼 수 있는 <strong>{landCount.toLocaleString('ko-KR')}개의 토지</strong>
          </p>
          <span>
            <DesignIcon name="check-circle" /> LH 공고·수의계약 정보
          </span>
          <span>
            <DesignIcon name="check-circle" /> 네 가지 조건으로 검색
          </span>
          <span>
            <DesignIcon name="check-circle" /> 주변 3km 시세 확인
          </span>
        </div>
      )}
      <dialog
        id="hero-picker"
        ref={dialogRef}
        className="hero-picker"
        aria-labelledby="hero-picker-title"
        onCancel={onCloseStep}
        onClose={onCloseStep}
        onClick={(event) => {
          if (event.target === event.currentTarget) onCloseStep()
        }}
      >
        {pickerStep && activeStep !== null && (
          <div className="hero-picker-content">
            <div className="hero-picker-heading">
              <div>
                <p className="section-eyebrow">{pickerStep.label} 선택</p>
                <h2 id="hero-picker-title" ref={titleRef} tabIndex={-1}>
                  {pickerStep.title}
                </h2>
              </div>
              <button
                type="button"
                className="hero-picker-close"
                onClick={onCloseStep}
                aria-label="조건 선택 닫기"
              >
                ×
              </button>
            </div>
            <div className="hero-picker-tabs" role="group" aria-label="검색 조건 항목">
              {searchSteps.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={activeStep === index}
                  onClick={() => onOpenStep(index)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="hero-picker-description">{pickerStep.description}</p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                onSearch()
              }}
            >
              <ChoiceGrid
                step={pickerStep}
                selected={criteria[pickerStep.key]}
                onSelect={(value) => onSelect(activeStep, value)}
              />
              {pickerStep.key === 'purpose' && (
                <label className="keyword-field">
                  <span>
                    용도 단어로 좁히기 <small>(선택)</small>
                  </span>
                  <input
                    type="search"
                    value={useKeyword}
                    onChange={(event) => onUseKeyword(event.target.value)}
                    placeholder="예: 자족시설, 주차장, 준주거"
                  />
                </label>
              )}
              <div className="hero-picker-actions">
                <span>{summaryLabel(criteria, pickerStep) || prompts[activeStep]}</span>
                <div className="hero-picker-buttons">
                  <button type="button" className="button secondary" onClick={onCloseStep}>
                    선택 완료
                  </button>
                  <button type="submit" className="button primary">
                    토지 찾기 <DesignIcon name="arrow-right" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </section>
  )
}
