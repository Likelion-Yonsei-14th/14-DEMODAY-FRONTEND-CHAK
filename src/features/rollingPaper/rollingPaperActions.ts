import { isApiEnabled } from '@/api/config'
import {
  addRollingPaperBoardEntryApi,
  createRollingPaperClassApi,
  deleteRollingPaperClassApi,
  deleteRollingPaperNoteApi,
  endRollingPaperClassApi,
  fetchMyRollingPaperClasses,
  fetchRollingPaper,
  fetchRollingPaperClass,
  joinRollingPaperClassApi,
  mergePaperView,
  removeRollingPaperBoardEntryApi,
  toRollingPaperClass,
  updateMyRollingPaperApi,
  updateRollingPaperClassApi,
  writeRollingPaperNoteApi,
  type ApiRollingClassView,
  type ApiRollingPaperView,
} from '@/api/rollingPaper'
import { mockRollingPaperClass } from '@/prototype/mock/initialState'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { RollingPaperNote, RollingPaperRevealMode } from '@/types'

/**
 * What the rolling paper pages call. With a backend every change goes to the
 * server and the store holds what it answered; without one (prototype) the
 * store's own actions run in the browser.
 */

const store = () => usePrototypeStore.getState()

function applyClass(view: ApiRollingClassView) {
  const { paperClass, member } = toRollingPaperClass(view, store().rollingPaperClass)
  usePrototypeStore.setState({ rollingPaperClass: paperClass, rollingPaperMember: member })
}

function applyPaper(view: ApiRollingPaperView) {
  usePrototypeStore.setState((state) => ({
    rollingPaperClass: mergePaperView(state.rollingPaperClass, view),
  }))
}

/** Loads a class into the store. Visitors who have not joined get its name only. */
export async function loadRollingPaperClass(code: string) {
  if (!isApiEnabled) return
  applyClass(await fetchRollingPaperClass(code))
}

/** Loads one paper's notes (none for my own paper while it is sealed). */
export async function loadRollingPaper(code: string, lockerId: string) {
  if (!isApiEnabled) return
  applyPaper(await fetchRollingPaper(code, lockerId))
}

/** The class to continue in, or null when I am in none. */
export async function findMyRollingPaperClass(): Promise<string | null> {
  if (!isApiEnabled) {
    const { rollingPaperClass, rollingPaperMember } = store()
    return rollingPaperMember ? rollingPaperClass.id : null
  }
  const mine = await fetchMyRollingPaperClasses()
  return mine[0]?.code ?? null
}

/** Returns the new class's code. */
export async function createRollingPaperClass(input: {
  name: string
  displayName: string
  paperDesign: string
  revealMode: RollingPaperRevealMode
}) {
  if (!isApiEnabled) return store().createRollingPaperClass(input)
  const view = await createRollingPaperClassApi(input)
  applyClass(view)
  return view.code
}

export async function joinRollingPaperClass(
  code: string,
  displayName: string,
  paperDesign: string,
) {
  if (!isApiEnabled) {
    store().joinRollingPaperClass(displayName, paperDesign)
    return
  }
  applyClass(await joinRollingPaperClassApi(code, { displayName, paperDesign }))
}

export async function updateRollingPaperClass(
  code: string,
  patch: { name?: string; revealMode?: RollingPaperRevealMode },
) {
  if (!isApiEnabled) {
    store().updateRollingPaperClass(patch)
    return
  }
  applyClass(await updateRollingPaperClassApi(code, patch))
}

export async function updateMyRollingPaper(
  code: string,
  patch: { displayName?: string; paperDesign?: string },
) {
  if (!isApiEnabled) {
    store().updateRollingPaperMember(patch)
    return
  }
  applyClass(await updateMyRollingPaperApi(code, patch))
}

export async function endRollingPaperClass(code: string) {
  if (!isApiEnabled) {
    store().endRollingPaperClass()
    return
  }
  applyClass(await endRollingPaperClassApi(code))
}

export async function deleteRollingPaperClass(code: string) {
  if (!isApiEnabled) {
    store().deleteRollingPaperClass()
    return
  }
  await deleteRollingPaperClassApi(code)
  usePrototypeStore.setState({
    rollingPaperClass: { ...mockRollingPaperClass, id: '', lockers: [], notes: [] },
    rollingPaperMember: null,
  })
}

export async function saveRollingPaperNote(
  code: string,
  paperLockerId: string,
  note: Pick<RollingPaperNote, 'text' | 'pen' | 'stamp' | 'x' | 'y'>,
) {
  if (!isApiEnabled) {
    store().saveRollingPaperNote(paperLockerId, note)
    return
  }
  applyPaper(await writeRollingPaperNoteApi(code, paperLockerId, { ...note, text: note.text.trim() }))
}

export async function removeRollingPaperNote(code: string, paperLockerId: string) {
  if (!isApiEnabled) {
    store().removeRollingPaperNote(paperLockerId)
    return
  }
  applyPaper(await deleteRollingPaperNoteApi(code, paperLockerId))
}

export async function addRollingPaperBoardEntry(code: string, text: string) {
  if (!isApiEnabled) {
    store().addRollingPaperBoardEntry(text)
    return
  }
  applyClass(await addRollingPaperBoardEntryApi(code, text.trim()))
}

export async function removeRollingPaperBoardEntry(code: string, entryId: string) {
  if (!isApiEnabled) {
    store().removeRollingPaperBoardEntry(entryId)
    return
  }
  applyClass(await removeRollingPaperBoardEntryApi(code, entryId))
}

/** A message for the toast when a server call fails. */
export function rollingPaperErrorMessage(error: unknown) {
  if (error instanceof Error && error.name === 'ApiError' && error.message) {
    return error.message
  }
  return '연결이 불안정해요. 잠시 후 다시 시도해 주세요.'
}
