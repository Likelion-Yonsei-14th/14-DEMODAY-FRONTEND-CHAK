import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/design-system'
import {
  getCsatDateLabel,
  getCsatDdayLabel,
} from '@/features/csat/csatSchedule'
import { DeskObjectLayer } from '@/features/desk/DeskObjectLayer'
import { DeskScene } from '@/features/desk/DeskScene'
import {
  mergeSupportMessages,
  seededDeskObjects,
} from '@/features/supporter/seededMessages'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './StartPage.css'

export function StartPage() {
  const navigate = useNavigate()
  const resetDeskCreationDraft = usePrototypeStore(
    (state) => state.resetDeskCreationDraft,
  )

  const messages = useMemo(
    () => mergeSupportMessages([]),
    [],
  )

  const startCreating = () => {
    resetDeskCreationDraft()
    navigate('/prototype/create')
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="start-page-shell"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          trailingIcon={<ArrowRight size={18} aria-hidden />}
          onClick={startCreating}
        >
          응원 책상 만들기
        </Button>
      }
    >
      <main className="start-page">
        <header className="start-page__header">
          <span className="start-page__dday">
            {getCsatDdayLabel()}
          </span>
          <span className="start-page__date">
            {getCsatDateLabel()} 수능
          </span>
        </header>

        <section className="start-page__hero">
          <h1>
            수능까지 쌓이는
            <br />
            응원 책상을 만들어보세요.
          </h1>
          <p>
            친구들이 남긴 마음이 책상 위에 하나씩 쌓여요.
          </p>
        </section>

        <div className="start-page__scene" aria-hidden>
          <DeskScene ownerName="수험생" />
          <DeskObjectLayer
            objects={seededDeskObjects}
            messages={messages}
            respectObjectLocks={false}
            showUnreadState={false}
          />
        </div>
      </main>
    </AppShell>
  )
}
