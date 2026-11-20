import { beforeEach, describe, expect, it } from 'vitest'
import { mockRollingPaperClass } from '@/prototype/mock/initialState'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  clampNotePosition,
  findMyNote,
  isOwnPaperOpen,
  notesOnPaper,
} from './rollingPaper'

const note = (text: string, x = 30, y = 20) => ({
  text,
  pen: 'ink',
  stamp: 'none',
  x,
  y,
})

const paperClass = () => usePrototypeStore.getState().rollingPaperClass

describe('graduation rolling paper', () => {
  beforeEach(() => {
    usePrototypeStore.setState({
      rollingPaperClass: {
        ...mockRollingPaperClass,
        lockers: [...mockRollingPaperClass.lockers],
        notes: [...mockRollingPaperClass.notes],
      },
      rollingPaperMember: null,
    })
  })

  it('creates a class with the creator’s own paper already hung', () => {
    const classId = usePrototypeStore.getState().createRollingPaperClass({
      name: ' 3학년 5반 ',
      displayName: '지수',
      paperDesign: 'bg-stationery-note-pink',
      revealMode: 'instant',
    })

    const state = usePrototypeStore.getState()
    expect(state.rollingPaperClass).toMatchObject({
      id: classId,
      name: '3학년 5반',
      revealMode: 'instant',
      notes: [],
    })
    expect(state.rollingPaperClass.lockers).toEqual([
      {
        id: state.rollingPaperMember?.lockerId,
        studentName: '지수',
        paperDesign: 'bg-stationery-note-pink',
      },
    ])
  })

  it('gives a friend from the link their own paper', () => {
    const lockerId = usePrototypeStore.getState().joinRollingPaperClass('도윤', 'bg-basic-cream')

    expect(paperClass().lockers.at(-1)).toEqual({
      id: lockerId,
      studentName: '도윤',
      paperDesign: 'bg-basic-cream',
    })
    expect(usePrototypeStore.getState().rollingPaperMember).toEqual({
      lockerId,
      displayName: '도윤',
    })
  })

  it('keeps one note per writer per paper, and moves it to the new spot', () => {
    const store = usePrototypeStore.getState()
    const myLockerId = store.joinRollingPaperClass('도윤', 'bg-basic-cream')

    store.saveRollingPaperNote('rolling-locker-minji', note('  졸업 축하해!  ', 25, 15))
    const first = findMyNote(paperClass(), 'rolling-locker-minji', myLockerId)
    expect(first).toMatchObject({ text: '졸업 축하해!', x: 25, y: 15 })

    store.saveRollingPaperNote('rolling-locker-minji', note('고쳐 쓴 한마디', 70, 85))
    const mine = notesOnPaper(paperClass(), 'rolling-locker-minji').filter(
      (item) => item.authorLockerId === myLockerId,
    )
    expect(mine).toEqual([
      expect.objectContaining({ id: first?.id, text: '고쳐 쓴 한마디', x: 70, y: 85 }),
    ])
  })

  it('never writes on my own paper or saves an empty note', () => {
    const store = usePrototypeStore.getState()
    const myLockerId = store.joinRollingPaperClass('도윤', 'bg-basic-cream')
    const before = paperClass().notes.length

    store.saveRollingPaperNote(myLockerId, note('나에게'))
    store.saveRollingPaperNote('rolling-locker-minji', note('   '))

    expect(paperClass().notes).toHaveLength(before)
  })

  it('removes only my note', () => {
    const store = usePrototypeStore.getState()
    store.joinRollingPaperClass('도윤', 'bg-basic-cream')
    store.saveRollingPaperNote('rolling-locker-minji', note('안녕'))
    store.removeRollingPaperNote('rolling-locker-minji')

    expect(notesOnPaper(paperClass(), 'rolling-locker-minji')).toHaveLength(2)
  })

  it('opens owners’ papers right away, or only once the creator ends it', () => {
    expect(isOwnPaperOpen({ revealMode: 'instant' })).toBe(true)
    expect(isOwnPaperOpen({ revealMode: 'onEnd' })).toBe(false)
    expect(isOwnPaperOpen({})).toBe(false)
    expect(isOwnPaperOpen({ revealMode: 'onEnd', endedAt: '2027-01-08T00:00:00Z' })).toBe(true)
  })

  it('lets only the creator end the rolling paper, after which nobody writes', () => {
    const store = usePrototypeStore.getState()
    store.joinRollingPaperClass('도윤', 'bg-basic-cream')
    store.endRollingPaperClass()
    expect(paperClass().endedAt).toBeUndefined()

    usePrototypeStore.setState({
      rollingPaperMember: { lockerId: 'rolling-locker-minji', displayName: '민지' },
    })
    usePrototypeStore.getState().endRollingPaperClass()
    expect(paperClass().endedAt).toBeDefined()

    const before = paperClass().notes.length
    usePrototypeStore
      .getState()
      .saveRollingPaperNote('rolling-locker-hyunwoo', note('늦게 쓰는 글'))
    expect(paperClass().notes).toHaveLength(before)
  })

  it('lets only the creator delete the class', () => {
    usePrototypeStore.getState().createRollingPaperClass({
      name: '지울 반',
      displayName: '지수',
      paperDesign: 'bg-basic-cream',
      revealMode: 'onEnd',
    })
    const lockerId = usePrototypeStore.getState().joinRollingPaperClass('도윤', 'bg-basic-cream')
    usePrototypeStore.getState().deleteRollingPaperClass()
    expect(paperClass().name).toBe('지울 반')

    const creatorLockerId = paperClass().lockers[0]!.id
    expect(creatorLockerId).not.toBe(lockerId)
    usePrototypeStore.setState({
      rollingPaperMember: { lockerId: creatorLockerId, displayName: '지수' },
    })
    usePrototypeStore.getState().deleteRollingPaperClass()
    expect(usePrototypeStore.getState().rollingPaperMember).toBeNull()
    expect(paperClass().name).not.toBe('지울 반')
  })

  it('keeps a touched spot inside the design’s writable area', () => {
    // Plain paper: almost the whole sheet.
    expect(clampNotePosition(2, 99)).toEqual({ x: 22, y: 87 })
    expect(clampNotePosition(55, 40)).toEqual({ x: 55, y: 40 })
    // Stationery with a border keeps notes off it (pink note: left 10, bottom 8).
    expect(clampNotePosition(2, 99, 'bg-stationery-note-pink')).toEqual({ x: 30, y: 85 })
  })

  it('lets anyone chalk on the board but wipe only their own lines', () => {
    const store = usePrototypeStore.getState()
    store.joinRollingPaperClass('도윤', 'bg-basic-cream')
    store.addRollingPaperBoardEntry('  다들 졸업 축하해  ')
    store.addRollingPaperBoardEntry('   ')

    const entries = paperClass().boardEntries ?? []
    expect(entries).toHaveLength(3)
    expect(entries.at(-1)).toMatchObject({ text: '다들 졸업 축하해', authorName: '도윤' })

    store.removeRollingPaperBoardEntry('rolling-board-1')
    store.removeRollingPaperBoardEntry(entries.at(-1)!.id)
    expect(paperClass().boardEntries?.map((entry) => entry.id)).toEqual([
      'rolling-board-1',
      'rolling-board-2',
    ])
  })

  it('lets only the creator change the class, and anyone their own paper', () => {
    const store = usePrototypeStore.getState()
    store.joinRollingPaperClass('도윤', 'bg-basic-cream')
    store.updateRollingPaperClass({ name: '내 맘대로 반' })
    expect(paperClass().name).toBe(mockRollingPaperClass.name)

    store.updateRollingPaperMember({ displayName: '도윤이', paperDesign: 'bg-sky' })
    store.updateRollingPaperClass({ revealMode: 'instant' })
    expect(paperClass().revealMode).toBe('onEnd')
    expect(paperClass().lockers.at(-1)).toMatchObject({
      studentName: '도윤이',
      paperDesign: 'bg-sky',
    })

    usePrototypeStore.setState({
      rollingPaperMember: { lockerId: 'rolling-locker-minji', displayName: '민지' },
    })
    usePrototypeStore.getState().updateRollingPaperClass({ name: '  3학년 2반 졸업  ' })
    expect(paperClass().name).toBe('3학년 2반 졸업')
  })
})
