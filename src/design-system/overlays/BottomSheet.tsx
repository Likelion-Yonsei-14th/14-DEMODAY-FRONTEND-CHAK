import { useEffect, type PropsWithChildren, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from '@/design-system/components'

type BottomSheetProps = PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  headerAction?: ReactNode
  closeLabel?: string
}>

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  headerAction,
  closeLabel = '닫기',
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="ds-overlay" role="presentation">
      <button className="ds-overlay__backdrop" aria-label={closeLabel} onClick={onClose} />
      <section className="ds-bottom-sheet" role="dialog" aria-modal="true" aria-label={title ?? '옵션'}>
        <div className="ds-bottom-sheet__grabber" aria-hidden />
        {(title || description || headerAction) && (
          <header className="ds-bottom-sheet__header">
            <div className="ds-bottom-sheet__heading">
              {title && <h2>{title}</h2>}
              {description && <p>{description}</p>}
            </div>
            {headerAction ?? (
              <IconButton
                label={closeLabel}
                icon={<X size={20} aria-hidden />}
                onClick={onClose}
              />
            )}
          </header>
        )}
        <div className="ds-bottom-sheet__content">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
