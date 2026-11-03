/**
 * Every line of text 수능 블라스트 shows is here, so it can be swapped without
 * touching the game: combo phrases, student types, and their one-liners.
 */

/** The phrase for a combo is the one with the highest `from` not above it. */
export const COMBO_PHRASES: readonly { from: number; text: string }[] = [
  { from: 2, text: '정리 좀 치는데?' },
  { from: 3, text: '공부는 언제 함' },
  { from: 5, text: '책상만 전교 1등' },
  { from: 8, text: '수험생의 본업' },
  { from: 10, text: '정리하다 수능 끝남' },
]

export function comboPhrase(combo: number): string | null {
  let found: string | null = null
  for (const phrase of COMBO_PHRASES) {
    if (combo >= phrase.from) found = phrase.text
  }
  return found
}

/** Shown when the desk ends up completely empty. */
export const ALL_CLEAR_PHRASE = '책상이 텅 비었어요'

export type DeskType = {
  id: string
  /** The lowest score of this type; types are listed from the lowest. */
  from: number
  name: string
  lines: readonly string[]
}

export const DESK_TYPES: readonly DeskType[] = [
  {
    id: 'neglected',
    from: 0,
    name: '책상 방치형',
    lines: ['책상은 깨끗한데 문제집은 새 책임.', '펜 잡기 전에 이미 지친 타입.', '일단 앉기는 했다는 데 의미가 있음.'],
  },
  {
    id: 'avoider',
    from: 4000,
    name: '정리하는 척 공부 회피형',
    lines: ['공부 10분 전에 책상 정리 2시간 하는 타입.', '정리가 끝나면 시작한다고 했지만 끝은 없음.', '필통 정리까지 하면 오늘 공부 끝.'],
  },
  {
    id: 'veteran',
    from: 10000,
    name: '책상정리 고인물',
    lines: ['이 정도면 정리학과 수석.', '블록 놓는 손이 이미 문제 푸는 손보다 빠름.', '정리 경력 N년, 풀이 경력은 비밀.'],
  },
  {
    id: 'top',
    from: 20000,
    name: '책상만 전교 1등',
    lines: ['모의고사는 몰라도 책상은 전교 1등.', '책상 위엔 먼지 한 톨도 없음. 문제집엔 손때도 없음.', '정리 실력은 이미 서울대.'],
  },
  {
    id: 'born',
    from: 30000,
    name: '공부보다 정리가 체질',
    lines: ['공부보다 정리가 체질. 인정해야 함.', '수능 날 책상 정리 시험이었으면 만점.', '이제 진짜 공부하러 가도 됩니다. 아마도.'],
  },
]

export function deskTypeOf(score: number): DeskType {
  let found = DESK_TYPES[0]!
  for (const type of DESK_TYPES) {
    if (score >= type.from) found = type
  }
  return found
}

/** One line for a type, picked by `seed` (the score), so the same result always reads the same. */
export function deskTypeLine(type: DeskType, seed: number): string {
  return type.lines[Math.abs(Math.trunc(seed)) % type.lines.length]!
}

/**
 * Things lying on the desk behind the board. They go away one by one as the
 * score climbs, purely for looks: `clearAt` is the score that removes each.
 */
export const DESK_CLUTTER: readonly { id: string; label: string; clearAt: number }[] = [
  { id: 'coffee', label: '커피', clearAt: 1200 },
  { id: 'sticky', label: '포스트잇', clearAt: 3000 },
  { id: 'eraser', label: '지우개', clearAt: 5000 },
  { id: 'timer', label: '타이머', clearAt: 7000 },
  { id: 'highlighter', label: '형광펜', clearAt: 9600 },
  { id: 'chocolate', label: '초콜릿', clearAt: 13000 },
  { id: 'pen', label: '샤프', clearAt: 17000 },
  { id: 'memo', label: '메모지', clearAt: 22000 },
  { id: 'ticket', label: '수험표', clearAt: 25000 },
  { id: 'workbook', label: '문제집', clearAt: 30000 },
]
