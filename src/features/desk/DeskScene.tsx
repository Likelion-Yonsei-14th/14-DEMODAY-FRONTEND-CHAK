import type { DeskObjectType } from '@/types'
import { DeskObjectVisual } from './DeskObjectLayer'
import { useDeskDaypart } from './useDeskDaypart'
import './DeskScene.css'

type DeskSceneProps = {
  ownerName: string
  extraObjectType?: DeskObjectType
  highlightExtraObject?: boolean
}

/**
 * Photographed study desk with a day and a night version of the same
 * composition, cross-faded by the viewer's clock. Clutter sits around the
 * edges so the placement zone in the middle stays clear. Keeps the original
 * 390:500 board ratio.
 */
export function DeskScene({
  ownerName,
  extraObjectType,
  highlightExtraObject = false,
}: DeskSceneProps) {
  const daypart = useDeskDaypart()

  return (
    <div
      className={`desk-scene desk-scene--${daypart}`}
      role="img"
      aria-label={`${ownerName}의 공부 책상 위에 문제집, 노트, 필통과 컵이 놓여 있어요.`}
    >
      <div className="desk-scene__photo desk-scene__photo--day" />
      <div className="desk-scene__photo desk-scene__photo--night" />

      {extraObjectType && (
        <span
          className={[
            'desk-scene__extra',
            `desk-object--${extraObjectType}`,
            highlightExtraObject ? 'desk-scene__extra--highlight' : '',
          ].filter(Boolean).join(' ')}
        >
          <DeskObjectVisual type={extraObjectType} seed="extra" />
        </span>
      )}

      <div className="desk-scene__light" aria-hidden />
    </div>
  )
}
