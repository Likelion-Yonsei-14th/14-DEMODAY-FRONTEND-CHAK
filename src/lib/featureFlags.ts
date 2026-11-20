import { chaltteokMode } from '@/api/chaltteok'

/**
 * 아직 서버에 연결되지 않은 기능은 운영 빌드에서 사용자에게 보여 주지 않는다.
 * 개발(dev)과 테스트에서는 그대로 열려 있고, 값은 호출할 때 읽는다.
 */

/** 우리 반(교실)·Wrapped·혜택 화면: 브라우저 안에서만 동작하는 시안이라 서비스가 열릴 때까지 막는다. */
export const isClassroomAvailable = () => !import.meta.env.PROD

/** 찰떡 충전·구매: 운영에서는 서버 결제가 연결된 때(VITE_CHALTTEOK_API=server)에만 연다. */
export const arePaymentsAvailable = () => chaltteokMode === 'server' || !import.meta.env.PROD

/**
 * 졸업 롤링페이퍼: 서버(/api/public/rolling-papers)가 배포된 뒤 운영에서 VITE_ROLLING_PAPER=on으로 연다.
 * 개발·테스트에서는 늘 열려 있다(백엔드가 없으면 브라우저 안에서만 동작).
 */
export const isRollingPaperAvailable = () =>
  !import.meta.env.PROD || import.meta.env.VITE_ROLLING_PAPER === 'on'
