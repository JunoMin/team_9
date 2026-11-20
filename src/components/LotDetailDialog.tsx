import { useEffect, useRef } from 'react'
import { areaPyeong, formatPrice, pricePerPyeong, suuiPayment } from '../lib/search'
import { MapLinks } from './MapLinks'
import type { Land } from '../types/land'

interface Props {
  land: Land | null
  onClose: () => void
}

const manwon = (won: number) => `${Math.round(won / 10_000).toLocaleString('ko-KR')}만 원`

// 이 필지 하나의 정보만 모아 보여 줍니다. LH 목록 페이지로 나가면 다른 필지가 함께 보이기 때문입니다.
function detailRows(land: Land): [string, string][] {
  const suui = land.suui
  const rows: [string, string | undefined][] = [
    ['구분', land.saleMethod],
    [land.saleMethod === '입찰' ? '예정가격' : '공급가격', formatPrice(land.priceWon)],
    [
      '면적',
      `${areaPyeong(land).toLocaleString('ko-KR')}평 (${land.areaM2.toLocaleString('ko-KR')}㎡)`,
    ],
    ['평당가', manwon(pricePerPyeong(land))],
    ['사업지구', land.districtName],
    ['주소', land.address],
    ['지번', land.lotNo],
    ['용도', land.useName],
    ['용도지역', suui?.zoning],
    [
      '건폐율 / 용적률',
      suui && (suui.buildingCoverage !== undefined || suui.floorAreaRatio !== undefined)
        ? `${suui.buildingCoverage ?? '-'}% / ${suui.floorAreaRatio ?? '-'}%`
        : undefined,
    ],
    ['납부 조건', suuiPayment(land)],
    ['사용 가능일', suui?.usableFrom?.replaceAll('-', '.')],
    ['중개 알선', suui ? (suui.brokerAllowed ? '가능' : '불가') : undefined],
    ['공고', land.noticeName],
    ['상태', land.status],
    ['게시일', land.postedOn],
    ['마감일', land.closesOn],
    ['문의 전화', land.contactPhone],
  ]
  return rows.filter((row): row is [string, string] => Boolean(row[1]) && row[1] !== '-')
}

export function LotDetailDialog({ land, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (land && !dialog.open) dialog.showModal()
    if (!land && dialog.open) dialog.close()
  }, [land])

  return (
    <dialog
      ref={dialogRef}
      className="regulations-dialog"
      aria-labelledby="lot-detail-title"
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {land && (
        <div className="regulations-dialog-body">
          <div className="regulations-dialog-header">
            <div>
              <p>{land.useName}</p>
              <h3 id="lot-detail-title">{land.name}</h3>
            </div>
            <button type="button" className="dialog-close" onClick={onClose} aria-label="닫기">
              ×
            </button>
          </div>
          <dl className="lot-detail">
            {detailRows(land).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="lot-detail-links">
            <MapLinks land={land} />
            {land.detailUrl && (
              <a href={land.detailUrl} target="_blank" rel="noreferrer">
                {land.source === 'lh-suui' ? 'LH 수의계약 전체 목록' : 'LH 공고 원문'}
                <span className="sr-only"> (새 창)</span> ↗
              </a>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
