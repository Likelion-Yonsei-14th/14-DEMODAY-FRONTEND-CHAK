// 착 서비스 워커: 답장 알림(웹 푸시)을 받아 보여 주고, 알림을 누르면 해당 화면을 연다.
// 캐시나 오프라인 기능은 없다. 알림 외에는 아무 일도 하지 않는다.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

/** 같은 사이트 안의 경로만 연다(알림 내용이 어떻든 엉뚱한 사이트로 보내지 않는다). */
function safePath(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/'
}

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = typeof data.title === 'string' && data.title ? data.title : '착'
  const body = typeof data.body === 'string' && data.body ? data.body : '새 소식이 있어요'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/assets/brand/chak-icon-192.png',
      tag: typeof data.tag === 'string' ? data.tag : 'chak',
      data: { url: safePath(data.url) },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = safePath(event.notification.data && event.notification.data.url)
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          return client.navigate(target).then((navigated) => (navigated || client).focus())
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
