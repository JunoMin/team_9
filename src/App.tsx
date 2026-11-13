import { useEffect, useRef, useState } from 'react'
import { Brand } from './components/Brand'
import { ChoiceGrid } from './components/ChoiceGrid'
import { FeaturedLands } from './components/FeaturedLands'
import { DesignIcon, HomeHero } from './components/HomeHero'
import { Results } from './components/Results'
import { SelectedLots } from './components/SelectedLots'
import { SelectionSummary } from './components/SelectionSummary'
import { StepNavigation } from './components/StepNavigation'
import {
  emptyCriteria,
  isComplete,
  isStepDone,
  searchSteps,
  toggleChoice,
} from './config/searchSteps'
import { lhLands, lhLandsFetchedAt } from './data/lhLands.generated'
import { loadSelectedLots } from './handoff/selectedLots'
import { diagnoseEmpty, searchLands } from './lib/search'
import type { Land, SearchCriteria } from './types/land'

const landsById = new Map(lhLands.map((land) => [land.id, land]))

// 이전에 넘긴 선택이 있으면 같은 필지가 아직 판매 중일 때만 되살립니다.
function restoreSelection(): string[] {
  return (loadSelectedLots()?.lots ?? []).map((lot) => lot.lotId).filter((id) => landsById.has(id))
}

