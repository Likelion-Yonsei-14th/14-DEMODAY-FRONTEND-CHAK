import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { createPortal } from 'react-dom'
import {
  FeedbackContext,
  type SnackbarInput,
  type ToastInput,
} from './FeedbackContext'

type VisibleToast = ToastInput & { id: number }
type VisibleSnackbar = SnackbarInput & { id: number }

export function NotificationProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<VisibleToast | null>(null)
  const [snackbar, setSnackbar] = useState<VisibleSnackbar | null>(null)
  const sequence = useRef(0)

  const showToast = useCallback((input: string | ToastInput) => {
    sequence.current += 1
    const normalized = typeof input === 'string' ? { message: input } : input
    setToast({ id: sequence.current, tone: 'neutral', duration: 2400, ...normalized })
  }, [])

  const showSnackbar = useCallback((input: SnackbarInput) => {
    sequence.current += 1
    setSnackbar({ id: sequence.current, duration: 5000, ...input })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.duration)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!snackbar) return
    const timer = window.setTimeout(() => setSnackbar(null), snackbar.duration)
    return () => window.clearTimeout(timer)
  }, [snackbar])

  const value = useMemo(() => ({ showToast, showSnackbar }), [showToast, showSnackbar])

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="ds-feedback-layer" aria-live="polite" aria-atomic="true">
            {toast && (
              <div key={toast.id} className={`ds-toast ds-toast--${toast.tone}`} role="status">
                {toast.message}
              </div>
            )}
            {snackbar && (
              <div key={snackbar.id} className="ds-snackbar" role="status">
                <span>{snackbar.message}</span>
                {snackbar.actionLabel && (
                  <button
                    type="button"
                    onClick={() => {
                      snackbar.onAction?.()
                      setSnackbar(null)
                    }}
                  >
                    {snackbar.actionLabel}
                  </button>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </FeedbackContext.Provider>
  )
}
