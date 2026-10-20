/**
 * Quotes taped to the classroom chalkboard as paper notes. They are curated
 * by the service (admin), not written by members: exam-season phrases and
 * cheers from university students. A few are shown each day.
 */
export type BoardQuote = {
  id: string
  text: string
  /** Who it is from, shown small under the quote */
  source: string
  paper: string
}

const PAPERS = ['#F6EDD2', '#F9E08B', '#F7C9D2', '#CDEBDD'] as const

const QUOTES: Omit<BoardQuote, 'paper'>[] = [
  { id: 'q-enough', text: '오늘 한 만큼이면 충분해', source: '수능 글귀' },
  { id: 'q-dont-stop', text: '느려도 멈추지만 않으면 돼', source: '수능 글귀' },
  { id: 'q-so-far', text: '여기까지 온 것도 정말 대단해', source: '수능 글귀' },
  { id: 'q-sleep', text: '잠은 줄이지 말고, 걱정을 줄이자', source: '수능 글귀' },
  { id: 'q-mistake', text: '틀린 문제는 오늘 고치면 내 거야', source: '수능 글귀' },
  { id: 'q-breathe', text: '시험지 받기 전에 숨 한 번 크게', source: '수능 글귀' },
  { id: 'q-senior-1', text: '수능 날 아침 도시락이 제일 맛있었어', source: '대학생 선배' },
  { id: 'q-senior-2', text: '한 문제에 너무 오래 머물지 마, 다음 문제가 기다려', source: '대학생 선배' },
  { id: 'q-senior-3', text: '끝나고 나면 진짜 별거 아니었다고 웃게 돼', source: '대학생 선배' },
  { id: 'q-senior-4', text: '지금 버티는 너, 내년에 엄청 자랑스러울 거야', source: '대학생 선배' },
]

/** The same few quotes all day, a different set the next day. */
export function getTodaysBoardQuotes(count = 2, now = new Date()): BoardQuote[] {
  const day = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000,
  )
  const start = (day * 3) % QUOTES.length
  return Array.from({ length: Math.min(count, QUOTES.length) }, (_, index) => {
    const quote = QUOTES[(start + index * 4) % QUOTES.length]!
    return { ...quote, paper: PAPERS[(day + index) % PAPERS.length]! }
  })
}
