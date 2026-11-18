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
  // The iOS flavour of the same: the injected script talks to the native app via window.webkit.
  /window\.webkit\.messageHandlers/i,
]

let suppressed = false

/** Stops all reporting, e.g. while the page is reloading itself. */
export function suppressErrorReporting() {
  suppressed = true
}

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
 * 네트워크 오류("Failed to fetch", iOS의 "Load failed")는 대부분 사용자가 앱을 전환하거나
 * 화면을 잠그거나 페이지를 떠나면서 브라우저가 진행 중인 요청을 끊은 것이다. 그때는 화면의
 * 요청 여러 개가 같은 순간에 한꺼번에 실패한다. 그래서 네트워크 오류는 바로 보내지 않고 잠시 모아 둔다.
 * - 실패한 순간 화면이 숨겨져 있었거나 떠나는 중이면 버린다.
 * - 모아 두는 동안이나 직전에 화면이 숨겨졌으면 버린다.
 * - 같은 화면에서 함께 실패한 요청은 한 건으로 묶어 보낸다.
 */
const NETWORK_HOLD_MS = 2_000
/** 실패 직전에 화면이 숨겨졌다면(앱 전환 뒤 돌아오며 끊긴 요청) 이만큼 거슬러 본다. */
const HIDDEN_LOOKBACK_MS = 3_000

let lastHiddenAt = Number.NEGATIVE_INFINITY
let leaving = false

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') lastHiddenAt = Date.now()
  })
  window.addEventListener('pagehide', () => {
    leaving = true
    lastHiddenAt = Date.now()
  })
  // bfcache로 돌아온 페이지는 다시 살아 있다.
  window.addEventListener('pageshow', () => {
    leaving = false
  })
}

const pageGone = () => leaving || (typeof document !== 'undefined' && document.visibilityState === 'hidden')

type HeldNetwork = { report: ErrorReport; route: string; failedAt: number; others: string[] }
const heldNetwork = new Map<string, HeldNetwork>()

function holdNetworkError(report: ErrorReport, route: string) {
  const now = Date.now()
  const held = heldNetwork.get(route)
  if (held) {
    if (report.apiPath && report.apiPath !== held.report.apiPath && !held.others.includes(report.apiPath)) {
      held.others.push(report.apiPath)
    }
    return
  }
  heldNetwork.set(route, { report, route, failedAt: now, others: [] })
  setTimeout(() => {
    const entry = heldNetwork.get(route)
    heldNetwork.delete(route)
    if (!entry || pageGone() || lastHiddenAt >= entry.failedAt - HIDDEN_LOOKBACK_MS) return
    const others = entry.others.map((path) => path.split('?')[0])
    send(
      others.length > 0
        ? { ...entry.report, message: `${entry.report.message} (같이 실패한 요청 ${others.length}건: ${others.join(', ')})` }
        : entry.report,
      entry.route,
    )
  }, NETWORK_HOLD_MS)
}

/**
 * Tells the team about an error that happened in a user's browser. It never
 * throws, never blocks the UI, and skips noise, repeats and floods. Only the
 * page path (no query string), the message and a short stack are sent.
 */
export function reportError(report: ErrorReport) {
  try {
    if (suppressed || !enabled() || isNoise(report)) return
    const route = window.location.pathname
    if (report.kind === 'network_error') {
      // An offline browser fails every request; that is not our bug.
      if (navigator.onLine === false || pageGone()) return
      holdNetworkError(report, route)
      return
    }
    send(report, route)
  } catch {
    // Reporting must never cause another error.
  }
}

function send(report: ErrorReport, route: string) {
  try {
    if (suppressed) return
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
