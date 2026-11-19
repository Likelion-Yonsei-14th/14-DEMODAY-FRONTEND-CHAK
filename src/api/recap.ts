import { apiFetch } from '@/api/client'

export type RecapGame = 'GUESS_GOD' | 'SNEAKY_PHONE' | 'DESK_BLAST'

/** 나의 수능 리캡. 숫자만 온다(이름·편지 내용 없음). 날짜는 한국 날짜 "YYYY-MM-DD". */
export type Recap = {
  member: boolean
  firstDay: string | null
  /** 내 책상이 없으면 null. */
  received: {
    letters: number
    stickers: number
    senders: number
    firstDay: string | null
    peakDay: string | null
    peakCount: number
  } | null
  sent: { letters: number; desks: number }
  games: { game: RecapGame; plays: number; best: number | null; topPercent: number | null }[]
  studyType: string | null
}

export const fetchRecap = () => apiFetch<Recap>('/api/public/recap')
