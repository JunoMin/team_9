import { searchSteps, summaryLabel } from '../config/searchSteps'
import type { SearchCriteria } from '../types/land'

const icons = ['map-pin', 'house-line', 'wallet', 'ruler']
const prompts = [
  '어느 지역인가요?',
  '어떤 용도인가요?',
  '예산은 얼마인가요?',
  '얼마나 넓으면 될까요?',
]

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
}

export function HomeHero({ criteria, landCount }: Props) {
  return (
    <section className="home-hero" aria-labelledby="page-title">
      <div className="hero-scene">
        <img
          className="hero-landscape"
          src={`${import.meta.env.BASE_URL}images/landscape-hero.webp`}
          width="1800"
          height="600"
          fetchPriority="high"
          alt=""
        />
        <div className="hero-copy">
          <p className="hero-eyebrow">LAND, FOR YOUR NEXT CHAPTER</p>
          <h1 id="page-title">나의 내일이 시작되는 땅</h1>
          <p>복잡한 검색 대신, 원하는 조건을 하나씩 골라보세요.</p>
        </div>
        <a className="hero-search" href="#search" aria-label="조건을 골라 토지 찾기">
          <div className="hero-search-fields">
            {searchSteps.map((step, index) => (
              <span className="hero-search-field" key={step.key}>
                <DesignIcon name={icons[index]} />
                <span>
                  <strong>{step.label}</strong>
                  <span>{summaryLabel(criteria, step) || prompts[index]}</span>
                </span>
              </span>
            ))}
          </div>
          <span className="hero-search-action">
            토지 찾기 <DesignIcon name="arrow-right" />
          </span>
        </a>
        <span className="hero-image-note">AI로 만든 소개용 풍경 · 실제 공급 필지와 무관</span>
      </div>
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
    </section>
  )
}
