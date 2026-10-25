/**
 * 광고·제휴 제안서의 내용(CHAK 광고·제휴 BM). 날짜·가격·규격은 여기만 고치면 페이지 전체에 반영된다.
 * 날짜는 한국 시간 기준으로 그날 끝(23:59)까지 유효하다.
 */

export const PROMOTION_CONTACT = {
  email: 'chak.live.team@gmail.com',
  instagramHandle: '@chak__put',
  instagramUrl: 'https://www.instagram.com/chak__put',
  team: '착 · 멋쟁이사자처럼 연세대학교 팀',
} as const

/** 한국 시간 하루의 끝(다음 날 0시 직전)을 UTC 시각으로 돌려준다. */
const endOfKstDay = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day, 14, 59, 59, 999))

export const PROMOTION_DATES = {
  serviceStart: { label: '10월 24일(토)', short: '10.24' },
  serviceEnd: { label: '11월 30일(월)', short: '11.30' },
  replyDeadline: { label: '11월 2일(월)', short: '11.2', endsAt: endOfKstDay(2026, 11, 2) },
  finalDeadline: { label: '11월 12일(목)', short: '11.12', endsAt: endOfKstDay(2026, 11, 12) },
  examDay: { label: '11월 19일', short: '11.19' },
} as const

export type PromotionStatus = 'OPEN' | 'CLOSED'

/** 지금 접수 중인지: 최종 입금 마감(11/12)이 지나면 마감. */
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

export const formatWon = (won: number) => `${(won / 10_000).toFixed(1).replace(/\.0$/, '')}만원`

/** 가격은 모두 VAT 별도. */
export type LocalProduct = {
  id: 'A' | 'B' | 'C'
  name: string
  price: number
  points: readonly string[]
}

export const LOCAL_PRODUCTS: readonly LocalProduct[] = [
  {
    id: 'A',
    name: '수능 후 방문형',
    price: 49_000,
    points: ['수능 후 혜택함 입점', '쿠폰 제작과 등록', '매장 정보 노출'],
  },
  {
    id: 'B',
    name: '수능 전 인지형',
    price: 99_000,
    points: ['수능 전 이미지·영상 광고 노출', '사용자 위치에서 가까운 매장을 먼저 추천', '브랜드와 매장 인지도 확보'],
  },
  {
    id: 'C',
    name: '수능 전후 연결형',
    price: 129_000,
    points: [
      'B 상품의 수능 전 광고',
      '수능 후 혜택함 입점',
      '광고에서 수능 후 쓸 쿠폰을 미리 담기',
      '수능 전 인지부터 수능 후 방문까지 한 번에 연결',
    ],
  },
]

