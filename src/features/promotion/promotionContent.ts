/**
 * 대형 브랜드 광고 제휴 제안서(시안.pdf)의 내용. 날짜·가격·규격은 여기만 고치면 페이지 전체에 반영된다.
 * 날짜는 한국 시간 기준으로 그날 끝(23:59)까지 유효하다.
 */

export const PROMOTION_CONTACT = {
  email: 'chak.live.team@gmail.com',
  instagramHandle: '@chak__put',
  instagramUrl: 'https://www.instagram.com/chak__put',
  team: '착 · 멋쟁이사자처럼 연세대학교 팀',
} as const

export const PROMOTION_PRICE = {
  regular: 199_000,
  earlyBird: 149_000,
} as const

/** 한국 시간 하루의 끝(다음 날 0시 직전)을 UTC 시각으로 돌려준다. */
const endOfKstDay = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day, 14, 59, 59, 999))

export const PROMOTION_DATES = {
  serviceStart: { label: '10월 24일(토)', short: '10.24' },
  serviceEnd: { label: '11월 30일(월)', short: '11.30' },
  earlyBirdDeadline: { label: '10월 31일(토)', short: '10.31', endsAt: endOfKstDay(2026, 10, 31) },
  replyDeadline: { label: '11월 2일(월)', short: '11.2', endsAt: endOfKstDay(2026, 11, 2) },
  finalDeadline: { label: '11월 12일(목)', short: '11.12', endsAt: endOfKstDay(2026, 11, 12) },
  examDay: { label: '11월 19일', short: '11.19' },
} as const

export type PromotionStatus = 'EARLY_BIRD' | 'OPEN' | 'CLOSED'

/** 지금 어떤 조건으로 받을 수 있는지: 얼리버드(10/31까지) → 정가(11/12까지) → 마감. */
export function promotionStatus(now: Date = new Date()): PromotionStatus {
  if (now <= PROMOTION_DATES.earlyBirdDeadline.endsAt) return 'EARLY_BIRD'
  if (now <= PROMOTION_DATES.finalDeadline.endsAt) return 'OPEN'
  return 'CLOSED'
}


/**
 * 모바일에서 말이 어색하게 끊기지 않도록 붙여 쓸 곳을 이어 준다(줄바꿈 금지 공백, 단어 결합 기호).
 * 날짜(10월 31일), 요일 괄호, 숫자+단위(1만 회, 14.9만원), 자주 끊기는 짧은 구("맨 위", "한 번 더"),
 * 닫는 괄호 뒤에 바로 오는 조사(")으로")를 한 덩어리로 만든다.
 */
export function tight(text: string): string {
  return text
    .replace(/(\d+월) (\d+일)/g, '$1\u00a0$2')
    .replace(/(\d+일)\s?\(/g, '$1(')
    .replace(/(\d[\d.,]*[만천백]?) (회|원|px|자|곳|구좌|장|초|개|명)/g, '$1\u00a0$2')
    .replace(/(맨) (위)/g, '$1\u00a0$2')
    .replace(/(한) (번) (더)/g, '$1\u00a0$2\u00a0$3')
    .replace(/(VAT) (별도)/g, '$1\u00a0$2')
    .replace(/(수능) (전|후|당일|다음)/g, '$1\u00a0$2')
    .replace(/\)(?=[가-힣])/g, ')\u2060')
}

export const formatWon = (won: number) => `${(won / 10_000).toFixed(1).replace(/\.0$/, '')}만원`

export const WHY_NOW = [
  { when: '수능 전', body: '고3은 공부하느라 바빠서 SNS나 일반 광고에 잘 머물지 않아요.' },
  { when: '수능 당일', body: '모든 브랜드가 같은 날 수험표 이벤트를 열어서 하나하나 묻히기 쉬워요.' },
  { when: '수능 후', body: '수험생이 처음 소비하는 시기라, 가장 먼저 떠오르는 브랜드가 되는 게 중요해요.' },
] as const

export const PROCESS = [
  { no: '1', title: '11월 2일(월)까지 회신', body: '참여하실 브랜드와 담당자 연락처를 알려 주세요.' },
  { no: '2', title: '광고 소재 전달', body: '착이 안내하는 규격에 맞춰 영상이나 사진, 배너 문구를 보내 주세요.' },
  { no: '3', title: '입금하면 바로 노출', body: '10월 31일까지 입금하면 얼리버드가 적용되고, 확인 즉시 광고가 시작돼요.' },
] as const

export const BEFORE_EXAM_STEPS = [
  { title: '책상 만들기', body: '응원을 열어볼 시간을 정해요.' },
  { title: '친구 응원', body: '링크 하나로, 로그인 없이 남겨요.' },
  { title: '매일 열기', body: '이때 광고 모달과 배너가 보여요.', highlight: true },
] as const

export const AFTER_EXAM_STEPS = [
  { title: '응원 결산', body: '한 달 동안의 응원을 SNS에 공유해요.' },
  { title: '혜택함 열기', body: '맨 위 배너가 다시 보여요.', highlight: true },
  { title: '매장 방문', body: '지역 매장에서 쿠폰을 써요.' },
] as const

export const DAILY_REASONS = [
  '정해진 시간마다 친구와 가족의 응원이 열려요.',
  '나만의 책상과 사물함을 꾸미고 손편지로 응원을 받아요.',
  '수능이 끝나면 열리는 혜택을 기다리며 매일 들러요.',
] as const

export const AD_SPECS = [
  { slot: '영상 모달', spec: '4:5 · 1080×1350px · MP4 · 최대 15초' },
  { slot: '사진 모달', spec: '4:5 · 1080×1350px · JPG/PNG 1장' },
  { slot: '모달 문구', spec: '브랜드명 12자 · 한 줄 문구 20자 이내' },
  { slot: '배너', spec: '3:1 · 1125×375px · 문구 18자 이내' },
] as const

export const AD_SPEC_NOTE = '글자 수는 공백을 포함해서 세고, 로고와 문구는 가장자리에서 60px 안쪽에 두어 주세요.'

export const CONDITIONS = [
  '광고 소재는 착이 정한 규격(사이즈, 문구 길이)으로 받아요.',
  '소재 수정은 1회까지 가능해요.',
  '배너는 업종별로 한 곳만 받아요. 먼저 확정된 브랜드부터 배정해요.',
] as const

export const SCHEDULE = [
  { date: '10월 31일', note: '얼리버드 입금 마감', key: true },
  { date: '11월 2일', note: '제안 회신 기한', key: true },
  { date: '11월 12일', note: '최종 입금 마감', key: false },
  { date: '11월 19일', note: '수능 당일, 마지막 응원', key: false },
  { date: '11월 20일 ~ 30일', note: '혜택함 배너 노출, 30일에 종료', key: false },
] as const

const tightAll = <T extends Record<string, unknown>>(rows: readonly T[]): T[] =>
  rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'string' ? tight(v) : v])) as T)

export const WHY_NOW_TEXT = tightAll(WHY_NOW)
export const PROCESS_TEXT = tightAll(PROCESS)
export const BEFORE_EXAM_TEXT = tightAll(BEFORE_EXAM_STEPS)
export const AFTER_EXAM_TEXT = tightAll(AFTER_EXAM_STEPS)
export const AD_SPECS_TEXT = tightAll(AD_SPECS)
export const SCHEDULE_TEXT = tightAll(SCHEDULE)
export const DAILY_REASONS_TEXT = DAILY_REASONS.map(tight)
export const CONDITIONS_TEXT = CONDITIONS.map(tight)
