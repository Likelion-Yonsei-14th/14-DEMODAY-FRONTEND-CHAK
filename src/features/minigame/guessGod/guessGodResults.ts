export type GuessGodTier =
  | 'day-off'
  | 'off-day'
  | 'rookie'
  | 'expert'
  | 'master'
  | 'legend'

export type GuessGodResult = {
  tier: GuessGodTier
  minScore: number
  maxScore: number
  title: string
  quote: string
  description: string
  /** Card background and accent; pairs chosen from the design tokens. */
  tone: { background: string; accent: string }
}

/** Score bands, lowest first. Every score 0-10 falls in exactly one. */
export const GUESS_GOD_RESULTS: readonly GuessGodResult[] = [
  {
    tier: 'day-off',
    minScore: 0,
    maxScore: 0,
    title: '찍신 휴무일',
    quote: '오늘은 찍신도 쉬어가는 날인가 봐요.',
    description:
      '10문제를 전부 비켜 가는 것도 나름 특별한 기록이에요. 찍신이 자리를 비운 사이, 운은 아껴 뒀다고 생각해요.',
    tone: { background: 'var(--color-lilac-soft)', accent: 'var(--color-lilac)' },
  },
  {
    tier: 'off-day',
    minScore: 1,
    maxScore: 2,
    title: '오늘은 감이 안 오는 날',
    quote: '오늘은 운보다 실력을 믿는 게 좋겠어요.',
    description:
      '사실 아무렇게나 찍으면 평균 2문제 정도 맞혀요. 지극히 평범한 운이니, 감 대신 실력으로 승부해 봐요.',
    tone: { background: 'var(--color-sky-soft)', accent: 'var(--color-sky)' },
  },
  {
    tier: 'rookie',
    minScore: 3,
    maxScore: 4,
    title: '찍기 유망주',
    quote: '오늘 감이 꽤 괜찮은데요?',
    description:
      '무작위로 찍었을 때의 평균보다 더 맞혔어요. 오늘은 감이 살짝 따라와 주는 날이에요.',
    tone: { background: 'var(--color-sage-soft)', accent: 'var(--color-sage)' },
  },
  {
    tier: 'expert',
    minScore: 5,
    maxScore: 6,
    title: '찍기 고수',
    quote: '이 정도면 찍기에도 재능이 있는 걸까요?',
    description:
      '절반 넘게 맞히는 건 운이 꽤 좋아야 나오는 결과예요. 오늘의 행운, 어디에 쓸지 잘 골라 봐요.',
    tone: { background: 'var(--color-butter-soft)', accent: 'var(--color-warning)' },
  },
  {
    tier: 'master',
    minScore: 7,
    maxScore: 8,
    title: '수능 찍기 장인',
    quote: '혹시 정답이 보이는 건 아니죠?',
    description:
      '찍어서 이만큼 맞힐 확률은 1%도 안 돼요. 정말 드문 결과니 오늘은 마음껏 자랑해도 좋아요.',
    tone: { background: 'var(--color-pink-soft)', accent: 'var(--color-pink)' },
  },
  {
    tier: 'legend',
    minScore: 9,
    maxScore: 10,
    title: '전설의 찍신',
    quote: '오늘 찍신이 당신에게 강림했습니다!',
    description:
      '수십만 번에 한 번 나올까 말까 한 결과예요. 오늘 찍신은 확실히 당신 편이었어요.',
    tone: { background: 'var(--color-brand-soft)', accent: 'var(--color-brand)' },
  },
]

export function getGuessGodResult(score: number): GuessGodResult {
  const clamped = Math.max(0, Math.min(10, Math.round(score)))
  return GUESS_GOD_RESULTS.find(
    (result) => clamped >= result.minScore && clamped <= result.maxScore,
  )!
}

/** A score from a shared link: only whole numbers 0-10 are accepted. */
export function parseSharedScore(value: string | undefined): number | null {
  if (!value || !/^(10|[0-9])$/.test(value)) return null
  return Number(value)
}
