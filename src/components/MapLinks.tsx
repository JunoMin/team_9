import { naverMapUrl } from '../lib/mapLink'
import type { Land } from '../types/land'

export function MapLinks({ land }: { land: Land }) {
  const links = [
    { provider: 'naver', mark: 'N', label: '네이버 지도', url: naverMapUrl(land) },
    ...(land.suui?.lhMapUrl
      ? [{ provider: 'lh', mark: 'LH', label: 'LH 내집어디 지도', url: land.suui.lhMapUrl }]
      : []),
  ]

  return (
    <div className="map-icon-links" role="group" aria-label="지도에서 위치 보기">
      {links.map(({ provider, mark, label, url }) => (
        <a
          key={provider}
          className={`map-icon-link map-icon-link--${provider}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${label} (새 창)`}
        >
          <span className="map-provider-mark" aria-hidden="true">
            {mark}
          </span>
          <span className="map-external-arrow" aria-hidden="true">
            ↗
          </span>
          <span className="map-link-tooltip" aria-hidden="true">
            {label} · 새 창
          </span>
        </a>
      ))}
    </div>
  )
}
