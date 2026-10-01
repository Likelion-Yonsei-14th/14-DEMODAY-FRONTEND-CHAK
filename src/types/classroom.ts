import type { DeskObject } from './desk'

export type ClassroomLocker = {
  id: string
  studentName: string
  messageIds: string[]
  objects: DeskObject[]
}

export type BlackboardEntry = {
  id: string
  authorName: string
  text: string
  drawingDataUrl?: string
  createdAt: string
}

export type ClassroomMember = {
  lockerId: string
  displayName: string
}

export type Classroom = {
  id: string
  name: string
  blackboardMessageIds: string[]
  blackboardEntries: BlackboardEntry[]
  lockers: ClassroomLocker[]
  dailyUnlockTime: string
}
