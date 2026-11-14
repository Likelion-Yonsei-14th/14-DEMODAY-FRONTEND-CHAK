/**
 * 광고·제휴 제안서의 내용(리플렛 리디자인 v3 기준). 날짜·상품·규격은 여기만 고치면 페이지 전체에 반영된다.
 * 날짜는 한국 시간 기준으로 그날 끝(23:59)까지 유효하다.
 */

export const PROMOTION_CONTACT = {
  email: 'chak.live.team@gmail.com',
  instagramHandle: '@chak__put',
  instagramUrl: 'https://www.instagram.com/chak__put',
  team: '착 · 멋쟁이사자처럼 연세대학교 팀',
  phone: '010-3924-4047',
  manager: '조민준',
} as const

/** 한국 시간 하루의 끝(다음 날 0시 직전)을 UTC 시각으로 돌려준다. */
const endOfKstDay = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day, 14, 59, 59, 999))

export const PROMOTION_DATES = {
  serviceStart: { label: '10월 24일(토)', short: '10.24' },
  serviceEnd: { label: '11월 30일(월)', short: '11.30' },
  finalDeadline: { label: '11월 18일(수)', short: '11.18', endsAt: endOfKstDay(2026, 11, 18) },
  examDay: { label: '11월 19일', short: '11.19' },
} as const

export type PromotionStatus = 'OPEN' | 'CLOSED'

/** 지금 접수 중인지: 최종 입금 마감(11/18)이 지나면 마감. */
export function promotionStatus(now: Date = new Date()): PromotionStatus {
  return now <= PROMOTION_DATES.finalDeadline.endsAt ? 'OPEN' : 'CLOSED'
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
    .replace(/(\d개) (지점)/g, '$1\u00a0$2')
    .replace(/(세) (가지)/g, '$1\u00a0$2')
    .replace(/(한) (번) (더)/g, '$1\u00a0$2\u00a0$3')
    .replace(/(VAT) (별도)/g, '$1\u00a0$2')
    .replace(/(수능) (전|후|당일|다음)/g, '$1\u00a0$2')
    .replace(/\)(?=[가-힣])/g, ')\u2060')
}

/** 상담 신청서의 관심 상품 선택지. 값은 서버의 interest와 같다. */
export const INTEREST_OPTIONS = [
  { value: 'LOCAL_A', label: 'A안 · 수험생 혜택함 입점 (2단계)' },
  { value: 'LOCAL_B', label: 'B안 · 응원 화면 광고 모달 (1단계)' },
  { value: 'LOCAL_C', label: 'C안 · 1+2단계 패키지' },
  { value: 'BRAND_S', label: '매장 2~5곳' },
  { value: 'BRAND_M', label: '매장 6~20곳' },
  { value: 'BRAND_L', label: '매장 21~50곳' },
  { value: 'ENTERPRISE', label: '매장 51곳 이상 또는 전국' },
  { value: 'JOINT', label: '혜택·경품으로 공동 프로모션' },
  { value: 'OTHER', label: '아직 모르겠어요' },
] as const

export type InterestValue = (typeof INTEREST_OPTIONS)[number]['value']

