/**
 * Year-end rolling paper, by class or personal. It borrows the class template (classroom scene,
 * one locker per member) but is its own content, separate from `Classroom`.
 */

export type RollingPaperLocker = {
  id: string
  studentName: string
  /** The owner's paper design: a letter background id (편지지 or 기본). Older data has none → cream. */
  paperDesign?: string
  /** From the server: whether I wrote on this paper (its notes may not be loaded). */
  writtenByMe?: boolean
}

/** One classmate's line on another classmate's paper. */
export type RollingPaperNote = {
  id: string
  /** Whose paper the note is written on. */
  paperLockerId: string
  /** The writer's locker; one note per writer per paper. */
  authorLockerId: string
  authorName: string
  text: string
  pen: string
  stamp: string
  /** Where the writer touched the paper, in % of the paper (centre of the note). */
  x: number
  y: number
  createdAt: string
  /**
   * Personal paper, seen by someone other than its owner: another writer's
   * note. Only its spot comes from the server (no text, no name); it is drawn blurred.
   */
  hidden?: boolean
}

/** One line a member chalked on the classroom board. */
export type RollingPaperBoardEntry = {
  id: string
  authorLockerId: string
  authorName: string
  text: string
  createdAt: string
}

/**
 * When owners may read their own paper: right away, or only once the creator
 * ends the rolling paper.
 */
export type RollingPaperRevealMode = 'instant' | 'onEnd'

/**
 * 'class': everyone hangs their own paper in the classroom and writes on each other's.
 * 'personal': one paper (the creator's); people from the link only write on it.
 */
export type RollingPaperKind = 'class' | 'personal'

export type RollingPaperClass = {
  id: string
  /** Older data has none → 'class'. */
  kind?: RollingPaperKind
  name: string
  /** Older data has none → 'onEnd'. */
  revealMode?: RollingPaperRevealMode
  /** Set when the creator ends the rolling paper: writing stops and every paper opens. */
  endedAt?: string
  /** Lines anyone in the class chalked on the board. Older data has none. */
  boardEntries?: RollingPaperBoardEntry[]
  lockers: RollingPaperLocker[]
  notes: RollingPaperNote[]
  /** From the server: everyone in the class, shown to visitors who have not joined yet. */
  memberCount?: number
  /** From the server: how many friends wrote on my paper (its notes stay hidden until it opens). */
  myPaperNoteCount?: number
}

export type RollingPaperMember = {
  lockerId: string
  displayName: string
}
