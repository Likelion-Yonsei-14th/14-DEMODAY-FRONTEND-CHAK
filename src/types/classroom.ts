export type ClassroomLocker = {
  id: string
  studentName: string
  messageIds: string[]
}

export type Classroom = {
  id: string
  name: string
  blackboardMessageIds: string[]
  lockers: ClassroomLocker[]
}
