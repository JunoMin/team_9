import { regulationData } from '../data/regulations.generated'
import { regulationValue, resolveRegulations } from '../lib/regulations'
import type { Land } from '../types/land'
import './LandRegulations.css'

const matchLabels = {
  parcel: '엑셀 필지 일치',
  ambiguous: '동일 조건 자료 중복',
  reference: '관련 자료 있음 · 필지 적용 미확인',
  none: '연결된 규제 자료 없음',
}

export function LandRegulations({ land }: { land: Land }) {
  const result = resolveRegulations(regulationData, land)
  const { parcel } = result
  const values = [
    ['용도지역', parcel?.zoning || '자료 없음'],
    ['공급용도', parcel?.use || '자료 없음'],
    ['건폐율', regulationValue(parcel?.coverage, '%')],
    ['용적률', regulationValue(parcel?.floorArea, '%')],
    ['최고층수', regulationValue(parcel?.floors, '층')],
    ['최고높이', '자료 없음'],
    ['허용용도', '필지별 시행지침 확인 필요'],
    ['불허용도', '필지별 시행지침 확인 필요'],
  ]
  return (
    <section className="land-regulations" aria-label="지구단위계획 건축 규제">
      <div className="regulations-heading">
        <h4>지구단위계획 건축 규제</h4>
        <span>{matchLabels[result.match]}</span>
      </div>
      <p className="regulations-context">
        {parcel
          ? `${parcel.region} ${parcel.district} · 예정지번 ${parcel.plannedLot || '미기재'} · 확정지번 ${parcel.confirmedLot || '미기재'} · ${parcel.areaM2.toLocaleString('ko-KR')}㎡`
          : result.match === 'ambiguous'
            ? '일치 후보가 여러 건이라 규제값을 선택하지 않았습니다. 원본 자료를 확인해 주세요.'
            : '이 필지에 적용할 규제값을 확정하지 못했습니다. 관련 지구 자료가 있어도 다른 블록의 수치를 대신 적용하지 않습니다.'}
      </p>
      <dl className="regulations-grid">
        {values.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {result.conflicts.length > 0 && (
        <div className="regulations-warning" role="status">
          <strong>검색 목록과 엑셀의 값이 다릅니다.</strong>
          {result.conflicts.map((conflict) => (
            <p key={conflict}>{conflict}</p>
          ))}
          <p>위 표는 엑셀의 값입니다. 최신 공고와 시행지침을 확인해 주세요.</p>
        </div>
      )}
      <p className="regulations-note">
        자료 수집일 {regulationData.asOf} ·{' '}
        {parcel ? `선착순 계약가능지구(토지) 원본 ${parcel.row}행` : 'LH 공고 및 지구별 수집자료'}
        <br />
        엑셀의 필지 일치는 최신 시행지침 검증을 의미하지 않습니다. 0은 원본값이며 무제한으로
        해석하지 않습니다.
      </p>
      {result.samples.length > 0 && (
        <details className="regulations-reference">
          <summary>공고의 블록별 규제표 {result.samples.length}건 · 필지 적용 미확인</summary>
          <p>
            아래는 PDF에서 확인한 블록별 표입니다. 선택한 필지의 블록이 확인되기 전에는
            참고용입니다.
          </p>
          {result.samples.map((sample) => (
            <article className="regulations-sample" key={`${sample.noticeId}-${sample.blocks}`}>
              <h5>
                {sample.district} · {sample.blocks}
              </h5>
              <dl className="regulations-grid">
                <div>
                  <dt>용지구분</dt>
                  <dd>{sample.use}</dd>
                </div>
                <div>
                  <dt>건폐율 / 용적률</dt>
                  <dd>
                    {sample.coverage}% / {sample.floorArea}%
                  </dd>
                </div>
                <div>
                  <dt>최고층수 / 높이</dt>
                  <dd>
                    {sample.floors}층 / {sample.height}
                  </dd>
                </div>
                <div>
                  <dt>허용용도</dt>
                  <dd>{sample.allowed}</dd>
                </div>
                <div>
                  <dt>불허·제외용도</dt>
                  <dd>{sample.prohibited}</dd>
                </div>
                <div>
                  <dt>예외·추가조건</dt>
                  <dd>{sample.conditions}</dd>
                </div>
              </dl>
              <p>
                {sample.article} · PDF {sample.pdfPages}쪽 / 인쇄 {sample.printedPages}쪽
              </p>
              <p>{sample.verification}</p>
              <a href={sample.url} target="_blank" rel="noreferrer">
                근거 시행지침 열기
              </a>
            </article>
          ))}
        </details>
      )}
      {result.documents.length > 0 && (
        <details className="regulations-reference" open>
          <summary>시행지침·계획 원문 {result.documents.length}건</summary>
          <p>
            공고 ID 또는 같은 지역·사업지구의 관련 자료입니다. 해당 필지와 적용 블록을 원문에서
            확인하세요.
          </p>
          <ul>
            {result.documents.map((doc) => (
              <li key={`${doc.noticeId}-${doc.fileId}-${doc.title}`}>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  {doc.title}
                </a>
                <small>
                  {doc.noticeId} ·{' '}
                  {doc.inArchive ? 'ZIP 원본 다운로드 후 내부 파일 확인' : doc.kind}
                </small>
              </li>
            ))}
          </ul>
        </details>
      )}
      {result.notices.length > 0 && (
        <details className="regulations-reference">
          <summary>연결된 공고와 수집 상태 {result.notices.length}건</summary>
          <ul>
            {result.notices.map((notice) => (
              <li key={notice.id}>
                <a href={notice.url} target="_blank" rel="noreferrer">
                  {notice.title}
                </a>
                <small>{notice.collectionStatus}</small>
                {notice.note && <p>{notice.note}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
