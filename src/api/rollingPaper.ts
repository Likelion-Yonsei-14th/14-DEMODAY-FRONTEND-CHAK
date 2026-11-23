import { apiFetch } from '@/api/client'
import type {
  RollingPaperBoardEntry,
  RollingPaperClass,
  RollingPaperKind,
  RollingPaperMember,
  RollingPaperNote,
  RollingPaperRevealMode,
} from '@/types'

/**
 * Year-end rolling paper on the backend (docs/API.md §13). Everything is under
 * /api/public/rolling-papers; members are signed-in users or guests (cookie).
 * A class is found by the invite code, which is also the class id on the page.
 */
const BASE = '/api/public/rolling-papers'

type ApiRevealMode = 'INSTANT' | 'ON_END'
type ApiKind = 'CLASS' | 'PERSONAL'

export type ApiRollingMember = {
  id: number
  displayName: string
  paperDesign: string
  creator: boolean
  writtenByMe: boolean
}

export type ApiRollingClassView = {
  code: string
  kind?: ApiKind
  name: string
  revealMode: ApiRevealMode
  endedAt: string | null
  memberCount: number
  me: { memberId: number; displayName: string; paperDesign: string; creator: boolean } | null
  members: ApiRollingMember[]
  board: { id: number; text: string; authorName: string; mine: boolean; createdAt: string }[]
  myPaper: { open: boolean; noteCount: number } | null
}

export type ApiRollingPaperView = {
  member: ApiRollingMember
  sealed: boolean
  noteCount: number
  notes: {
    id: number
    /** Null for a hidden note. */
    authorMemberId: number | null
    authorName: string
    /** Null for a hidden note. */
    text: string | null
    pen: string
    stamp: string
    x: number
    y: number
    mine: boolean
    /** Personal paper, not the owner: someone else's note, sent without text or name. */
    hidden?: boolean
    createdAt: string
  }[]
}

export type ApiMyRollingClass = {
  code: string
  kind?: ApiKind
  name: string
  endedAt: string | null
  creator: boolean
}

const toApiMode = (mode: RollingPaperRevealMode): ApiRevealMode =>
  mode === 'instant' ? 'INSTANT' : 'ON_END'

const fromApiMode = (mode: ApiRevealMode): RollingPaperRevealMode =>
  mode === 'INSTANT' ? 'instant' : 'onEnd'

const fromApiKind = (kind?: ApiKind): RollingPaperKind =>
  kind === 'PERSONAL' ? 'personal' : 'class'

const path = (code: string) => `${BASE}/${encodeURIComponent(code)}`

/** The class as the pages know it. Notes are filled in per paper by {@link mergePaperView}. */
export function toRollingPaperClass(
  view: ApiRollingClassView,
  previous?: RollingPaperClass,
): { paperClass: RollingPaperClass; member: RollingPaperMember | null } {
  const myId = view.me ? String(view.me.memberId) : null
  const board: RollingPaperBoardEntry[] = view.board.map((entry) => ({
    id: String(entry.id),
    // The server only says whether a line is mine; other authors are shown by name.
    authorLockerId: entry.mine && myId ? myId : '',
    authorName: entry.authorName,
    text: entry.text,
    createdAt: entry.createdAt,
  }))
  // Keep the notes already loaded for this class's papers.
  const notes = previous && previous.id === view.code ? previous.notes : []

  return {
    paperClass: {
      id: view.code,
      kind: fromApiKind(view.kind),
      name: view.name,
      revealMode: fromApiMode(view.revealMode),
      endedAt: view.endedAt ?? undefined,
      boardEntries: board,
      lockers: view.members.map((member) => ({
        id: String(member.id),
        studentName: member.displayName,
        paperDesign: member.paperDesign,
        writtenByMe: member.writtenByMe,
      })),
      notes,
      memberCount: view.memberCount,
      myPaperNoteCount: view.myPaper?.noteCount,
    },
    member: view.me && myId ? { lockerId: myId, displayName: view.me.displayName } : null,
  }
}

