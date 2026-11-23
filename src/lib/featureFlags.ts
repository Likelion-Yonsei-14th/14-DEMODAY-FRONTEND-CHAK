import { chaltteokMode } from '@/api/chaltteok'

/**
 * 아직 서버에 연결되지 않은 기능은 운영 빌드에서 사용자에게 보여 주지 않는다.
 * 개발(dev)과 테스트에서는 그대로 열려 있고, 값은 호출할 때 읽는다.
 */

/** 우리 반(교실)·Wrapped·혜택 화면: 브라우저 안에서만 동작하는 시안이라 서비스가 열릴 때까지 막는다. */
export const isClassroomAvailable = () => !import.meta.env.PROD

/** 찰떡 충전·구매: 운영에서는 서버 결제가 연결된 때(VITE_CHALTTEOK_API=server)에만 연다. */
export const arePaymentsAvailable = () => chaltteokMode === 'server' || !import.meta.env.PROD

/** 운영에서 미리 써 보는 테스트 모드(chak.live/prototype). 켠 브라우저에만 남는다. */
const PROTOTYPE_KEY = 'chak:prototype'
/** 테스트 중에 보낸 링크에 붙는 표시. 받은 사람도 이 링크로 들어오면 테스트 모드가 켜진다. */
export const PROTOTYPE_PARAM = 'prototype'

/** 테스트 모드인지. 주소에 ?prototype=1이 있으면 이 브라우저에 켜 둔다. */
export function isPrototypeUnlocked() {
  if (typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get(PROTOTYPE_PARAM) === '1') {
      window.localStorage.setItem(PROTOTYPE_KEY, 'on')
      return true
    }
    return window.localStorage.getItem(PROTOTYPE_KEY) === 'on'
  } catch {
    return false
  }
}

export function setPrototypeUnlocked(on: boolean) {
  try {
    if (on) window.localStorage.setItem(PROTOTYPE_KEY, 'on')
    else window.localStorage.removeItem(PROTOTYPE_KEY)
  } catch {
    // 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 테스트 모드를 켤 수 없다.
  }
}

/** 운영에 정식으로 열린 롤링페이퍼(VITE_ROLLING_PAPER=on). */
export const isRollingPaperReleased = () =>
  !import.meta.env.PROD || import.meta.env.VITE_ROLLING_PAPER === 'on'

/**
 * 연말 롤링페이퍼: 서버(/api/public/rolling-papers)가 배포된 뒤 운영에서 VITE_ROLLING_PAPER=on으로 연다.
 * 그 전에는 테스트 모드(chak.live/prototype)를 켠 브라우저에서만 열린다.
 * 개발·테스트에서는 늘 열려 있다(백엔드가 없으면 브라우저 안에서만 동작).
 */
export const isRollingPaperAvailable = () => isRollingPaperReleased() || isPrototypeUnlocked()
