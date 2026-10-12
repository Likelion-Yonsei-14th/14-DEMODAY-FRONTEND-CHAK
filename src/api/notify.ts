/**
 * Lets non-React code (store actions, debounced syncs) surface a failure to the
 * user. <ApiNotices /> listens and shows it as a toast.
 */
const EVENT = 'chak:api-notice'

export function notifyApiError(message: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }))
}

export function subscribeApiNotices(listener: (message: string) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
