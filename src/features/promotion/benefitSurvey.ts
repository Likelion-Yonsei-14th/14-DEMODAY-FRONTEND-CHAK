/**
 * 혜택 시안 신청서(제휴 업체가 보내는 혜택 정보)의 문항과 검증. 화면은 이 정의를 그대로 그리고,
 * 서버(BenefitAnswerValidator)가 받는 칸 이름과 선택지 코드가 여기와 같다. 문구는 자유롭게 고쳐도 되지만 id와 value는 서버와 함께 바꾼다.
 */

export type Values = Record<string, string | string[]>

export type Option = { value: string; label: string }

type Base = {
  /** 서버가 받는 칸 이름. */
  id: string
  label: string
  required?: boolean
  hint?: string
  placeholder?: string
  /** 있으면 이 조건을 만족할 때만 보이고 검증한다(고른 선택지에 딸린 문항). */
  when?: (values: Values) => boolean
  /** 위 문항에 딸린 문항이라 들여 써서 보여 준다. */
  sub?: boolean
}

export type Question =
  | (Base & { kind: 'text' | 'url' | 'date'; max?: number })
  | (Base & { kind: 'longtext'; max: number })
  | (Base & { kind: 'email' | 'phone' })
  | (Base & { kind: 'number'; min: number; max: number; unit?: string })
  | (Base & { kind: 'select' | 'radio' | 'checkbox'; options: readonly Option[] })
  | (Base & { kind: 'file'; purpose: 'LOGO' | 'SHEET'; accept: string })

export type Page = { title: string; note?: string; questions: readonly Question[] }

const options = (pairs: readonly (readonly [string, string])[]): Option[] =>
  pairs.map(([value, label]) => ({ value, label }))

const picked = (values: Values, id: string, code: string) => {
  const value = values[id]
  return Array.isArray(value) ? value.includes(code) : value === code
}

const CODE_METHODS = ['REGISTER_IN_APP', 'MALL_COUPON_CODE', 'BOOKING_COUPON_CODE']

export const BENEFIT_DATES = {
  sendBy: '11월 12일',
  proposalBy: '11월 14일',
} as const

