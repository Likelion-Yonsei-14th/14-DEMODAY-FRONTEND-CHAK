import { describe, expect, it } from 'vitest'
import {
  mergePaperView,
  toRollingPaperClass,
  type ApiRollingClassView,
  type ApiRollingPaperView,
} from './rollingPaper'

const classView: ApiRollingClassView = {
  code: 'abc123',
  name: '3학년 2반',
  revealMode: 'ON_END',
  endedAt: null,
  memberCount: 2,
  me: { memberId: 12, displayName: '현우', paperDesign: 'bg-basic-cream', creator: false },
  members: [
    { id: 11, displayName: '민지', paperDesign: 'bg-stationery-note-pink', creator: true, writtenByMe: true },
    { id: 12, displayName: '현우', paperDesign: 'bg-basic-cream', creator: false, writtenByMe: false },
  ],
  board: [
    { id: 5, text: '3년 동안 고생했다', authorName: '민지', mine: false, createdAt: '2026-11-20T14:00:00Z' },
    { id: 6, text: '졸업 축하해', authorName: '현우', mine: true, createdAt: '2026-11-20T14:01:00Z' },
  ],
  myPaper: { open: false, noteCount: 3 },
}

const paperView: ApiRollingPaperView = {
  member: { id: 11, displayName: '민지', paperDesign: 'bg-stationery-note-pink', creator: true, writtenByMe: true },
  sealed: false,
  noteCount: 1,
  notes: [
    {
      id: 7,
      authorMemberId: 12,
      authorName: '현우',
      text: '졸업 축하해!',
      pen: 'blue',
      stamp: 'heart',
      x: 30.5,
      y: 20,
      mine: true,
      createdAt: '2026-11-20T14:05:00Z',
    },
  ],
}

describe('rolling paper server mapping', () => {
  it('turns the class view into the class the pages use', () => {
    const { paperClass, member } = toRollingPaperClass(classView)

    expect(member).toEqual({ lockerId: '12', displayName: '현우' })
    expect(paperClass).toMatchObject({
      id: 'abc123',
      revealMode: 'onEnd',
      endedAt: undefined,
      myPaperNoteCount: 3,
      memberCount: 2,
    })
    // The creator comes first, so the first locker is the creator's.
    expect(paperClass.lockers[0]).toEqual({
      id: '11',
      studentName: '민지',
      paperDesign: 'bg-stationery-note-pink',
      writtenByMe: true,
    })
    // My board line keeps my locker id so I can wipe it; others are shown by name.
    expect(paperClass.boardEntries?.map((entry) => entry.authorLockerId)).toEqual(['', '12'])
  })

  it('shows a visitor who has not joined only the class itself', () => {
    const { paperClass, member } = toRollingPaperClass({
      ...classView,
      me: null,
      members: [],
      board: [],
      myPaper: null,
    })

    expect(member).toBeNull()
    expect(paperClass.lockers).toEqual([])
    expect(paperClass.name).toBe('3학년 2반')
  })

  it('replaces one paper’s notes and keeps them across class reloads', () => {
    const { paperClass } = toRollingPaperClass(classView)
    const withPaper = mergePaperView(paperClass, paperView)

    expect(withPaper.notes).toEqual([
      expect.objectContaining({ id: '7', paperLockerId: '11', authorLockerId: '12', x: 30.5, y: 20 }),
    ])

    const reloaded = toRollingPaperClass(classView, withPaper).paperClass
    expect(reloaded.notes).toHaveLength(1)
    // Another class does not inherit them.
    expect(toRollingPaperClass({ ...classView, code: 'other' }, withPaper).paperClass.notes).toEqual([])
  })

  it('reads a personal paper and keeps hidden notes as spots without text', () => {
    const { paperClass } = toRollingPaperClass({
      ...classView,
      kind: 'PERSONAL',
      name: '민지에게 한마디',
      members: [classView.members[0]],
      board: [],
    })
    expect(paperClass.kind).toBe('personal')
    expect(paperClass.lockers).toHaveLength(1)

    const merged = mergePaperView(paperClass, {
      ...paperView,
      noteCount: 2,
      notes: [
        { ...paperView.notes[0], id: 8, authorMemberId: null, authorName: '', text: null, mine: false, hidden: true },
        paperView.notes[0],
      ],
    })
    expect(merged.notes[0]).toMatchObject({ id: '8', text: '', authorLockerId: '', hidden: true, x: 30.5 })
    expect(merged.notes[1]).toMatchObject({ id: '7', text: '졸업 축하해!', hidden: undefined })
  })

  it('treats a class view without kind as a class', () => {
    expect(toRollingPaperClass(classView).paperClass.kind).toBe('class')
  })
})