export default function App() {
  const [criteria, setCriteria] = useState<SearchCriteria>({ ...emptyCriteria })
  const [current, setCurrent] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [quickResults, setQuickResults] = useState(false)
  const [activeHeroStep, setActiveHeroStep] = useState<number | null>(null)
  const [useKeyword, setUseKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(restoreSelection)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const searchPanelRef = useRef<HTMLElement>(null)
  const previousView = useRef({ current, showResults })
  const step = searchSteps[current]
  const hasSelection = isStepDone(criteria, step)
  const selectedLands = selectedIds.map((id) => landsById.get(id)!)

  function toggleLand(land: Land) {
    setSelectedIds((ids) =>
      ids.includes(land.id) ? ids.filter((id) => id !== land.id) : [...ids, land.id],
    )
  }

  // 단계 전환을 키보드·스크린 리더 사용자에게도 알려 줍니다.
  useEffect(() => {
    if (
      previousView.current.current !== current ||
      previousView.current.showResults !== showResults
    ) {
      if (!quickResults) searchPanelRef.current?.scrollIntoView({ block: 'start' })
      headingRef.current?.focus({ preventScroll: true })
    }
    previousView.current = { current, showResults }
  }, [current, showResults, quickResults])

  function returnHome() {
    // 홈 링크의 위치 이동만 사용하고, 단계 전환용 스크롤은 실행하지 않습니다.
    previousView.current = { current: 0, showResults: false }
    setCurrent(0)
    setShowResults(false)
    setQuickResults(false)
  }

  function edit(index: number) {
    if (quickResults) {
      setActiveHeroStep(index)
      return
    }
    setCurrent(index)
    setShowResults(false)
  }
  function reset() {
    setCriteria(
      quickResults
        ? { region: ['any'], purpose: ['any'], budget: ['any'], area: ['any'] }
        : { ...emptyCriteria },
    )
    setUseKeyword('')
    if (!quickResults) edit(0)
  }
  function searchFromHero() {
    setCriteria((previous) => ({
      region: previous.region.length ? previous.region : ['any'],
      purpose: previous.purpose.length ? previous.purpose : ['any'],
      budget: previous.budget.length ? previous.budget : ['any'],
      area: previous.area.length ? previous.area : ['any'],
    }))
    setUseKeyword('')
    setQuickResults(true)
    setShowResults(true)
  }

  function selectFromHero(index: number, value: string) {
    const field = searchSteps[index]
    setCriteria((previous) => {
      const values = toggleChoice(previous[field.key], value, field.multiple)
      return { ...previous, [field.key]: quickResults && !values.length ? ['any'] : values }
    })
  }

  function next() {
    if (!hasSelection) return
    if (current < searchSteps.length - 1) setCurrent(current + 1)
    else if (isComplete(criteria)) setShowResults(true)
  }

  return (
    <div className="design-template">
      <a className="skip-link" href="#main">
        본문으로 바로가기
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand-link" href="#main" aria-label="내땅어디 홈" onClick={returnHome}>
            <Brand />
          </a>
          <nav className="header-navigation" aria-label="주요 메뉴">
            <a href="#available">공급 토지 둘러보기</a>
            <a href="#search">조건으로 찾기</a>
          </nav>
          <a className="header-saved" href="#saved">
            <DesignIcon name="bookmark-simple" /> 검토할 필지 <span>{selectedIds.length}</span>
          </a>
        </div>
      </header>
      <main id="main">
        <HomeHero
          criteria={criteria}
          landCount={lhLands.length}
          compact={quickResults}
          activeStep={activeHeroStep}
          onOpenStep={setActiveHeroStep}
          onCloseStep={() => setActiveHeroStep(null)}
          onSelect={selectFromHero}
          onSearch={searchFromHero}
        />
        <div className="page-shell">
          {!quickResults && (
            <FeaturedLands
              lands={lhLands}
              selectedIds={new Set(selectedIds)}
              onToggle={toggleLand}
            />
          )}
          {!quickResults && (
            <div className="search-intro">
              <div>
                <p className="section-eyebrow">FIND YOUR OWN PLACE</p>
                <h2>좋은 땅의 기준은, 나에게 맞는 땅.</h2>
              </div>
              <p>
                지역, 용도, 예산, 면적.
                <br />네 번의 선택으로 가능성을 좁혀보세요.
              </p>
            </div>
          )}
          <div id="search" className={`workspace ${quickResults ? 'quick-results' : ''}`}>
            <section className="search-panel" aria-labelledby="step-title" ref={searchPanelRef}>
              {!quickResults && (
                <StepNavigation
                  criteria={criteria}
                  current={showResults ? -1 : current}
                  onNavigate={edit}
                />
              )}
              <div className="search-content">
                <div className="question-heading">
                  <p className="step-caption">
                    {showResults ? '선택 완료' : `STEP 0${current + 1}`}
                    <span>{showResults ? '맞춤 결과' : `${current + 1} / 4`}</span>
                  </p>
                  <h2 id="step-title" tabIndex={-1} ref={headingRef}>
                    {showResults ? '고르신 조건으로 찾아봤어요.' : step.title}
                  </h2>
                  <p>
                    {showResults
                      ? '상세 검토할 필지를 골라 규제·시세 분석으로 넘겨 주세요.'
                      : step.description}
                  </p>
                </div>
                {showResults ? (
                  <Results
                    lands={searchLands(lhLands, criteria)}
                    diagnosis={diagnoseEmpty(lhLands, criteria)}
                    useKeyword={useKeyword}
                    onUseKeyword={setUseKeyword}
                    selectedIds={new Set(selectedIds)}
                    onToggle={toggleLand}
                    onEdit={() => edit(2)}
                  />
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
                        setCriteria((previous) => ({
                          ...previous,
                          [step.key]: toggleChoice(previous[step.key], value, step.multiple),
                        }))
                      }
                    />
                    {step.key === 'purpose' && (
                      <label className="keyword-field">
                        <span>
                          용도 단어로 좁히기 <small>(선택)</small>
                        </span>
                        <input
                          type="search"
                          value={useKeyword}
                          onChange={(event) => setUseKeyword(event.target.value)}
                          placeholder="예: 자족시설, 주차장, 준주거"
                        />
                      </label>
                    )}
                    <div className="form-actions">
                      <span>
                        {current === 0 ? (
                          <span className="selection-hint">
                            {step.multiple ? '여러 곳을 고를 수 있어요' : '하나를 선택해 주세요'}
                          </span>
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
            <div className="side-column">
              <SelectionSummary criteria={criteria} onEdit={edit} onReset={reset} />
              <div id="saved">
                <SelectedLots
                  lands={selectedLands}
                  onRemove={toggleLand}
                  onClear={() => setSelectedIds([])}
                />
              </div>
            </div>
          </div>
          {quickResults && (
            <FeaturedLands
              lands={lhLands}
              selectedIds={new Set(selectedIds)}
              onToggle={toggleLand}
            />
          )}
          <div className="demo-notice">
            <span className="notice-symbol" aria-hidden="true">
              i
            </span>
            <p>
              <strong>
                LH 공고 데이터 기준 {new Date(lhLandsFetchedAt).toLocaleDateString('ko-KR')}
              </strong>
              판매 중인 공고(공고중·접수중)와 선착순 수의계약 토지입니다. 결과는 참고용이며 매수
              판단 전 공고문 원문을 확인하세요.
            </p>
          </div>
        </div>
      </main>
      <footer className="site-footer">
        <div>
          <Brand />
          <p>나의 내일이 시작되는 땅을 찾습니다.</p>
        </div>
        <span>TEAM 09 · 토지 맞춤 검색기</span>
      </footer>
    </div>
  )
}
