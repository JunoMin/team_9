import { useEffect, useRef, useState } from 'react'
import { Brand } from './components/Brand'
import { ChoiceGrid } from './components/ChoiceGrid'
import { Results } from './components/Results'
import { SelectionSummary } from './components/SelectionSummary'
import { StepNavigation } from './components/StepNavigation'
import { emptyCriteria, isComplete, searchSteps, selectedChoice } from './config/searchSteps'
import { demoLands } from './data/demoLands'
import { searchLands } from './lib/search'
import type { SearchCriteria } from './types/land'

export default function App() {
  const [criteria, setCriteria] = useState<SearchCriteria>({ ...emptyCriteria })
  const [current, setCurrent] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const step = searchSteps[current]
  const hasSelection = Boolean(selectedChoice(criteria, step))

  // 단계 전환을 키보드·스크린 리더 사용자에게도 알려 줍니다.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [current, showResults])

  function edit(index: number) {
    setCurrent(index)
    setShowResults(false)
  }
  function reset() {
    setCriteria({ ...emptyCriteria })
    edit(0)
  }
  function next() {
    if (!hasSelection) return
    if (current < searchSteps.length - 1) setCurrent(current + 1)
    else if (isComplete(criteria)) setShowResults(true)
  }

  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 바로가기
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <div className="header-meta">
            <span>선택으로 찾는 나의 토지</span>
            <span className="template-badge">UI 템플릿</span>
          </div>
        </div>
      </header>
      <main id="main" className="page-shell">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">
            <span aria-hidden="true" /> 나에게 맞는 땅 찾기
          </p>
          <h1 id="page-title">
            원하는 땅에,
            <br className="mobile-break" /> <span>한 걸음 더 가까이.</span>
          </h1>
          <p>복잡한 검색 대신, 네 가지 조건만 골라보세요.</p>
        </section>
        <div className="workspace">
          <section className="search-panel" aria-labelledby="step-title">
            <StepNavigation
              criteria={criteria}
              current={showResults ? -1 : current}
              onNavigate={edit}
            />
            <div className="search-content">
              <div className="question-heading">
                <p className="step-caption">
                  {showResults ? '선택 완료' : `STEP 0${current + 1}`}
                  <span>{showResults ? '맞춤 결과' : `${current + 1} / 4`}</span>
                </p>
                <h2 id="step-title" tabIndex={-1} ref={headingRef}>
                  {showResults ? '고르신 조건으로 찾아봤어요.' : step.title}
                </h2>
                <p>{showResults ? '면적과 전체 가격을 한눈에 살펴보세요.' : step.description}</p>
              </div>
              {showResults ? (
                <Results lands={searchLands(demoLands, criteria)} onEdit={() => edit(2)} />
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    next()
                  }}
                >
                  <ChoiceGrid
                    step={step}
                    selected={criteria[step.key]}
                    onSelect={(value) =>
                      setCriteria((previous) => ({ ...previous, [step.key]: value }))
                    }
                  />
                  <div className="form-actions">
                    <span>
                      {current === 0 ? (
                        <span className="selection-hint">하나를 선택해 주세요</span>
                      ) : (
                        <button
                          type="button"
                          className="button previous"
                          onClick={() => edit(current - 1)}
                        >
                          ← 이전
                        </button>
                      )}
                    </span>
                    <button type="submit" className="button primary" disabled={!hasSelection}>
                      {current === 3 ? '결과 보기' : '다음'}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
          <SelectionSummary criteria={criteria} onEdit={edit} onReset={reset} />
        </div>
        <div className="demo-notice">
          <span className="notice-symbol" aria-hidden="true">
            i
          </span>
          <p>
            <strong>예시 데이터로 미리 둘러보세요.</strong> 현재 목록은 화면 개발용이며, 실제 공급
            정보는 추후 연결됩니다.
          </p>
        </div>
      </main>
      <footer className="site-footer">
        <span>TEAM 09 · 우리땅</span>
        <p>함께 만들어가는 토지 맞춤 검색기</p>
      </footer>
    </>
  )
}
