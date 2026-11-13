import { useEffect, useRef, useState } from 'react'
import { Brand } from './components/Brand'
import { FeaturedLands } from './components/FeaturedLands'
import { DesignIcon, HomeHero } from './components/HomeHero'
import { Results } from './components/Results'
import { SelectedLots } from './components/SelectedLots'
import { SelectionSummary } from './components/SelectionSummary'
import { emptyCriteria, searchSteps, toggleChoice } from './config/searchSteps'
import { lhLands, lhLandsFetchedAt } from './data/lhLands.generated'
import { buildPayload, loadSelectedLots, saveSelectedLots } from './handoff/selectedLots'
import { diagnoseEmpty, searchLands } from './lib/search'
import type { Land, SearchCriteria } from './types/land'

const landsById = new Map(lhLands.map((land) => [land.id, land]))

// 저장한 검토 목록에서 아직 판매 중인 필지만 되살립니다.
function restoreSelection(): string[] {
  return (loadSelectedLots()?.lots ?? []).map((lot) => lot.lotId).filter((id) => landsById.has(id))
}

export default function App() {
  const [criteria, setCriteria] = useState<SearchCriteria>({ ...emptyCriteria })
  const [showResults, setShowResults] = useState(false)
  const [activeHeroStep, setActiveHeroStep] = useState<number | null>(null)
  const [useKeyword, setUseKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(restoreSelection)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const selectedLands = selectedIds.map((id) => landsById.get(id)!)

  useEffect(() => {
    const lands = selectedIds.map((id) => landsById.get(id)!)
    saveSelectedLots(buildPayload(lands, lhLandsFetchedAt))
  }, [selectedIds])

  function toggleLand(land: Land) {
    setSelectedIds((ids) =>
      ids.includes(land.id) ? ids.filter((id) => id !== land.id) : [...ids, land.id],
    )
  }

  useEffect(() => {
    if (showResults) headingRef.current?.focus({ preventScroll: true })
  }, [showResults])

  function returnHome() {
    setShowResults(false)
    setActiveHeroStep(null)
  }

  function reset() {
    setCriteria({ region: ['any'], purpose: ['any'], budget: ['any'], area: ['any'] })
    setUseKeyword('')
  }
  function searchFromHero() {
    setCriteria((previous) => ({
      region: previous.region.length ? previous.region : ['any'],
      purpose: previous.purpose.length ? previous.purpose : ['any'],
      budget: previous.budget.length ? previous.budget : ['any'],
      area: previous.area.length ? previous.area : ['any'],
    }))
    setActiveHeroStep(null)
    setShowResults(true)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function selectFromHero(index: number, value: string) {
    const field = searchSteps[index]
    setCriteria((previous) => {
      const values = toggleChoice(previous[field.key], value, field.multiple)
      return { ...previous, [field.key]: showResults && !values.length ? ['any'] : values }
    })
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
            <button
              type="button"
              onClick={() => setActiveHeroStep(0)}
              aria-haspopup="dialog"
              aria-controls="hero-picker"
            >
              조건으로 찾기
            </button>
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
          compact={showResults}
          activeStep={activeHeroStep}
          onOpenStep={setActiveHeroStep}
          onCloseStep={() => setActiveHeroStep(null)}
          onSelect={selectFromHero}
          onSearch={searchFromHero}
          useKeyword={useKeyword}
          onUseKeyword={setUseKeyword}
        />
        <div className="page-shell">
          {!showResults && (
            <FeaturedLands
              lands={lhLands}
              selectedIds={new Set(selectedIds)}
              onToggle={toggleLand}
              onSearch={() => setActiveHeroStep(0)}
            />
          )}
          <div className={showResults ? 'workspace quick-results' : 'saved-section'}>
            {showResults && (
              <section className="search-panel" aria-labelledby="results-title">
                <div className="search-content">
                  <div className="question-heading">
                    <p className="step-caption">
                      검색 결과<span>맞춤 결과</span>
                    </p>
                    <h2 id="results-title" tabIndex={-1} ref={headingRef}>
                      고르신 조건으로 찾아봤어요.
                    </h2>
                    <p>관심 있는 필지를 선택해 검토 목록에 모아 보세요.</p>
                  </div>
                  <Results
                    lands={searchLands(lhLands, criteria)}
                    diagnosis={diagnoseEmpty(lhLands, criteria)}
                    useKeyword={useKeyword}
                    onUseKeyword={setUseKeyword}
                    selectedIds={new Set(selectedIds)}
                    onToggle={toggleLand}
                    onEdit={() => setActiveHeroStep(0)}
                  />
                </div>
              </section>
            )}
            <div className="side-column">
              {showResults && (
                <SelectionSummary criteria={criteria} onEdit={setActiveHeroStep} onReset={reset} />
              )}
              <div id="saved">
                <SelectedLots
                  lands={selectedLands}
                  onRemove={toggleLand}
                  onClear={() => setSelectedIds([])}
                />
              </div>
            </div>
          </div>
          {showResults && (
            <FeaturedLands
              lands={lhLands}
              selectedIds={new Set(selectedIds)}
              onToggle={toggleLand}
              onSearch={() => setActiveHeroStep(0)}
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
