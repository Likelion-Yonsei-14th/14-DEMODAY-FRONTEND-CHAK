import { useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageCircleMore,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppBar, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { LockerMiniDoor } from './LockerScene'
import './Classroom.css'

const zoneLabels = ['칠판', '교실', '사물함'] as const

export function ClassroomMapPage() {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const [camera, setCamera] = useState(1)

  if (!member) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/join`}
        replace
      />
    )
  }

  const id = classroomId ?? classroom.id

  return (
    <AppShell
      surface="transparent"
      contentClassName="classroom-map-shell"
      appBar={
        <AppBar
          title={classroom.name}
          subtitle={`${member.displayName} · ${zoneLabels[camera]}`}
          transparent
          leading={
            <IconButton
              label="처음으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/start')}
            />
          }
        />
      }
    >
      <main className="classroom-map">
        <p className="classroom-map__hint">
          좌우로 둘러보고, 가까이 있는 공간을 눌러보세요.
        </p>

        <section className="classroom-map__viewport" aria-label="응원 교실">
          <div
            className="classroom-map__world"
            style={{
              transform: `translateX(-${camera * 33.333333}%)`,
            }}
          >
            <div className="classroom-map__zone classroom-map__zone--board">
              <div className="classroom-map__wall">
                <div className="classroom-map__clock">10:10</div>
                <button
                  type="button"
                  className="classroom-map__blackboard"
                  onClick={() =>
                    navigate(
                      `/prototype/classroom/${id}/blackboard`,
                    )
                  }
                >
                  <span className="classroom-map__chalk-title">
                    수능까지 같이 가자!
                  </span>
                  <div className="classroom-map__chalk-notes">
                    {classroom.blackboardEntries
                      .slice(-4)
                      .map((entry) => (
                        <span key={entry.id}>
                          {entry.text || '✦'}
                        </span>
                      ))}
                  </div>
                  <span className="classroom-map__interaction">
                    <MessageCircleMore size={15} aria-hidden />
                    칠판 보기
                  </span>
                </button>
                <div className="classroom-map__board-ledge" />
              </div>
              <div className="classroom-map__floor">
                <span className="classroom-map__desk classroom-map__desk--left" />
                <span className="classroom-map__desk classroom-map__desk--right" />
              </div>
            </div>

            <div className="classroom-map__zone classroom-map__zone--center">
              <div className="classroom-map__windows">
                <span />
                <span />
                <span />
              </div>
              <div className="classroom-map__banner">
                오늘 한 만큼이면 충분해
              </div>
              <div className="classroom-map__floor classroom-map__floor--center">
                {[0, 1, 2, 3, 4, 5].map((desk) => (
                  <span
                    className="classroom-map__student-desk"
                    key={desk}
                  />
                ))}
              </div>
            </div>

            <div className="classroom-map__zone classroom-map__zone--lockers">
              <div className="classroom-map__locker-wall">
                <div className="classroom-map__locker-grid">
                  {classroom.lockers.map((locker) => (
                    <button
                      type="button"
                      key={locker.id}
                      className="classroom-map__locker-button"
                      onClick={() =>
                        navigate(
                          `/prototype/classroom/${id}/locker/${locker.id}`,
                        )
                      }
                    >
                      <LockerMiniDoor
                        studentName={locker.studentName}
                        active={locker.id === member.lockerId}
                      />
                      {locker.id === member.lockerId && (
                        <span className="classroom-map__mine">
                          내 사물함
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="classroom-map__floor" />
            </div>
          </div>

          <button
            type="button"
            className="classroom-map__move classroom-map__move--left"
            aria-label="교실 왼쪽으로 이동"
            disabled={camera === 0}
            onClick={() => setCamera((value) => Math.max(0, value - 1))}
          >
            <ChevronLeft size={24} aria-hidden />
          </button>

          <button
            type="button"
            className="classroom-map__move classroom-map__move--right"
            aria-label="교실 오른쪽으로 이동"
            disabled={camera === 2}
            onClick={() => setCamera((value) => Math.min(2, value + 1))}
          >
            <ChevronRight size={24} aria-hidden />
          </button>
        </section>

        <div className="classroom-map__position" aria-hidden>
          {zoneLabels.map((label, index) => (
            <span
              key={label}
              className={
                index === camera
                  ? 'classroom-map__position-dot classroom-map__position-dot--active'
                  : 'classroom-map__position-dot'
              }
            />
          ))}
        </div>
      </main>
    </AppShell>
  )
}
