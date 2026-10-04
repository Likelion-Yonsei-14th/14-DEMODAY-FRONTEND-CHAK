import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/design-system/components'

type DialogAction = {
  label: string
  onClick: () => void
  variant?: 'primary' | 'brand' | 'secondary' | 'tertiary'
}

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  primaryAction?: DialogAction
  secondaryAction?: DialogAction
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
}: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="ds-overlay ds-overlay--centered" role="presentation">
      <button className="ds-overlay__backdrop" aria-label="대화상자 닫기" onClick={onClose} />
      <section className="ds-dialog" role="dialog" aria-modal="true" aria-labelledby="ds-dialog-title">
        <div className="ds-dialog__copy">
          <h2 id="ds-dialog-title">{title}</h2>
          {description && <p>{description}</p>}
          {children}
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="ds-dialog__actions">
            {secondaryAction && (
              <Button
                size="m"
                variant={secondaryAction.variant ?? 'secondary'}
                onClick={secondaryAction.onClick}
                fullWidth
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                size="m"
                variant={primaryAction.variant ?? 'primary'}
                onClick={primaryAction.onClick}
                fullWidth
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