/** Puts one paper's notes (and whether I wrote on it) into the class. */
export function mergePaperView(
  paperClass: RollingPaperClass,
  view: ApiRollingPaperView,
): RollingPaperClass {
  const paperLockerId = String(view.member.id)
  const notes: RollingPaperNote[] = view.notes.map((note) => ({
    id: String(note.id),
    paperLockerId,
    authorLockerId: note.authorMemberId == null ? '' : String(note.authorMemberId),
    authorName: note.authorName,
    text: note.text ?? '',
    hidden: note.hidden || undefined,
    pen: note.pen,
    stamp: note.stamp,
    x: Number(note.x),
    y: Number(note.y),
    createdAt: note.createdAt,
  }))
  return {
    ...paperClass,
    lockers: paperClass.lockers.map((locker) =>
      locker.id === paperLockerId
        ? {
            ...locker,
            studentName: view.member.displayName,
            paperDesign: view.member.paperDesign,
            writtenByMe: view.member.writtenByMe,
          }
        : locker,
    ),
    notes: [
      ...paperClass.notes.filter((note) => note.paperLockerId !== paperLockerId),
      ...notes,
    ],
  }
}

export const fetchRollingPaperClass = (code: string) =>
  apiFetch<ApiRollingClassView>(path(code))

export const fetchMyRollingPaperClasses = () =>
  apiFetch<ApiMyRollingClass[]>(`${BASE}/mine`)

export const createRollingPaperClassApi = (input: {
  name: string
  displayName: string
  paperDesign: string
  revealMode: RollingPaperRevealMode
  kind?: RollingPaperKind
}) =>
  apiFetch<ApiRollingClassView>(BASE, {
    method: 'POST',
    body: {
      ...input,
      revealMode: toApiMode(input.revealMode),
      kind: input.kind === 'personal' ? 'PERSONAL' : 'CLASS',
    },
  })

/** A personal paper's writers send no design (they hang no paper). */
export const joinRollingPaperClassApi = (
  code: string,
  input: { displayName: string; paperDesign?: string },
) => apiFetch<ApiRollingClassView>(`${path(code)}/members`, { method: 'POST', body: input })

export const updateRollingPaperClassApi = (
  code: string,
  patch: { name?: string; revealMode?: RollingPaperRevealMode },
) =>
  apiFetch<ApiRollingClassView>(path(code), {
    method: 'PATCH',
    body: {
      name: patch.name,
      revealMode: patch.revealMode ? toApiMode(patch.revealMode) : undefined,
    },
  })

export const updateMyRollingPaperApi = (
  code: string,
  patch: { displayName?: string; paperDesign?: string },
) => apiFetch<ApiRollingClassView>(`${path(code)}/members/me`, { method: 'PATCH', body: patch })

export const endRollingPaperClassApi = (code: string) =>
  apiFetch<ApiRollingClassView>(`${path(code)}/end`, { method: 'POST' })

export const deleteRollingPaperClassApi = (code: string) =>
  apiFetch<{ message: string }>(path(code), { method: 'DELETE' })

export const fetchRollingPaper = (code: string, memberId: string) =>
  apiFetch<ApiRollingPaperView>(`${path(code)}/papers/${encodeURIComponent(memberId)}`)

export const writeRollingPaperNoteApi = (
  code: string,
  memberId: string,
  note: { text: string; pen: string; stamp: string; x: number; y: number },
) =>
  apiFetch<ApiRollingPaperView>(`${path(code)}/papers/${encodeURIComponent(memberId)}/note`, {
    method: 'PUT',
    body: { ...note, x: Math.round(note.x * 100) / 100, y: Math.round(note.y * 100) / 100 },
  })

export const deleteRollingPaperNoteApi = (code: string, memberId: string) =>
  apiFetch<ApiRollingPaperView>(`${path(code)}/papers/${encodeURIComponent(memberId)}/note`, {
    method: 'DELETE',
  })

export const addRollingPaperBoardEntryApi = (code: string, text: string) =>
  apiFetch<ApiRollingClassView>(`${path(code)}/board`, { method: 'POST', body: { text } })

export const removeRollingPaperBoardEntryApi = (code: string, entryId: string) =>
  apiFetch<ApiRollingClassView>(`${path(code)}/board/${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
  })
