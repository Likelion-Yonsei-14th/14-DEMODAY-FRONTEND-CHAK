import { PROMOTION_CONTACT } from '../../promotion/promotionContent'
import { categoryOf, defaultInput, estimate, people, percent, won, type PitchInput } from './pitchModel'

export type PitchStat = { label: string; value: string; strong?: boolean }
export type PitchCard = { tag?: string; title: string; body: string; highlight?: boolean }
export type PitchStep = { label: string; value: string; sub?: string }

/** 한 장의 내용. 있는 칸만 위에서부터 차례로 그린다(숫자 → 카드 → 단계 → 비교 → 글머리 → 주석). */
export type PitchSlide = {
  kicker: string
  title: string
  tone?: 'cover' | 'dark'
  /** 표지의 알약 모양 문구 */
  pill?: string
  /** 큰 숫자 칸 */
  stats?: PitchStat[]
  cards?: PitchCard[]
  /** 화살표로 이어지는 단계(예상 접속자 → 방문) */
  steps?: PitchStep[]
  /** 예상 수익과 광고비를 나란히 견준다. ratio는 광고비 ÷ 예상 수익 */
  compare?: { profit: string; price: string; ratio: number; summary: string }
  bullets?: string[]
  note?: string
}

/** 받침에 맞는 조사를 붙인다: josa('착커피', '으로', '로') → '착커피로'. 한글로 끝나지 않으면 받침 없는 쪽을 쓴다. */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = (word.trim().at(-1) ?? '').charCodeAt(0) - 0xac00
  if (Number.isNaN(code) || code < 0 || code > 11171) return word + withoutFinal
  const final = code % 28
  if (withFinal === '으로') return word + (final === 0 || final === 8 ? '로' : '으로')
  return word + (final === 0 ? withoutFinal : withFinal)
}