export const BENEFIT_PAGES: readonly Page[] = [
  {
    title: '업체 정보',
    questions: [
      { id: 'brand', kind: 'text', label: '브랜드(업체)명을 공식 표기 그대로 적어주세요', required: true, max: 100 },
      {
        id: 'category',
        kind: 'select',
        label: '업종',
        required: true,
        options: options([
          ['CAFE', '카페·디저트'], ['FOOD', '음식점·외식'], ['BEAUTY_SALON', '헤어·네일·퍼스널컬러'], ['COSMETICS', '뷰티·화장품'],
          ['FASHION', '패션·잡화'], ['OPTICAL', '안경·렌즈'], ['PHOTO', '사진관·포토부스'], ['THEME_PARK', '놀이공원·테마파크'],
          ['CULTURE', '영화·공연·티켓'], ['ENTERTAINMENT', '방탈출·PC방·노래방'], ['FITNESS', '헬스·필라테스'], ['TRAVEL', '여행·항공·숙박'],
          ['ELECTRONICS', '전자기기·가전'], ['TELECOM', '통신사'], ['FINANCE', '은행·금융'], ['OTT', 'OTT·콘텐츠 구독'],
          ['EDUCATION', '교육·어학·자격증·운전면허'], ['JOBS', '알바·취업 플랫폼'], ['OTHER', '기타'],
        ]),
      },
      { id: 'contactName', kind: 'text', label: '담당자 이름', required: true, max: 50 },
      { id: 'phone', kind: 'phone', label: '담당자 연락처', required: true },
      { id: 'email', kind: 'email', label: '담당자 이메일', required: true, hint: '시안을 이 주소로 보내드려요' },
    ],
  },
  {
    title: '혜택 내용',
    questions: [
      {
        id: 'target',
        kind: 'radio',
        label: '누가 혜택을 받을 수 있나요?',
        required: true,
        options: options([
          ['CHAK_PARTICIPANT', '착 참여자 (착 수험생 혜택함에서 받은 쿠폰이나 화면으로 인증)'],
          ['SNS_EVENT', '착 SNS 이벤트 참여자'],
          ['EXAM_TICKET_HOLDER', '수험표를 가진 수험생 누구나'],
          ['OTHER', '기타'],
        ]),
      },
      { id: 'targetOther', kind: 'text', label: '혜택 대상', required: true, max: 100, sub: true, when: (v) => v.target === 'OTHER' },
      {
        id: 'benefits',
        kind: 'checkbox',
        label: '혜택 유형 (해당하는 것 모두 선택)',
        required: true,
        options: options([
          ['PERCENT', '% 할인'], ['AMOUNT', '금액 할인'], ['SPECIAL_PRICE', '수험생 특별가'], ['TICKET_COUPON', '관람·이용권 쿠폰'],
          ['FREE_GIFT', '구매 시 무료 증정'], ['UPGRADE', '사이즈업·업그레이드'], ['PLUS_ONE', '1+1·동반인 혜택'], ['POINTS', '적립·포인트'], ['OTHER', '기타'],
        ]),
      },
      { id: 'percent', kind: 'number', label: '할인율 (%)', required: true, min: 1, max: 100, unit: '%', sub: true, when: (v) => picked(v, 'benefits', 'PERCENT') },
      { id: 'amount', kind: 'number', label: '할인 금액 (원)', required: true, min: 1, max: 100_000_000, unit: '원', sub: true, when: (v) => picked(v, 'benefits', 'AMOUNT') },
      { id: 'regularPrice', kind: 'number', label: '정가 (원)', required: true, min: 1, max: 100_000_000, unit: '원', sub: true, when: (v) => picked(v, 'benefits', 'SPECIAL_PRICE') },
      { id: 'specialPrice', kind: 'number', label: '수험생 특별가 (원)', required: true, min: 1, max: 100_000_000, unit: '원', sub: true, when: (v) => picked(v, 'benefits', 'SPECIAL_PRICE') },
      { id: 'couponDetail', kind: 'text', label: '쿠폰 내용', required: true, max: 200, placeholder: '예) 2D 영화 관람 6,000원', sub: true, when: (v) => picked(v, 'benefits', 'TICKET_COUPON') },
      { id: 'giftItem', kind: 'text', label: '증정 품목', required: true, max: 200, placeholder: '예) 감자튀김 S', sub: true, when: (v) => picked(v, 'benefits', 'FREE_GIFT') },
      { id: 'upgradeDetail', kind: 'text', label: '업그레이드 내용', required: true, max: 200, placeholder: '예) 음료 사이즈업 무료', sub: true, when: (v) => picked(v, 'benefits', 'UPGRADE') },
      { id: 'maxCompanions', kind: 'number', label: '동반 가능 인원 (명)', required: true, min: 1, max: 1000, unit: '명', sub: true, when: (v) => picked(v, 'benefits', 'PLUS_ONE') },
      { id: 'companionDetail', kind: 'text', label: '동반인 혜택 내용', required: true, max: 200, placeholder: '예) 동반 1인까지 같은 특별가', sub: true, when: (v) => picked(v, 'benefits', 'PLUS_ONE') },
      { id: 'pointDetail', kind: 'text', label: '적립 내용', required: true, max: 200, placeholder: '예) 구매 금액 10% 적립', sub: true, when: (v) => picked(v, 'benefits', 'POINTS') },
      { id: 'otherBenefitDetail', kind: 'text', label: '기타 혜택 내용', required: true, max: 200, sub: true, when: (v) => picked(v, 'benefits', 'OTHER') },
      { id: 'headlineRaw', kind: 'text', label: '혜택을 한 줄로 요약해 주세요 (20자 이내)', required: true, max: 20, placeholder: '예) 수험생 전 음료 20% 할인', hint: '광고 시안의 메인 문구로 사용돼요' },
      { id: 'benefitDetail', kind: 'longtext', label: '혜택 상세 설명', required: true, max: 1000, placeholder: '예) 수험표를 보여주시면 전 음료 20% 할인해 드려요. 1인 1회 사용할 수 있어요.' },
      { id: 'startDate', kind: 'date', label: '혜택 시작일', required: true },
      { id: 'endDate', kind: 'date', label: '혜택 종료일', required: true },
    ],
  },
  {
    title: '사용 방법',
    questions: [
      {
        id: 'usageMethods',
        kind: 'checkbox',
        label: '수험생은 혜택을 어떻게 사용하나요? (해당하는 것 모두 선택)',
        required: true,
        options: options([
          ['SHOW_EXAM_TICKET', '매장에서 수험표 제시'], ['SHOW_CHAK_SCREEN', '매장에서 착 혜택함 화면 제시'], ['REGISTER_IN_APP', '공식 앱에서 쿠폰 등록'],
          ['MALL_COUPON_CODE', '온라인몰 결제 시 쿠폰코드 입력'], ['BOOKING_COUPON_CODE', '예매 시 쿠폰코드 입력'], ['BOX_OFFICE', '현장 매표소에서 제시'],
          ['DEDICATED_LINK', '전용 링크로 구매·예약'], ['OTHER', '기타'],
        ]),
      },
      { id: 'appName', kind: 'text', label: '앱 이름', required: true, max: 100, sub: true, when: (v) => picked(v, 'usageMethods', 'REGISTER_IN_APP') },
      { id: 'couponPath', kind: 'text', label: '쿠폰 등록 경로', max: 200, placeholder: '예) 마이 → 쿠폰 → 쿠폰 등록', sub: true, when: (v) => picked(v, 'usageMethods', 'REGISTER_IN_APP') },
      { id: 'mallUrl', kind: 'url', label: '온라인몰 주소', placeholder: 'https://', sub: true, when: (v) => picked(v, 'usageMethods', 'MALL_COUPON_CODE') },
      {
        id: 'bookingChannels',
        kind: 'checkbox',
        label: '예매처',
        options: options([['APP', '앱'], ['WEB', '웹사이트'], ['KIOSK', '현장 키오스크·매표소']]),
        sub: true,
        when: (v) => picked(v, 'usageMethods', 'BOOKING_COUPON_CODE'),
      },
      { id: 'dedicatedUrl', kind: 'url', label: '전용 링크', required: true, placeholder: 'https://', sub: true, when: (v) => picked(v, 'usageMethods', 'DEDICATED_LINK') },
      { id: 'otherUsageDetail', kind: 'text', label: '기타 사용 방법', required: true, max: 200, sub: true, when: (v) => picked(v, 'usageMethods', 'OTHER') },
      {
        id: 'couponIssue',
        kind: 'radio',
        label: '쿠폰 코드는 어떻게 발급하나요?',
        required: true,
        options: options([
          ['SHARED_CODE', '공용 코드 1개 (모든 수험생이 같은 코드 사용)'],
          ['UNIQUE_CODES', '1인 1코드 (고유 코드를 파일로 전달)'],
          ['ISSUED_BY_BRAND', '업체 앱·사이트에서 직접 발급'],
        ]),
        when: (v) => CODE_METHODS.some((code) => picked(v, 'usageMethods', code)),
      },
      { id: 'couponCode', kind: 'text', label: '공용 코드', required: true, max: 100, sub: true, when: (v) => picked(v, 'couponIssue', 'SHARED_CODE') },
      { id: 'couponQuantity', kind: 'number', label: '발급 수량 (개)', required: true, min: 1, max: 10_000_000, unit: '개', sub: true, when: (v) => picked(v, 'couponIssue', 'UNIQUE_CODES') },
      {
        id: 'couponFileKey',
        kind: 'file',
        purpose: 'SHEET',
        accept: '.csv,.xlsx,.xls',
        label: '코드 파일 (엑셀·CSV)',
        required: true,
        sub: true,
        when: (v) => picked(v, 'couponIssue', 'UNIQUE_CODES'),
      },
      { id: 'couponGuideUrl', kind: 'url', label: '발급 안내 페이지', placeholder: 'https://', sub: true, when: (v) => picked(v, 'couponIssue', 'ISSUED_BY_BRAND') },
      {
        id: 'conditions',
        kind: 'checkbox',
        label: '이용 조건 (해당하는 것 모두 선택)',
        options: options([
          ['EXAM_TICKET', '2027학년도 수험표 지참'], ['ID_CHECK', '신분증 확인'], ['CHAK_PARTICIPATION', '착 참여 인증 필요'],
          ['SNS_PARTICIPATION', '착 SNS 참여 인증 필요'], ['ONCE_PER_PERSON', '1인 1회'], ['COMPANION_LIMIT', '동반 인원 제한'],
          ['MIN_PURCHASE', '최소 구매 금액 있음'], ['LIMITED_QUANTITY', '선착순·수량 한정'], ['MEMBER_SIGNUP', '업체 앱 회원가입 필요'],
          ['SPECIFIC_ITEMS', '특정 상품·메뉴만 적용'], ['BLACKOUT', '사용 불가 요일·시간 있음'], ['NO_STACKING', '타 할인과 중복 불가'], ['OTHER', '기타'],
        ]),
      },
      { id: 'snsMethod', kind: 'text', label: 'SNS 인증 방법', max: 200, placeholder: '예) 착 게시물 공유 캡처 제시', sub: true, when: (v) => picked(v, 'conditions', 'SNS_PARTICIPATION') },
      { id: 'conditionMaxCompanions', kind: 'number', label: '최대 동반 인원 (명)', required: true, min: 1, max: 1000, unit: '명', sub: true, when: (v) => picked(v, 'conditions', 'COMPANION_LIMIT') },
      { id: 'conditionMinAmount', kind: 'number', label: '최소 구매 금액 (원)', required: true, min: 1, max: 100_000_000, unit: '원', sub: true, when: (v) => picked(v, 'conditions', 'MIN_PURCHASE') },
      { id: 'conditionQuantity', kind: 'number', label: '한정 수량 (개)', required: true, min: 1, max: 10_000_000, unit: '개', sub: true, when: (v) => picked(v, 'conditions', 'LIMITED_QUANTITY') },
      { id: 'conditionItems', kind: 'text', label: '적용 상품·메뉴', required: true, max: 300, sub: true, when: (v) => picked(v, 'conditions', 'SPECIFIC_ITEMS') },
      { id: 'conditionExcluded', kind: 'text', label: '사용 불가 요일·시간', required: true, max: 300, placeholder: '예) 주말·공휴일 제외', sub: true, when: (v) => picked(v, 'conditions', 'BLACKOUT') },
      { id: 'conditionOther', kind: 'text', label: '기타 조건', required: true, max: 300, sub: true, when: (v) => picked(v, 'conditions', 'OTHER') },
      { id: 'requiredNotice', kind: 'longtext', label: '광고에 꼭 들어가야 하는 유의사항 문구가 있다면 적어주세요', max: 1000, hint: '적어주신 문구는 수정하지 않고 그대로 넣어요' },
    ],
  },
  {
    title: '참여 매장 · 시안 자료',
    questions: [
      {
        id: 'scope',
        kind: 'radio',
        label: '참여 범위',
        required: true,
        options: options([['ALL_STORES', '전 매장'], ['SOME_STORES', '일부 매장'], ['ONLINE_ONLY', '온라인만']]),
      },
      { id: 'storeList', kind: 'longtext', label: '참여 매장 목록 (매장명·지역)', required: true, max: 3000, placeholder: '예) 강남역점(서울 강남구), 해운대점(부산 해운대구)', sub: true, when: (v) => v.scope === 'SOME_STORES' },
      { id: 'storeFileKey', kind: 'file', purpose: 'SHEET', accept: '.csv,.xlsx,.xls', label: '매장 목록 파일', sub: true, when: (v) => v.scope === 'SOME_STORES' },
      {
        id: 'logoFileKey',
        kind: 'file',
        purpose: 'LOGO',
        accept: '.png,.jpg,.jpeg,.svg,.webp,.pdf,.ai,.eps,.zip',
        label: '로고 파일',
        required: true,
        hint: '투명 배경 PNG, SVG, AI 파일을 권장해요. 홈페이지 캡처 이미지는 화질이 깨질 수 있어요.',
      },
      {
        id: 'exposure',
        kind: 'checkbox',
        label: '브랜드명·로고를 노출해도 되는 곳 (해당하는 것 모두 선택)',
        required: true,
        options: options([
          ['BENEFIT_BOX', '착 수험생 혜택함 (필수)'], ['OFFICIAL_SNS', '착 공식 SNS (@chak__put)'], ['PROPOSAL', "착 서비스 소개서 '함께하는 기업'"],
        ]),
      },
      {
        id: 'reviewPeriod',
        kind: 'radio',
        label: '시안 확인에 걸리는 기간',
        required: true,
        options: options([['WITHIN_1_DAY', '1일 이내'], ['DAYS_2_3', '2~3일'], ['WEEK_PLUS', '1주 이상']]),
      },
      { id: 'officialSns', kind: 'text', label: '공식 SNS 계정', max: 100, placeholder: '예) @브랜드_공식계정' },
      { id: 'message', kind: 'longtext', label: '남기고 싶은 말', max: 2000 },
    ],
  },
]

