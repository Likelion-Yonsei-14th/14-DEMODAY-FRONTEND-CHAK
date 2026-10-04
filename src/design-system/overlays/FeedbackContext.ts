import { createContext, useContext } from 'react'

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger'

export type ToastInput = {
  message: string
  tone?: ToastTone
  duration?: number
}

export type SnackbarInput = {
  message: string
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

export type FeedbackApi = {
  showToast: (input: string | ToastInput) => void
  showSnackbar: (input: SnackbarInput) => void
}

export const FeedbackContext = createContext<FeedbackApi | null>(null)

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('useFeedback must be used inside NotificationProvider')
  return context
}