/** 입력한 매장에 맞춘 장표. 화면 미리보기와 pptx가 같은 내용을 쓴다. */
export function buildSlides(input: PitchInput): PitchSlide[] {
  const store = input.storeName.trim() || '우리 매장'
  const place = input.location.trim()
  const category = categoryOf(input.categoryId)
  const result = estimate(input)
  const near = place ? `${place} 근처` : '매장 근처'

  return [
    {
      tone: 'cover',
      kicker: `${[place, category.label].filter(Boolean).join(' · ')} 제휴 제안`,
      title: `수능이 끝나면, ${josa(store, '으로', '로')}.`,
      pill: '2026 수능 로컬 매장 파트너 모집',
      bullets: ['수능 전엔 매일 응원을, 수능 후엔 할인을.', '수능 끝난 고3이 가장 먼저 여는 수능 응원 앱 착'],
    },
    {
      kicker: '문제와 해결',
      title: '수험생 프로모션, 수능이 끝난 뒤에 알려도 충분할까요?',
      cards: [
        { tag: '수능 전', title: '고객 접점 부족', body: '수험생과 미리 관계를 만들기 어려워요.' },
        { tag: '수능 당일', title: '프로모션 경쟁', body: '여러 가게의 혜택이 한꺼번에 쏟아져요.' },
        { tag: '수능 후', title: '방문 전환의 어려움', body: '혜택을 알려도 실제 방문으로 이어지기 어려워요.' },
      ],
      bullets: [`착이라면 수능 전에 알린 ${josa(store, '을', '를')}, 수능 후의 실제 방문으로 이어 드려요.`],
    },
    {
      kicker: '수험생이 매일 여는 앱',
      title: `${near} 수험생이 매일 착을 열어요`,
      stats: [
        { label: '지금 일 접속자', value: people(input.visitorsNow) },
        { label: '수능 당일 예상', value: people(input.visitorsExpected), strong: true },
      ],
      cards: [
        { tag: '1 · 수능 전 매일', title: '응원 확인', body: '정해진 시간에 열리는 응원을 보러 매일 들어와요.' },
        { tag: '2 · 수능 다음 날', title: '혜택함 오픈', body: '가까운 매장의 쿠폰을 받아요.' },
        { tag: '3 · 수능 후', title: '매장 방문', body: '쿠폰을 보여 주고 수험생 할인을 받아요.', highlight: true },
      ],
    },
    {
      kicker: '광고 상품',
      title: '2단계 광고 패키지',
      cards: [
        { tag: '1단계 · B안', title: '응원 화면 광고 모달', body: '응원을 열 때 뜨는 영상 · 사진 광고로 매장을 먼저 기억시켜요.' },
        { tag: '2단계 · A안', title: '수험생 혜택함 입점', body: '혜택 목록 → 상세 → 쿠폰 발급. 수능 다음 날부터 11월 30일까지 노출돼요.' },
        { tag: 'C안', title: '1+2단계 패키지', body: '응원 화면 노출부터 매장 방문까지 한 번의 흐름으로 이어져요.', highlight: true },
      ],
    },
    {
      kicker: `${store} 예상 수익`,
      title: '적은 광고비로, 그보다 큰 수익을 기대할 수 있어요',
      steps: [
        { label: '수능 당일 예상 접속자', value: people(input.visitorsExpected) },
        { label: `${near} 쿠폰 도달`, value: people(result.reach), sub: `혜택함 ${percent(input.openRate)} · 근처 ${percent(input.localRate)}` },
        { label: '예상 방문', value: people(result.visits), sub: `전환율 ${percent(input.conversion)}` },
        { label: '예상 매출', value: won(result.sales), sub: `객단가 ${won(input.spend)}` },
      ],
      compare: {
        profit: won(result.profit),
        price: won(result.adPrice),
        ratio: result.profit > 0 ? result.adPrice / result.profit : 0,
        summary: `수익률 ${percent(input.margin)} 기준이에요. 광고비를 빼고도 ${won(result.net)}이 남아요.`,
      },
      note: '예상치는 업종 평균을 바탕으로 한 가정값이에요.',
    },
    {
      tone: 'dark',
      kicker: '예상 수익, 그 다음',
      title: '수험생의 첫 단골 매장이 되세요',
      stats: [
        { label: `다시 찾는 고객 (재방문율 ${percent(input.revisitRate)})`, value: people(result.revisitors) },
        { label: `1년 추가 기대 수익 (연 ${input.revisitCount}회 방문)`, value: won(result.loyaltyProfit), strong: true },
      ],
      bullets: [
        '수험생은 이제 막 소비를 시작하는 사회 초년생이에요.',
        '처음 간 매장을 계속 찾는 경향이 있어, 수능 직후의 첫 방문이 오래가는 단골로 이어질 수 있어요.',
      ],
      note: `참여 문의 · ${PROMOTION_CONTACT.phone} · ${PROMOTION_CONTACT.email} · 담당 ${PROMOTION_CONTACT.manager}`,
    },
  ]
}

export const deckFileName = (input: PitchInput) =>
  `CHAK_제휴제안_${(input.storeName.trim() || '매장').replace(/[\\/:*?"<>|\s]+/g, '_')}.pptx`

/** 웹으로 여는 주소에 싣는 값. 주소가 짧도록 기본값과 다른 것만 넣는다. */
export function encodeDeck(input: PitchInput): string {
  const base = defaultInput(input.categoryId)
  const changed = Object.fromEntries(Object.entries(input).filter(([key, value]) => key === 'categoryId' || base[key as keyof PitchInput] !== value))
  const bytes = new TextEncoder().encode(JSON.stringify(changed))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 주소의 값을 되돌린다. 깨졌거나 모르는 값은 버리고 기본값을 쓴다. */
export function decodeDeck(code: string | null): PitchInput {
  let raw: Record<string, unknown> = {}
  try {
    const binary = atob((code ?? '').replace(/-/g, '+').replace(/_/g, '/'))
    const parsed: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))))
    if (parsed && typeof parsed === 'object') raw = parsed as Record<string, unknown>
  } catch {
    raw = {}
  }
  const input = defaultInput(typeof raw.categoryId === 'string' ? raw.categoryId : undefined)
  for (const key of Object.keys(input) as (keyof PitchInput)[]) {
    const value = raw[key]
    if (key === 'categoryId') continue
    if (typeof input[key] === 'string' && typeof value === 'string') Object.assign(input, { [key]: value.slice(0, 30) })
    if (typeof input[key] === 'number' && typeof value === 'number' && Number.isFinite(value) && value >= 0) Object.assign(input, { [key]: value })
  }
  return input
}

export const deckPath = (input: PitchInput) => `/promotion/deck?d=${encodeDeck(input)}`
