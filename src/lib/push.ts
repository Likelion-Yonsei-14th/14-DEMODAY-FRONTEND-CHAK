import { apiFetch, ApiError } from '@/api/client'

/**
 * 답장 알림(웹 푸시). 브라우저가 알림을 지원해야 하고, 아이폰은 홈 화면에 추가한 앱에서만 받을 수 있다.
 * 서버와는 `/api/public/push/*`로 구독을 주고받는다.
 */

export type PushSupport =
  /** 이 브라우저에서 켤 수 있다. */
  | 'supported'
  /** 아이폰: 홈 화면에 추가한 뒤에야 받을 수 있다. */
  | 'needs-install'
  /** 카카오톡 같은 앱 안의 브라우저. */
  | 'in-app'
  | 'unsupported'

export type PushFailure =
  | 'denied'
  | 'not-available'
  | 'identity-required'
  | 'unsupported'
  | 'failed'

export class PushError extends Error {
  readonly reason: PushFailure

  constructor(reason: PushFailure) {
    super(reason)
    this.name = 'PushError'
    this.reason = reason
  }
}

const SERVICE_WORKER_URL = '/sw.js'

const userAgent = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent)

function isStandalone() {
  return (
    (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches === true) ||
    (typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

export function pushSupport(): PushSupport {
  if (/KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(userAgent())) return 'in-app'
  const capable =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  if (capable) return 'supported'
  if (/iPhone|iPad|iPod/i.test(userAgent()) && !isStandalone()) return 'needs-install'
  return 'unsupported'
}

export const notificationPermission = (): NotificationPermission | 'unsupported' =>
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission

async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'supported') return null
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL)
  return registration ? registration.pushManager.getSubscription() : null
}

/** 이 브라우저가 지금 알림을 구독하고 있는지. */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    return (await currentSubscription()) !== null && notificationPermission() === 'granted'
  } catch {
    return false
  }
}

function applicationServerKey(publicKey: string) {
  const padding = '='.repeat((4 - (publicKey.length % 4)) % 4)
  const raw = atob((publicKey + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

/**
 * 알림을 켠다. 사용자가 누른 직후에 불러야 하며(권한 요청은 사용자 동작 안에서만 뜬다),
 * 권한 → 서버 키 → 구독 → 서버에 저장 순서로 진행한다. 실패하면 이유를 담은 PushError를 던진다.
 */
export async function enablePush(): Promise<void> {
  if (pushSupport() !== 'supported') throw new PushError('unsupported')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PushError('denied')

  let subscription: PushSubscription
  try {
    const key = await apiFetch<{ enabled: boolean; publicKey: string | null }>('/api/public/push/key', { quiet: true })
    if (!key.enabled || !key.publicKey) throw new PushError('not-available')

    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL)
    await navigator.serviceWorker.ready
    subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(key.publicKey),
      }))

    const json = subscription.toJSON()
    await apiFetch('/api/public/push/subscription', {
      method: 'PUT',
      body: { endpoint: json.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } },
      quiet: true,
    })
  } catch (error) {
    if (error instanceof PushError) throw error
    if (error instanceof ApiError) {
      if (error.code === 'PUSH_NOT_AVAILABLE') throw new PushError('not-available')
      if (error.code === 'IDENTITY_REQUIRED' || error.status === 401) throw new PushError('identity-required')
    }
    throw new PushError('failed')
  }
}

/** 알림을 끈다. 서버에서 지우는 데 실패해도 이 브라우저의 구독은 지운다(서버는 나중에 알아서 정리한다). */
export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription().catch(() => null)
  if (!subscription) return
  const endpoint = subscription.endpoint
  await apiFetch('/api/public/push/subscription', { method: 'DELETE', body: { endpoint }, quiet: true }).catch(() => undefined)
  await subscription.unsubscribe().catch(() => undefined)
}

/** 화면에 보일 안내 문구. */
export function pushHelp(support: PushSupport): string | null {
  switch (support) {
    case 'needs-install':
      return '아이폰은 공유 버튼에서 "홈 화면에 추가"로 앱을 설치한 뒤에 알림을 켤 수 있어요.'
    case 'in-app':
      return '카카오톡 같은 앱 안의 브라우저에서는 알림을 받을 수 없어요. Safari나 Chrome에서 열어 주세요.'
    case 'unsupported':
      return '이 브라우저는 알림을 지원하지 않아요.'
    default:
      return null
  }
}

export function pushFailureMessage(reason: PushFailure): string {
  switch (reason) {
    case 'denied':
      return '알림이 허용되지 않았어요. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.'
    case 'not-available':
      return '알림은 아직 준비 중이에요. 조금만 기다려 주세요.'
    case 'identity-required':
      return '응원을 하나 남긴 뒤에 알림을 켤 수 있어요.'
    case 'unsupported':
      return '이 브라우저에서는 알림을 켤 수 없어요.'
    default:
      return '알림을 켜지 못했어요. 잠시 뒤에 다시 시도해 주세요.'
  }
}