/** 상담 신청서의 관심 상품 선택지. 값은 서버의 interest와 같다. */
export const INTEREST_OPTIONS = [
  { value: 'LOCAL_A', label: 'A · 수능 후 방문형 (4.9만원)' },
  { value: 'LOCAL_B', label: 'B · 수능 전 인지형 (9.9만원)' },
  { value: 'LOCAL_C', label: 'C · 수능 전후 연결형 (12.9만원)' },
  { value: 'BRAND_S', label: 'Brand S · 2~5개 지점' },
  { value: 'BRAND_M', label: 'Brand M · 6~20개 지점' },
  { value: 'BRAND_L', label: 'Brand L · 21~50개 지점' },
  { value: 'ENTERPRISE', label: 'Enterprise · 51개 이상 또는 전국' },
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

export const BRAND_COMMON = [
  '수능 전 브랜드 노출',
  '수능 후 혜택함 입점',
  '참여 매장 정보 등록',
  '사용자 위치에서 가까운 참여 매장 추천',
  '쿠폰 등록과 이용 연결',
  '광고 노출·클릭·쿠폰 이용 리포트',
] as const

export type BrandTier = {
  id: 'S' | 'M' | 'L' | 'ENTERPRISE'
  name: string
  branches: string
  /** 별도 협의면 null */
  regular: number | null
  launch: number | null
}

export const BRAND_TIERS: readonly BrandTier[] = [
  { id: 'S', name: 'Brand S', branches: '2~5개 지점', regular: 149_000, launch: 119_000 },
  { id: 'M', name: 'Brand M', branches: '6~20개 지점', regular: 299_000, launch: 239_000 },
  { id: 'L', name: 'Brand L', branches: '21~50개 지점', regular: 499_000, launch: 399_000 },
  { id: 'ENTERPRISE', name: 'Enterprise', branches: '51개 이상 또는 전국 단위', regular: null, launch: null },
]

export const ENTERPRISE_NOTE =
  '지점 수뿐 아니라 전국 캠페인 여부, 광고 기간, 노출 범위, 메인 배너와 SNS 콘텐츠 같은 캠페인 구성에 따라 따로 견적을 드려요.'

export const FRANCHISE_SCOPES = [
  '전국 매장',
  '특정 지역 매장',
  '직영점',
  '본사가 지정한 일부 매장',
  '참여를 희망한 가맹점',
] as const

export const JOINT_BENEFITS = [
  'CHAK 전용 할인',
  '무료 쿠폰',
  '경품',
  '체험권',
  '상품 협찬',
  '공동 SNS 프로모션',
] as const

export const EXTRA_OPTIONS = [
  '메인 배너',
  '혜택함 상단 우선 노출',
  '특정 카테고리 대표 브랜드 노출',
  '인스타그램 피드·스토리 콘텐츠',
  '특정 기간 집중 노출',
  '카테고리 또는 상권 독점 캠페인',
] as const

export const WHY_NOW = [
  { when: '수능 전', body: '고3은 공부하느라 바빠서 SNS나 일반 광고에 잘 머물지 않아요.' },
  { when: '수능 당일', body: '모든 브랜드가 같은 날 수험표 이벤트를 열어서 하나하나 묻히기 쉬워요.' },
  { when: '수능 후', body: '수험생이 처음 소비하는 시기라, 가장 먼저 떠오르는 곳이 되는 게 중요해요.' },
] as const

export const PROCESS = [
  { no: '1', title: '11월 2일(월)까지 회신', body: '참여하실 상품과 담당자 연락처를 알려 주세요.' },
  { no: '2', title: '광고 소재와 매장 정보 전달', body: '착이 안내하는 규격에 맞춰 광고 소재를, 입점하시면 쿠폰과 매장 정보를 보내 주세요.' },
  { no: '3', title: '입금하면 바로 시작', body: '입금을 확인하면 바로 노출이 시작돼요.' },
] as const

export const BEFORE_EXAM_STEPS = [
  { title: '책상 만들기', body: '응원을 열어볼 시간을 정해요.' },
  { title: '친구 응원', body: '링크 하나로, 로그인 없이 남겨요.' },
  { title: '매일 열기', body: '이때 브랜드 광고가 보여요.', highlight: true },
] as const

export const AFTER_EXAM_STEPS = [
  { title: '응원 결산', body: '한 달 동안의 응원을 SNS에 공유해요.' },
  { title: '혜택함 열기', body: '입점한 쿠폰과 가까운 매장이 보여요.', highlight: true },
  { title: '매장 방문', body: '가까운 매장에서 쿠폰을 써요.' },
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
  '매장 1곳 상품은 1개 매장 기준으로 적용돼요.',
] as const

export const SCHEDULE = [
  { date: '11월 2일', note: '제안 회신 기한', key: true },
  { date: '11월 12일', note: '최종 입금 마감', key: true },
  { date: '11월 19일', note: '수능 당일, 마지막 응원', key: false },
  { date: '11월 20일 ~ 30일', note: '혜택함 노출, 30일에 종료', key: false },
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
export const BRAND_COMMON_TEXT = BRAND_COMMON.map(tight)
export const FRANCHISE_SCOPES_TEXT = FRANCHISE_SCOPES.map(tight)
