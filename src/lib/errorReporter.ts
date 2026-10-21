import { API_URL, isApiEnabled } from '@/api/config'

export type ErrorKind =
  | 'js_error'
  | 'unhandled_rejection'
  | 'render_error'
  | 'api_error'
  | 'network_error'

export type ErrorReport = {
  kind: ErrorKind
  message: string
  apiPath?: string
  status?: number
  code?: string
  stack?: string
}

const MAX_REPORTS_PER_SESSION = 10
const DEDUPE_WINDOW_MS = 60_000
const ENDPOINT = '/api/public/client-errors'

/** Errors that say nothing useful about our app (extensions, browser quirks, user-cancelled requests). */
const NOISE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /AbortError|The user aborted a request|signal is aborted/i,
  /chrome-extension:|moz-extension:|safari-(web-)?extension:/i,
  /Non-Error promise rejection captured/i,
  // Scripts that Instagram/Facebook in-app browsers inject into the page; the bridge dies when the user leaves.
  /Java object is gone|Error invoking postMessage|iabjs:\/\//i,
]


const recent = new Map<string, number>()
let sent = 0
let lastReportId: string | null = null

function enabled() {
  return isApiEnabled && (import.meta.env.PROD || import.meta.env.VITE_ERROR_REPORTING === 'on')
}

function buildId() {
  return typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'
}

function isNoise(report: ErrorReport) {
  const message = report.message.trim()
  const withStack = report.stack ? `${message}\n${report.stack}` : message
  return NOISE.some((pattern) => pattern.test(message) || pattern.test(withStack))
}

/** Latest report id, so an error screen can show the user a code to quote. */
export function getLastReportId() {
  return lastReportId
}

/**
 * Tells the team about an error that happened in a user's browser. It never
 * throws, never blocks the UI, and skips noise, repeats and floods. Only the
 * page path (no query string), the message and a short stack are sent.
 */
export function reportError(report: ErrorReport) {
  try {
    if (!enabled() || isNoise(report)) return
    // An offline browser fails every request; that is not our bug.
    if (report.kind === 'network_error' && navigator.onLine === false) return

    const route = window.location.pathname
    const key = [report.kind, route, report.apiPath, report.status, report.code, report.message.slice(0, 80)].join('|')
    const now = Date.now()
    const previous = recent.get(key)
    if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) return
    if (sent >= MAX_REPORTS_PER_SESSION) return
    recent.set(key, now)
    sent += 1

    const reportId = `r-${Math.random().toString(36).slice(2, 8)}`
    lastReportId = reportId
    void fetch(`${API_URL}${ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        kind: report.kind,
        message: report.message.slice(0, 400) || '(메시지 없음)',
        route: route.slice(0, 300),
        apiPath: report.apiPath?.split('?')[0]?.slice(0, 300),
        status: report.status,
        code: report.code?.slice(0, 64),
        stack: report.stack?.slice(0, 2000),
        buildId: buildId(),
        reportId,
      }),
    }).catch(() => undefined)
  } catch {
    // Reporting must never cause another error.
  }
}

let initialized = false

/** Reports uncaught errors and unhandled promise rejections. Call once at startup. */
export function initErrorReporting() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  window.addEventListener('error', (event) => {
    reportError({
      kind: 'js_error',
      message: event.message || String(event.error ?? ''),
      stack: event.error instanceof Error ? event.error.stack : `${event.filename ?? ''}:${event.lineno ?? ''}`,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    reportError({
      kind: 'unhandled_rejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })
}
