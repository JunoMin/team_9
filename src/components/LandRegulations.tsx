import './LandRegulations.css'

const regulationLabels = ['허용용도', '불허용도', '건폐율', '용적률', '최고높이', '최고층수']

// A02 결과 표시 영역입니다. 시행지침 데이터 연결은 후속 작업에서 진행합니다.
export function LandRegulations() {
  return (
    <section className="land-regulations" aria-label="지구단위계획 건축 규제">
      <div className="regulations-heading">
        <h4>지구단위계획 건축 규제</h4>
        <span>지침 연결 전</span>
      </div>
      <dl className="regulations-grid">
        {regulationLabels.map((label) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>확인 필요</dd>
          </div>
        ))}
      </dl>
      <p className="regulations-note">
        시행지침을 연결하면 규제 내용과 근거 조항·페이지를 표시합니다.
      </p>
    </section>
  )
}
