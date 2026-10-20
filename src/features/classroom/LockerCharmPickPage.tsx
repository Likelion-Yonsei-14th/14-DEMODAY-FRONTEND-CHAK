import { ArrowLeft } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { formatChaltteok } from '@/features/chaltteok/chaltteok'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  UNIVERSITY_CHARM_PRICE,
  charmUniversities,
  parseUniversityCharmId,
  universityCharmId,
  universityCharmShapes,
} from './universities'
import '@/features/supporter/supporterFlow.css'
import './Classroom.css'

/**
 * Locker charm, step 1: pick the university-goods keyring before writing
 * the cheer inside it. Payment happens when it is placed.
 */
export function LockerCharmPickPage() {
  const navigate = useNavigate()
  const { classroomId, lockerId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const charmDraft = usePrototypeStore((state) => state.charmDraft)
  const setCharmDraft = usePrototypeStore((state) => state.setCharmDraft)
  const locker = classroom.lockers.find((item) => item.id === lockerId)

  if (!locker) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/map`}
        replace
      />
    )
  }

  const lockerPath = `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}`
  const current =
    parseUniversityCharmId(charmDraft.assetId) ??
    parseUniversityCharmId(universityCharmId(charmUniversities[0]!.id, 'jersey'))!
  const pick = (schoolId: string, shape: typeof current.shape) =>
    setCharmDraft({
      assetId: universityCharmId(schoolId, shape),
      material: 'acrylic',
    })

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-locker-placement-shell"
      appBar={
        <AppBar
          title="부적 고르기"
          leading={
            <IconButton
              label={`${locker.studentName}님의 사물함으로 돌아가기`}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(lockerPath)}
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => {
            // Make sure a university charm is stored even if nothing was tapped
            pick(current.school.id, current.shape)
            navigate(`${lockerPath}/compose`)
          }}
        >
          이 부적에 응원 쓰기
        </Button>
      }
    >
      <main className="classroom-locker-placement locker-charm-pick">
        <section className="classroom-locker-placement__heading">
          <h1>
            {locker.studentName}님에게 줄
            <br />
            대학 굿즈 부적을 골라요.
          </h1>
        </section>

        <section className="university-charm-picker" aria-label="대학 굿즈 부적">
          <div className="university-charm-picker__label">
            <strong>학교</strong>
            <span>아크릴 키링 · {formatChaltteok(UNIVERSITY_CHARM_PRICE)} · 놓을 때 결제해요</span>
          </div>
          <div className="university-charm-picker__schools" role="list">
            {charmUniversities.map((item) => (
              <button
                type="button"
                key={item.id}
                className={[
                  'university-charm-picker__school',
                  item.id === current.school.id
                    ? 'university-charm-picker__school--selected'
                    : '',
                ].filter(Boolean).join(' ')}
                style={{ '--school-color': item.color } as React.CSSProperties}
                aria-pressed={item.id === current.school.id}
                onClick={() => pick(item.id, current.shape)}
              >
                {item.name.replace('대학교', '대')}
              </button>
            ))}
          </div>
          <div className="university-charm-picker__label">
            <strong>모양</strong>
          </div>
          <div className="placement-object-picker university-charm-picker__shapes">
            {universityCharmShapes.map((item) => (
              <button
                type="button"
                key={item.id}
                className={[
                  'placement-object-option',
                  current.shape === item.id
                    ? 'placement-object-option--selected'
                    : '',
                ].filter(Boolean).join(' ')}
                aria-pressed={current.shape === item.id}
                onClick={() => pick(current.school.id, item.id)}
              >
                <span
                  className="placement-object-option__preview desk-object--charm"
                  aria-hidden
                >
                  <DeskObjectVisual
                    type="charm"
                    assetId={universityCharmId(current.school.id, item.id)}
                  />
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
