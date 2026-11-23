import {
  composerBackgrounds,
  getComposerBackground,
  getTextBounds,
} from '@/features/composer/backgroundAssets'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import type {
  RollingPaperClass,
  RollingPaperNote,
  RollingPaperRevealMode,
} from '@/types'

export const ROLLING_PAPER_NOTE_MAX = 60

export const rollingPaperPens = [
  { id: 'ink', label: '검정 펜', value: '#2b2a33' },
  { id: 'red', label: '빨강 펜', value: '#d93a1f' },
  { id: 'blue', label: '파랑 펜', value: '#2f5fd0' },
  { id: 'green', label: '초록 펜', value: '#1d8f6f' },
  { id: 'purple', label: '보라 펜', value: '#7b4fe0' },
  { id: 'pink', label: '분홍 펜', value: '#e0468a' },
] as const

/** Small doodles drawn next to the signature, as a pen would. */
export const rollingPaperStamps = [
  { id: 'none', label: '없음', glyph: '' },
  { id: 'heart', label: '하트', glyph: '♥' },
  { id: 'star', label: '별', glyph: '★' },
  { id: 'flower', label: '꽃', glyph: '✿' },
  { id: 'smile', label: '웃음', glyph: '☺' },
  { id: 'cap', label: '학사모', glyph: '🎓' },
] as const

/** A note is 40% of the paper wide; its centre keeps half that from the writable edges. */
const NOTE_HALF_WIDTH = 20
const NOTE_HALF_HEIGHT = 7

export const DEFAULT_PAPER_DESIGN = 'bg-basic-cream'

/** Letter backgrounds a paper can use: the same 편지지 and 기본 sets as the letter composer. */
export const paperDesigns = composerBackgrounds.filter(
  (background) => background.group === 'stationery' || background.group === 'basic',
)

export const getPaperDesign = (designId?: string) =>
  getComposerBackground(designId ?? DEFAULT_PAPER_DESIGN)

/** Keeps a touched spot inside the design's writable area (never over a stationery border). */
export const clampNotePosition = (x: number, y: number, designId?: string) => {
  const bounds = getTextBounds(getPaperDesign(designId))
  const clamp = (value: number, min: number, max: number) =>
    min > max ? (min + max) / 2 : Math.min(max, Math.max(min, value))
  return {
    x: clamp(x, bounds.left + NOTE_HALF_WIDTH, bounds.right - NOTE_HALF_WIDTH),
    y: clamp(y, bounds.top + NOTE_HALF_HEIGHT, bounds.bottom - NOTE_HALF_HEIGHT),
  }
}

/** The first locker is the creator's; only they manage the class and write on the board. */
export const isRollingPaperCreator = (
  paperClass: Pick<RollingPaperClass, 'lockers'>,
  lockerId: string,
) => paperClass.lockers[0]?.id === lockerId

export const getPenColor = (pen: string) =>
  rollingPaperPens.find((item) => item.id === pen)?.value ??
  rollingPaperPens[0].value

export const getStampGlyph = (stamp: string) =>
  rollingPaperStamps.find((item) => item.id === stamp)?.glyph ?? ''

export const notesOnPaper = (paperClass: RollingPaperClass, paperLockerId: string) =>
  paperClass.notes.filter((note) => note.paperLockerId === paperLockerId)

export const findMyNote = (
  paperClass: RollingPaperClass,
  paperLockerId: string,
  authorLockerId: string,
): RollingPaperNote | undefined =>
  paperClass.notes.find(
    (note) =>
      note.paperLockerId === paperLockerId &&
      note.authorLockerId === authorLockerId,
  )

/** Whether I wrote on this paper. The server says so even when that paper's notes are not loaded. */
export const hasWrittenOn = (
  paperClass: RollingPaperClass,
  paperLockerId: string,
  myLockerId: string,
) =>
  paperClass.lockers.find((locker) => locker.id === paperLockerId)?.writtenByMe ??
  Boolean(findMyNote(paperClass, paperLockerId, myLockerId))

/** How many friends wrote on my paper; the server sends the count while the notes stay hidden. */
export const countNotesOnMyPaper = (paperClass: RollingPaperClass, myLockerId: string) =>
  paperClass.myPaperNoteCount ?? notesOnPaper(paperClass, myLockerId).length

/** The writer's current name, so a renamed classmate signs with the new one. */
export const noteAuthorName = (
  paperClass: RollingPaperClass,
  note: RollingPaperNote,
) =>
  paperClass.lockers.find((locker) => locker.id === note.authorLockerId)
    ?.studentName ?? note.authorName

export const revealModeOptions = [
  {
    id: 'instant',
    title: '바로바로 보기',
    description: '친구가 쓰는 대로 내 롤링페이퍼를 바로 볼 수 있어요.',
  },
  {
    id: 'onEnd',
    title: '종료하면 보기',
    description: '만든 사람이 롤링페이퍼를 종료하면 한꺼번에 열려요.',
  },
] as const satisfies ReadonlyArray<{ id: RollingPaperRevealMode; title: string; description: string }>

export const getRevealMode = (paperClass: Pick<RollingPaperClass, 'revealMode'>) =>
  paperClass.revealMode ?? 'onEnd'

/** Owners read their own paper right away, or once the creator ends the rolling paper. */
export const isOwnPaperOpen = (
  paperClass: Pick<RollingPaperClass, 'revealMode' | 'endedAt'>,
) => getRevealMode(paperClass) === 'instant' || Boolean(paperClass.endedAt)

/** One line telling the owner when they get to read their own paper. */
export const describeOwnPaperReveal = (
  paperClass: Pick<RollingPaperClass, 'revealMode' | 'endedAt' | 'kind'>,
) => {
  if (paperClass.endedAt) return '롤링페이퍼가 종료돼서 내 롤링페이퍼가 열렸어요.'
  if (getRevealMode(paperClass) === 'instant') return '친구들이 쓰는 대로 내 롤링페이퍼를 바로 볼 수 있어요.'
  if (isPersonalPaper(paperClass)) {
    return '설정에서 롤링페이퍼를 종료하면 내 롤링페이퍼가 열려요.'
  }
  return '반을 만든 사람이 롤링페이퍼를 종료하면 내 롤링페이퍼가 열려요.'
}

/** A personal paper: one paper (the creator's), others only write on it. */
export const isPersonalPaper = (paperClass: Pick<RollingPaperClass, 'kind'>) =>
  paperClass.kind === 'personal'

/** Under "To. 이름" on every paper. */
export const PAPER_GREETING = '올 한 해 고마웠어!'

/** After the creator ends it, nobody writes any more. */
export const isRollingPaperEnded = (paperClass: Pick<RollingPaperClass, 'endedAt'>) =>
  Boolean(paperClass.endedAt)

/** After the exam, the rolling paper takes the desk's place as the main thing to do. */
export const isRollingPaperSeason = (now = new Date()) =>
  getCsatDdayLabel(now) === '수능이 끝났어요'

/** Stable little tilt per note so the paper looks hand-filled. */
export const noteTilt = (id: string) => {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return ((hash & 0xff) / 255) * 8 - 4
}
