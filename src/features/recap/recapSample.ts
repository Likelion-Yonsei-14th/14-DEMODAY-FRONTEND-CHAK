import type { Recap } from '@/api/recap'

/** 디자인 확인용 예시(`/recap?preview=1&sample=full|empty`). 실제 사람의 기록이 아니다. */
export const SAMPLE_RECAPS: Record<'full' | 'empty', Recap> = {
  full: {
    member: true,
    firstDay: '2026-09-02',
    received: { letters: 27, stickers: 9, senders: 14, firstDay: '2026-09-03', peakDay: '2026-11-18', peakCount: 11 },
    sent: { letters: 6, desks: 4 },
    games: [
      { game: 'DESK_BLAST', plays: 42, best: 18450, topPercent: 12 },
      { game: 'GUESS_GOD', plays: 9, best: 7, topPercent: 64 },
    ],
    studyType: 'PSA',
  },
  empty: {
    member: true,
    firstDay: '2026-11-17',
    received: { letters: 0, stickers: 0, senders: 0, firstDay: null, peakDay: null, peakCount: 0 },
    sent: { letters: 0, desks: 0 },
    games: [],
    studyType: null,
  },
}
