import { useMemo, useState } from 'react'
import { areaPyeong, formatPrice } from '../lib/search'
import type { Land } from '../types/land'
import { DesignIcon } from './HomeHero'
import { LotDetailDialog } from './LotDetailDialog'

const categories = [
  { label: '전체', purposes: [] },
  { label: '주택용지', purposes: ['detached', 'detached-shop'] },
  { label: '상업·근린', purposes: ['commercial', 'neighborhood'] },
  { label: '산업·기타', purposes: ['industrial', 'other'] },
]

interface Props {
  lands: Land[]
  selectedIds: ReadonlySet<string>
  onToggle: (land: Land) => void
}

export function FeaturedLands({ lands, selectedIds, onToggle }: Props) {
  const [category, setCategory] = useState(0)
  const [detailLand, setDetailLand] = useState<Land | null>(null)
  const purposes = categories[category].purposes
  const { availableCount, featured } = useMemo(() => {
    const available = lands.filter((land) => !purposes.length || purposes.includes(land.purpose))
    const districts = new Set<string>()
    // 실제 데이터에서 최근 공고순으로 고르고, 같은 사업지구(없으면 주소)는 한 번만 표시합니다.
    const featured = [...available]
      .sort((a, b) => (b.postedOn ?? '').localeCompare(a.postedOn ?? '') || a.priceWon - b.priceWon)
      .filter((land) => {
        const district = land.districtName ?? land.address ?? land.name
        if (districts.has(district)) return false
        districts.add(district)
        return true
      })
      .slice(0, 4)
    return { availableCount: available.length, featured }
  }, [lands, purposes])

  return (
    <section className="featured-section" id="available" aria-labelledby="featured-title">
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">DISCOVER YOUR LAND</p>
          <h2 id="featured-title">현재 공급 중인 토지</h2>
          <p>어떤 가능성이 기다리고 있을까요? 관심 있는 토지부터 살펴보세요.</p>
        </div>
        <a className="section-link" href="#search">
          내 조건으로 찾기 <DesignIcon name="arrow-right" />
        </a>
      </div>
      <div className="featured-toolbar">
        <div className="featured-filters" role="group" aria-label="공급 토지 용도">
          {categories.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={category === index}
              onClick={() => setCategory(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p aria-live="polite">
          최근 공고순 · {availableCount.toLocaleString('ko-KR')}필지 중 {featured.length}개
        </p>
      </div>
      <ul className="featured-grid">
        {featured.map((land) => (
          <li className="featured-card" key={land.id}>
            <div className="featured-card-top">
              <span className="featured-location">
                <DesignIcon name="map-pin" />
                {land.regionName ?? land.region}
              </span>
              <button
                className="save-land"
                type="button"
                aria-pressed={selectedIds.has(land.id)}
                aria-label={`${land.name} 검토할 필지로 선택`}
                onClick={() => onToggle(land)}
              >
                <DesignIcon name="bookmark-simple" />
              </button>
            </div>
            <div className="featured-card-body">
              <p className="featured-use">{land.useName ?? land.purpose}</p>
              <h3>
                <button type="button" aria-haspopup="dialog" onClick={() => setDetailLand(land)}>
                  {land.name}
                </button>
              </h3>
              <p className="featured-area">
                {land.areaM2.toLocaleString('ko-KR')}㎡{' '}
                <span>· {areaPyeong(land).toLocaleString('ko-KR')}평</span>
              </p>
              <div className="featured-card-price">
                <span>{land.saleMethod === '입찰' ? '예정가격' : '공급가격'}</span>
                <strong>{formatPrice(land.priceWon)}</strong>
              </div>
              <div className="featured-card-bottom">
                <span>{land.saleMethod ?? land.status}</span>
                <button type="button" aria-haspopup="dialog" onClick={() => setDetailLand(land)}>
                  상세 보기 <DesignIcon name="arrow-right" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {featured.length === 0 && (
        <p className="featured-empty">
          현재 이 용도로 공급 중인 토지가 없습니다. 다른 용도를 선택해 주세요.
        </p>
      )}
      <LotDetailDialog land={detailLand} onClose={() => setDetailLand(null)} />
    </section>
  )
}