export const isVisible = (question: Question, values: Values) => !question.when || question.when(values)

export const visibleQuestions = (page: Page, values: Values) => page.questions.filter((question) => isVisible(question, values))

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const PHONE = /^[0-9+\-() ]{7,30}$/

const textOf = (values: Values, id: string) => {
  const value = values[id]
  return typeof value === 'string' ? value.trim() : ''
}

/** 숫자 칸 값을 정수로 바꾼다. "20퍼"나 소수처럼 숫자가 아니면 null. */
export const parseWhole = (text: string): number | null => (/^\d{1,12}$/.test(text) ? Number(text) : null)

function checkQuestion(question: Question, values: Values): string | null {
  const value = values[question.id]
  const empty = Array.isArray(value) ? value.length === 0 : !(value ?? '').trim()
  if (empty) return question.required ? '꼭 답해 주세요' : null

  const text = textOf(values, question.id)
  switch (question.kind) {
    case 'email':
      return EMAIL.test(text) ? null : '이메일 주소를 확인해 주세요'
    case 'phone':
      return PHONE.test(text) ? null : '숫자로 연락처를 적어 주세요'
    case 'url':
      return /^https?:\/\/\S+\.\S+$/.test(text) ? null : 'https://로 시작하는 주소를 적어 주세요'
    case 'number': {
      const whole = parseWhole(text)
      if (whole === null) return '숫자만 적어 주세요'
      return whole >= question.min && whole <= question.max ? null : `${question.min.toLocaleString()}~${question.max.toLocaleString()} 사이로 적어 주세요`
    }
    case 'text':
    case 'longtext':
      return question.max && text.length > question.max ? `${question.max}자까지 적을 수 있어요` : null
    default:
      return null
  }
}

