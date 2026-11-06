import { useEffect, useRef } from 'react'
import type { Land } from '../types/land'
import { LandRegulations } from './LandRegulations'

interface Props {
  land: Land | null
  onClose: () => void
}

// 결과 카드에서 연 필지의 A02 건축 규제를 팝업으로 보여 줍니다. 내용은 LandRegulations(A02 담당)가 그립니다.
export function RegulationsDialog({ land, onClose }: Props) {
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
      aria-labelledby="regulations-dialog-title"
      onClose={onClose}
      // 바깥 어두운 영역을 누르면 닫습니다.
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {land && (
        <div className="regulations-dialog-body">
          <div className="regulations-dialog-header">
            <div>
              <p>{land.useName}</p>
              <h3 id="regulations-dialog-title">{land.name}</h3>
            </div>
            <button type="button" className="dialog-close" onClick={onClose} aria-label="닫기">
              ×
            </button>
          </div>
          <LandRegulations />
        </div>
      )}
    </dialog>
  )
}
