import {
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react'
import './composer.css'

type LayerTransformControlsProps = {
  onScaleDown?: () => void
  onScaleUp?: () => void
  onRotateLeft?: () => void
  onRotateRight?: () => void
  onDelete: () => void
  compact?: boolean
}

export function LayerTransformControls({
  onScaleDown,
  onScaleUp,
  onRotateLeft,
  onRotateRight,
  onDelete,
  compact = false,
}: LayerTransformControlsProps) {
  return (
    <div
      className={[
        'layer-transform-controls',
        compact ? 'layer-transform-controls--compact' : '',
      ].filter(Boolean).join(' ')}
      aria-label="선택한 요소 편집"
    >
      {onScaleDown && (
        <ControlButton
          label="작게"
          icon={<Minus size={16} aria-hidden />}
          onClick={onScaleDown}
        />
      )}
      {onScaleUp && (
        <ControlButton
          label="크게"
          icon={<Plus size={16} aria-hidden />}
          onClick={onScaleUp}
        />
      )}
      {onRotateLeft && (
        <ControlButton
          label="왼쪽으로 회전"
          icon={<RotateCcw size={16} aria-hidden />}
          onClick={onRotateLeft}
        />
      )}
      {onRotateRight && (
        <ControlButton
          label="오른쪽으로 회전"
          icon={<RotateCw size={16} aria-hidden />}
          onClick={onRotateRight}
        />
      )}
      <ControlButton
        label="삭제"
        icon={<Trash2 size={16} aria-hidden />}
        onClick={onDelete}
        danger
      />
    </div>
  )
}

function ControlButton({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      className={[
        'layer-transform-controls__button',
        danger ? 'layer-transform-controls__button--danger' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