/** 보이는 문항만 검사한다. 칸 이름 → 안내 문구. 비어 있으면 통과. */
export function validatePage(page: Page, values: Values): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const question of visibleQuestions(page, values)) {
    const message = checkQuestion(question, values)
    if (message) errors[question.id] = message
  }

  const regular = parseWhole(textOf(values, 'regularPrice'))
  const special = parseWhole(textOf(values, 'specialPrice'))
  if (!errors.specialPrice && regular !== null && special !== null && special >= regular) {
    errors.specialPrice = '정가보다 낮게 적어 주세요'
  }
  const start = textOf(values, 'startDate')
  const end = textOf(values, 'endDate')
  if (!errors.endDate && start && end && end < start) {
    errors.endDate = '시작일 이후로 골라 주세요'
  }
  return errors
}

/** 서버로 보낼 답변. 보이지 않는 문항(고르지 않은 선택지에 딸린 것)은 빼고, 숫자는 숫자로 보낸다. */
export function toAnswers(values: Values): Record<string, string | number | string[]> {
  const answers: Record<string, string | number | string[]> = {}
  for (const page of BENEFIT_PAGES) {
    for (const question of visibleQuestions(page, values)) {
      const value = values[question.id]
      if (Array.isArray(value)) {
        if (value.length > 0) answers[question.id] = value
        continue
      }
      const text = (value ?? '').trim()
      if (!text) continue
      answers[question.id] = question.kind === 'number' ? Number(text) : text
    }
  }
  return answers
}

export const optionLabel = (id: string, code: string) => {
  for (const page of BENEFIT_PAGES) {
    const question = page.questions.find((item) => item.id === id)
    if (question && 'options' in question) return question.options.find((option) => option.value === code)?.label ?? code
  }
  return code
}
