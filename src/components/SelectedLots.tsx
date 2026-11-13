import { useEffect, useRef, useState } from 'react'
import { areaPyeong, formatPrice } from '../lib/search'
import type { Land } from '../types/land'
import { DesignIcon } from './HomeHero'
import { LotDetailDialog } from './LotDetailDialog'
import { MapLinks } from './MapLinks'

interface Props {
  open: boolean
  onClose: () => void
  lands: Land[]
  onRemove: (land: Land) => void
  onClear: () => void
}

export function SelectedLots({ open, onClose, lands, onRemove, onClear }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [detailLand, setDetailLand] = useState<Land | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      const scrollPosition = { top: window.scrollY, left: window.scrollX }
      dialog.showModal()
      titleRef.current?.focus({ preventScroll: true })
      window.scrollTo({ ...scrollPosition, behavior: 'instant' })
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <>
      <dialog
        id="favorites-dialog"
        className="favorites-dialog"
        ref={dialogRef}
        aria-labelledby="favorites-title"
        aria-describedby="favorites-retention"
        onCancel={onClose}
        onClose={onClose}
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <div className="favorites-content">
          <header className="favorites-heading">
            <div>
              <p className="section-eyebrow">YOUR SAVED PLACES</p>
              <h2 id="favorites-title" tabIndex={-1} ref={titleRef}>
                즐겨찾는 토지 <span>{lands.length}</span>
              </h2>
            </div>
            <button
              type="button"
              className="favorites-close"
              onClick={onClose}
              aria-label="즐겨찾기 닫기"
            >
              ×
            </button>
          </header>
          <p className="favorites-intro">마음에 드는 땅, 한곳에 모아보기.</p>
          <div className="favorites-scroll">
            {lands.length === 0 ? (
              <div className="favorites-empty">
                <span className="favorites-empty-icon">
                  <DesignIcon name="bookmark-simple" />
                </span>
                <h3>어떤 땅이 마음에 드세요?</h3>
                <p>
                  토지 카드의 책갈피를 눌러
                  <br />
                  관심 있는 필지를 담아보세요.
                </p>
                <button type="button" className="button primary" onClick={onClose}>
                  토지 둘러보기 <DesignIcon name="arrow-right" />
                </button>
              </div>
            ) : (
              <ul className="favorite-cards">
                {lands.map((land) => (
                  <li className="favorite-card" key={land.id}>
                    <div className="favorite-card-top">
                      <span>
                        <DesignIcon name="map-pin" />
                        {land.regionName ?? land.region}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(land)}
                        aria-label={`${land.name} 즐겨찾기 해제`}
                      >
                        ×
                      </button>
                    </div>
                    <p className="favorite-use">{land.useName}</p>
                    <h3>
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => setDetailLand(land)}
                      >
                        {land.name}
                      </button>
                    </h3>
                    <p className="favorite-area">
                      {land.areaM2.toLocaleString('ko-KR')}㎡ ·{' '}
                      {areaPyeong(land).toLocaleString('ko-KR')}평
                    </p>
                    <div className="favorite-price">
                      <span>{land.saleMethod === '입찰' ? '예정가격' : '공급가격'}</span>
                      <strong>{formatPrice(land.priceWon)}</strong>
                    </div>
                    <div className="favorite-card-actions">
                      <button
                        type="button"
                        onClick={() => setDetailLand(land)}
                        aria-haspopup="dialog"
                      >
                        상세 보기 <DesignIcon name="arrow-right" />
                      </button>
                      <MapLinks land={land} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <footer className="favorites-footer">
            {lands.length > 0 && (
              <button type="button" onClick={onClear}>
                즐겨찾기 모두 비우기
              </button>
            )}
            <p id="favorites-retention">현재 화면에서만 유지되며, 새로고침하면 비워집니다.</p>
          </footer>
        </div>
      </dialog>
      <LotDetailDialog land={detailLand} onClose={() => setDetailLand(null)} />
    </>
  )
}
