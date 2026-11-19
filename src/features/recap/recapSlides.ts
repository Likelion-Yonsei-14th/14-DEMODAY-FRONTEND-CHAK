import type { Recap, RecapGame } from '@/api/recap'
import { isStudyTypeCode, STUDY_TYPE_RESULTS, type StudyTypeCode } from '@/features/minigame/studyType/studyTypeResults'

export const GAME_TITLES: Record<RecapGame, string> = {
  GUESS_GOD: '오늘의 찍신은 나야!',
  SNEAKY_PHONE: '선생님 몰래 폰 하기',
  DESK_BLAST: '수능 블라스트',
}

/** 슬라이드마다 배경 색. recap.css의 .recap-slide--{tone}. */
export type Tone = 'brand' | 'ink' | 'butter' | 'sage' | 'sky' | 'lilac' | 'pink' | 'paper'

export type Slide =
  | { kind: 'intro'; tone: Tone; days: number | null }
  | { kind: 'cheer'; tone: Tone; text: string; sub?: string }
  | { kind: 'received'; tone: Tone; letters: number; senders: number; stickers: number; peak: { day: string; count: number } | null }
  | { kind: 'sent'; tone: Tone; letters: number; desks: number }
  | { kind: 'games'; tone: Tone; top: { title: string; plays: number; best: number | null; topPercent: number | null }; others: { title: string; plays: number }[] }
  | { kind: 'studyType'; tone: Tone; code: StudyTypeCode; name: string; tagline: string }
  | { kind: 'letter'; tone: Tone }
  | { kind: 'summary'; tone: Tone; lines: { label: string; value: string }[] }
  | { kind: 'outro'; tone: Tone }

/** 응원이 가장 많이 온 날은 받은 응원이 이만큼 이상이고 그날이 PEAK_DAY_MIN 이상일 때만 보여 준다. */
export const PEAK_TOTAL_MIN = 10
export const PEAK_DAY_MIN = 3
/** 미니게임 순위는 상위 이 % 안일 때만 말한다. */
export const TOP_PERCENT_MAX = 30

const DAY_MS = 24 * 60 * 60 * 1000

/** firstDay(한국 날짜)부터 today까지 며칠째인지(첫날이 1일). */
export function daysSince(firstDay: string | null, today: string) {
  if (!firstDay) return null
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${firstDay}T00:00:00Z`)) / DAY_MS)
  return diff >= 0 ? diff + 1 : null
}

export const monthDay = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`

/**
 * 리캡 카드 순서. 없거나 적은 기록은 아예 빼서, 기록이 거의 없는 사람도 부끄럽지 않게 한다.
 * 누구나 보는 카드: 인트로, 마지막 응원 멘트, 착 팀 편지, 요약, 마무리.
 */
export function buildSlides(recap: Recap | null, today: string): Slide[] {
  const days = daysSince(recap?.firstDay ?? null, today)
  const received = recap?.received
  const hasReceived = Boolean(received && received.letters > 0 && received.senders > 0)
  const sent = recap?.sent ?? { letters: 0, desks: 0 }
  const games = [...(recap?.games ?? [])].filter((g) => g.plays > 0).sort((a, b) => b.plays - a.plays)
  const studyCode = recap?.studyType && isStudyTypeCode(recap.studyType) ? recap.studyType : null

  const slides: Slide[] = [{ kind: 'intro', tone: 'brand', days }]

  if (hasReceived || sent.letters > 0) {
    slides.push({ kind: 'cheer', tone: 'ink', text: '그동안 이런 마음들이\n당신 곁에 있었어요' })
  }
  if (hasReceived && received) {
    const total = received.letters + received.stickers
    const showPeak = Boolean(received.peakDay) && total >= PEAK_TOTAL_MIN && received.peakCount >= PEAK_DAY_MIN
    slides.push({
      kind: 'received',
      tone: 'butter',
      letters: received.letters,
      senders: received.senders,
      stickers: received.stickers,
      peak: showPeak ? { day: received.peakDay!, count: received.peakCount } : null,
    })
  }
  if (sent.letters > 0) {
    slides.push({ kind: 'sent', tone: 'sage', letters: sent.letters, desks: Math.max(1, sent.desks) })
  }

  const [top, ...rest] = games
  if (top) {
    slides.push({ kind: 'cheer', tone: 'ink', text: '쉬는 시간도\n꽤 열심이었네요 :)', sub: '숨 돌릴 틈도 소중했으니까요' })
    slides.push({
      kind: 'games',
      tone: 'butter',
      top: {
        title: GAME_TITLES[top.game],
        plays: top.plays,
        best: top.best,
        topPercent: top.topPercent !== null && top.topPercent <= TOP_PERCENT_MAX ? top.topPercent : null,
      },
      others: rest.map((g) => ({ title: GAME_TITLES[g.game], plays: g.plays })),
    })
  }

  if (studyCode) {
    const result = STUDY_TYPE_RESULTS[studyCode]
    slides.push({ kind: 'studyType', tone: 'sage', code: studyCode, name: result.typeName, tagline: result.tagline })
  }

  slides.push({
    kind: 'cheer',
    tone: 'ink',
    text: '결과가 어떻든,\n오늘까지 버텨 온 시간은\n그대로 남아요',
    sub: '그 시간이 당신을 더 단단하게 만들었을 거예요',
  })
  slides.push({ kind: 'letter', tone: 'butter' })

  const lines: { label: string; value: string }[] = []
  if (days) lines.push({ label: '착과 함께한 날', value: `${days}일` })
  if (hasReceived && received) lines.push({ label: '받은 응원', value: `${received.letters + received.stickers}개` })
  if (sent.letters > 0) lines.push({ label: '보낸 응원', value: `${sent.letters}통` })
  const plays = games.reduce((sum, g) => sum + g.plays, 0)
  if (plays > 0) lines.push({ label: '미니게임', value: `${plays}판` })
  if (studyCode) lines.push({ label: '공부 유형', value: STUDY_TYPE_RESULTS[studyCode].typeName })
  slides.push({ kind: 'summary', tone: 'brand', lines })

  slides.push({ kind: 'outro', tone: 'butter' })
  return slides
}
