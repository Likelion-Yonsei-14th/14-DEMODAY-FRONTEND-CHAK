import { PROMOTION_CONTACT } from '../../promotion/promotionContent'
import { categoryOf, estimate, people, percent, won, type PitchInput } from './pitchModel'

export type PitchSlide = {
  kicker: string
  title: string
  /** 큰 숫자 칸 */
  stats?: { label: string; value: string; strong?: boolean }[]
  bullets?: string[]
  note?: string
  tone?: 'cover' | 'dark'
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
      bullets: ['수능 전엔 매일 응원을, 수능 후엔 할인을.', '수능 끝난 고3이 가장 먼저 여는 수능 응원 앱 착'],
    },
    {
      kicker: '문제와 해결',
      title: '수험생 프로모션, 수능이 끝난 뒤에 알려도 충분할까요?',
      bullets: [
        '수능 전 · 수험생과 미리 관계를 만들기 어려워요.',
        '수능 당일 · 여러 가게의 혜택이 한꺼번에 쏟아져요.',
        '수능 후 · 혜택을 알려도 실제 방문으로 이어지기 어려워요.',
      ],
      note: `착이라면 수능 전에 알린 ${josa(store, '을', '를')}, 수능 후의 실제 방문으로 이어 드려요.`,
    },
    {
      kicker: '수험생이 매일 여는 앱',
      title: `${near} 수험생이 매일 착을 열어요`,
      stats: [
        { label: '지금 일 접속자', value: people(input.visitorsNow) },
        { label: '수능 당일 예상', value: people(input.visitorsExpected), strong: true },
      ],
      bullets: [
        '수능 전 · 정해진 시간에 열리는 응원을 확인하러 매일 들어와요.',
        '수능 다음 날 · 혜택함이 열리고 가까운 매장의 쿠폰을 받아요.',
        '수능 후 · 쿠폰을 보여 주고 매장에서 수험생 할인을 받아요.',
      ],
    },
    {
      kicker: '광고 상품',
      title: '2단계 광고 패키지',
      bullets: [
        '1단계 B안 · 응원 화면 광고 모달: 응원을 열 때 뜨는 영상 · 사진 광고',
        '2단계 A안 · 수험생 혜택함 입점: 혜택 목록 → 상세 → 쿠폰 발급 (수능 다음 날 ~ 11월 30일)',
        'C안 · 1+2단계 패키지: 응원 화면 노출부터 매장 방문까지 한 번의 흐름으로',
      ],
    },
    {
      kicker: `${store} 예상 수익`,
      title: '적은 광고비로, 그보다 큰 수익을 기대할 수 있어요',
      stats: [
        { label: `${near} 쿠폰 도달`, value: people(result.reach) },
        { label: `예상 방문 (전환율 ${percent(input.conversion)})`, value: people(result.visits) },
        { label: `예상 수익 (객단가 ${won(input.spend)} · 수익률 ${percent(input.margin)})`, value: won(result.profit), strong: true },
        { label: '제안 광고비', value: won(result.adPrice), strong: true },
      ],
      bullets: [
        `수능 당일 예상 접속자 ${people(input.visitorsExpected)} 중 혜택함을 여는 ${percent(input.openRate)}, 그중 ${near} 수험생 ${percent(input.localRate)}를 기준으로 계산했어요.`,
        `예상 매출 ${won(result.sales)}, 광고비를 빼고도 ${won(result.net)}이 남아요.`,
      ],
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
        `참여 문의 · ${PROMOTION_CONTACT.phone} · ${PROMOTION_CONTACT.email} · 담당 ${PROMOTION_CONTACT.manager}`,
      ],
    },
  ]
}

export const deckFileName = (input: PitchInput) =>
  `CHAK_제휴제안_${(input.storeName.trim() || '매장').replace(/[\\/:*?"<>|\s]+/g, '_')}.pptx`
