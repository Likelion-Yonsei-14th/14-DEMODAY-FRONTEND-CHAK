/**
 * 운영자 광고 관리 화면의 "시안 미리보기". 실제 페이지를 같은 출처의 iframe으로 띄우고(`?adPreview=1`),
 * 부모(운영자 화면)가 postMessage로 등록 중인 광고와 접근 토큰을 넘겨 준다.
 *
 * 미리보기 안에서는 실제 데이터를 바꾸지 않는다: 로그인 갱신·방문 기록·광고 집계·편지 읽음 처리를 하지 않고,
 * 클릭과 제출을 막는다. 스크롤은 된다.
 */

export const AD_PREVIEW_PARAM = 'adPreview'

export type PreviewBanner = { title: string; creativeUrl: string; destinationUrl: string }

type ToFrame = { type: 'chak-ad-preview'; ad: PreviewBanner | null; accessToken: string | null }
type CaptureRequest = { type: 'chak-ad-preview-capture'; id: number }
type ToParent =
  | { type: 'chak-ad-preview-ready' }
  | { type: 'chak-ad-preview-captured'; id: number; dataUrl: string | null }

const inFrame = typeof window !== 'undefined' && window.parent !== window

/** 이 문서가 운영자 화면 안의 미리보기 iframe인지. 한 번 정하면 페이지 안에서 이동해도 바뀌지 않는다. */
export const isAdPreview =
  inFrame && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has(AD_PREVIEW_PARAM)

let latest: ToFrame | null = null
const listeners = new Set<(message: ToFrame) => void>()

if (isAdPreview) {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return
    const request = event.data as CaptureRequest | null
    if (request?.type === 'chak-ad-preview-capture') {
      // 배너 둘레를 휴대폰 한 화면 크기로 찍어 부모에게 돌려준다.
      void import('./adPreviewCapture')
        .then(({ captureAroundBanner }) => captureAroundBanner())
        .catch(() => null)
        .then((dataUrl) =>
          window.parent.postMessage(
            { type: 'chak-ad-preview-captured', id: request.id, dataUrl } satisfies ToParent,
            window.location.origin,
          ),
        )
      return
    }
    const data = event.data as ToFrame | null
    if (data?.type !== 'chak-ad-preview') return
    latest = data
    listeners.forEach((listener) => listener(data))
  })
  // 미리보기에서 눌러도 아무 일도 일어나지 않게(투표·반응·이동 등).
  const block = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
  }
  document.addEventListener('click', block, true)
  document.addEventListener('submit', block, true)
  window.parent.postMessage({ type: 'chak-ad-preview-ready' } satisfies ToParent, window.location.origin)
}

/** 부모가 보낸 가장 최근 값을 받고, 이후 바뀔 때마다 알린다. 해제 함수를 돌려준다. */
export function subscribeAdPreview(listener: (message: ToFrame) => void) {
  listeners.add(listener)
  if (latest) listener(latest)
  return () => {
    listeners.delete(listener)
  }
}

/** 첫 메시지(토큰)를 기다린다. 부모가 응답하지 않으면 `timeoutMs` 뒤 null. */
export function waitForAdPreview(timeoutMs = 3000): Promise<ToFrame | null> {
  if (latest) return Promise.resolve(latest)
  return new Promise((resolve) => {
    let stop = () => {}
    const timer = window.setTimeout(() => {
      stop()
      resolve(null)
    }, timeoutMs)
    stop = subscribeAdPreview((message) => {
      window.clearTimeout(timer)
      stop()
      resolve(message)
    })
  })
}

// ---------- 부모(운영자 화면) 쪽 ----------

/** 미리보기 iframe들에게 광고와 토큰을 보낸다. 준비 신호가 오면 그 iframe에 다시 보낸다. */
export function createAdPreviewHost(getState: () => { ad: PreviewBanner | null; accessToken: string | null }) {
  const frames = new Set<Window>()
  const pending = new Map<number, (dataUrl: string | null) => void>()
  let nextId = 1
  const send = (target: Window) => {
    const { ad, accessToken } = getState()
    target.postMessage({ type: 'chak-ad-preview', ad, accessToken } satisfies ToFrame, window.location.origin)
  }
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin || !event.source) return
    const data = event.data as ToParent | null
    if (data?.type === 'chak-ad-preview-ready') {
      const source = event.source as Window
      frames.add(source)
      send(source)
    } else if (data?.type === 'chak-ad-preview-captured') {
      pending.get(data.id)?.(data.dataUrl)
      pending.delete(data.id)
    }
  }
  window.addEventListener('message', onMessage)
  return {
    broadcast: () => frames.forEach((frame) => send(frame)),
    /** 그 iframe이 지금 보여 주는 화면(배너 둘레)을 PNG data URL로. 실패하면 null. */
    capture: (frame: Window, timeoutMs = 20000) =>
      new Promise<string | null>((resolve) => {
        const id = nextId++
        const timer = window.setTimeout(() => {
          pending.delete(id)
          resolve(null)
        }, timeoutMs)
        pending.set(id, (dataUrl) => {
          window.clearTimeout(timer)
          resolve(dataUrl)
        })
        frame.postMessage({ type: 'chak-ad-preview-capture', id } satisfies CaptureRequest, window.location.origin)
      }),
    dispose: () => window.removeEventListener('message', onMessage),
  }
}