/** 어드민에서 보여 줄 이름. 이전 제안서의 값도 알아본다. */
export const interestLabel = (value: string | null) => {
  if (!value) return null
  if (value === 'PACKAGE') return '대형 브랜드 패키지(이전)'
  if (value === 'BANNER') return '배너(이전)'
  return INTEREST_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export const HERO_COUPONS = [
  { tag: '수험생 쿠폰', title: '프로필 촬영 20% 할인' },
  { tag: '수험생 쿠폰', title: '렌즈 · 안경 25% 할인' },
  { tag: '수험생 쿠폰', title: '수험생 염색 30% 할인', shop: '제휴 헤어살롱 · 홍대점', note: '수능 다음 날 ~ 11월 30일 · 수험표 제시' },
] as const

export const WHY_NOW = [
  { when: '수능 전', title: '고객 접점 부족', body: '수험생과 미리 관계를 만들기 어려워요.' },
  { when: '수능 당일', title: '프로모션 경쟁', body: '여러 가게의 혜택이 한꺼번에 쏟아져요.' },
  { when: '수능 후', title: '방문 전환의 어려움', body: '혜택을 알려도 실제 매장 방문으로 이어지기 어려워요.' },
] as const

export const FIT_CATEGORIES = ['미용실 · 염색', '렌즈 · 안경', '운전면허학원', '사진관', '옷 · 패션', '놀이공원'] as const

export const FLOW_STEPS = [
  { when: '수능 전 · 매일', title: '응원 확인', body: '친구와 가족이 보낸 응원을 정해진 시간에 하나씩 확인해요.' },
  { when: '수능 다음 날', title: '혜택함 오픈', body: '그동안 쌓인 응원을 돌아보고 가까운 매장의 혜택함을 열어요.' },
  { when: '수능 후', title: '매장 방문', body: '쿠폰을 보여 주고 수험생 할인을 받아요.', highlight: true },
] as const

export const DAILY_REASONS = [
  { tag: '매일 방문', title: '정해진 시간에 열리는 응원', body: '응원을 확인하려고 매일 들어와요.' },
  { tag: '머무름', title: '내 취향대로 꾸미는 책상과 편지', body: '꾸미기와 공유로 참여가 이어져요.' },
  { tag: '다시 찾음', title: '수험생 전용 혜택함', body: '수능 다음 날 열리는 혜택이 방문으로 이어져요.' },
] as const

export const MINI_CONTENTS = ['나의 수험생 유형은?', '수능 끝 D+1 코스 짜기', '선생님 몰래 폰 하기', '오늘의 찍신은 나야!', '수험생 커리어 시뮬레이터'] as const

/** 리플렛의 2단계 광고 패키지. 요금은 문의로 안내한다. */
export const AD_STAGES = [
  {
    stage: '1단계',
    plan: 'B안',
    name: '응원 화면 광고 모달',
    body: '매일 응원을 열러 오는 수험생에게 우리 매장을 먼저 기억시켜요.',
    points: ['응원을 열 때 뜨는 영상 · 사진 광고', '4:5 비율 · 영상 15초 이내'],
  },
  {
    stage: '2단계',
    plan: 'A안',
    name: '수험생 혜택함 입점',
    body: '수능 다음 날, 수험생이 쿠폰을 받아 매장으로 직접 찾아와요.',
    points: ['혜택 목록 → 상세 → 쿠폰 발급', '수능 다음 날 ~ 11월 30일 노출'],
  },
] as const

export const AD_PACKAGE = {
  plan: 'C안 · 1+2단계 패키지',
  body: '응원 화면 노출부터 매장 방문까지, 한 번의 흐름으로 이어져요.',
} as const

export const EXTRA_OPTIONS = ['혜택함 상단 우선 노출', '메인 배너', '업종 대표 매장', '인스타그램 콘텐츠'] as const

/** 수능 당일. 접속자 예상 그래프가 여기까지 그려진다. */
export const EXAM_DATE = '2026-11-19'

/**
 * 서버(GET /api/public/stats/visitors)에서 받기 전이나 받지 못했을 때 그리는 접속자 수.
 * 2026-11-14에 어드민 통계에서 옮긴 값이고, 11/05는 서버 패치로 집계가 없다.
 */
export const VISITOR_SNAPSHOT = [
  { date: '2026-10-28', visitors: 131 },
  { date: '2026-10-29', visitors: 180 },
  { date: '2026-10-30', visitors: 375 },
  { date: '2026-10-31', visitors: 229 },
  { date: '2026-11-01', visitors: 334 },
  { date: '2026-11-02', visitors: 357 },
  { date: '2026-11-03', visitors: 430 },
  { date: '2026-11-04', visitors: 402 },
  { date: '2026-11-05', visitors: 0 },
  { date: '2026-11-06', visitors: 549 },
  { date: '2026-11-07', visitors: 672 },
  { date: '2026-11-08', visitors: 882 },
  { date: '2026-11-09', visitors: 1170 },
  { date: '2026-11-10', visitors: 1124 },
  { date: '2026-11-11', visitors: 1197 },
  { date: '2026-11-12', visitors: 1344 },
  { date: '2026-11-13', visitors: 1855 },
] as const

export const PROCESS = [
  { no: '01', title: '참여 의사 전달', body: '상품 · 참여 지점 수 · 담당자 연락처를 알려 주세요.' },
  { no: '02', title: '광고 정보 제출', body: '광고 소재 · 쿠폰 혜택 · 매장 정보를 보내 주세요. 수정은 1회까지예요.' },
  { no: '03', title: '광고 노출 시작', body: '입금이 확인되면 광고가 노출돼요.' },
] as const

export const SCHEDULE = [
  { date: '11/18', note: '최종 입금 마감' },
  { date: '11/19', note: '수능 당일 · 마지막 응원' },
  { date: '11/20~30', note: '혜택함 오픈' },
] as const

export const AD_SPECS = [
  { slot: '영상 모달', spec: '4:5 · 1080×1350px · MP4 · 최대 15초' },
  { slot: '사진 모달', spec: '4:5 · 1080×1350px · JPG/PNG 1장' },
  { slot: '모달 문구', spec: '매장명 12자 · 한 줄 문구 20자 이내' },
  { slot: '배너(옵션)', spec: '3:1 · 1125×375px · 문구 18자 이내' },
] as const

export const AD_SPEC_NOTE = '글자 수는 공백을 포함해서 세고, 로고와 문구는 가장자리에서 60px 안쪽에 두어 주세요.'

const tightAll = <T extends Record<string, unknown>>(rows: readonly T[]): T[] =>
  rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'string' ? tight(v) : v])) as T)

export const WHY_NOW_TEXT = tightAll(WHY_NOW)
export const FLOW_TEXT = tightAll(FLOW_STEPS)
export const DAILY_REASONS_TEXT = tightAll(DAILY_REASONS)
export const PROCESS_TEXT = tightAll(PROCESS)
export const AD_SPECS_TEXT = tightAll(AD_SPECS)
