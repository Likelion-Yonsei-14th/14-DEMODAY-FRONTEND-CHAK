import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import { AppShell } from '@/layout/AppShell'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'
import { usePrototypeStore } from '@/store/prototypeStore'
import { peperoDesigns } from './peperoDesigns'
import './supporterFlow.css'

/**
 * 빼빼로데이, step 1: pick the box before writing the letter tucked inside it.
 * Then the usual composer → placement flow, like a charm.
 */
export function PeperoPickPage() {
  const navigate = useNavigate()
  const { supporterToken = DEFAULT_SUPPORTER_TOKEN } = useParams()
  const recipientName = usePrototypeStore(
    (state) => state.currentDesk.displayName,
  )
  const peperoDraft = usePrototypeStore((state) => state.peperoDraft)
  const setPeperoDraft = usePrototypeStore((state) => state.setPeperoDraft)

  return (
    <AppShell
      surface="transparent"
      appBar={
        <AppBar
          title="빼빼로 고르기"
          transparent
          leading={
            <IconButton
              label={`${recipientName}님의 책상으로 돌아가기`}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(supporterPath(supporterToken))}
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate(supporterPath(supporterToken, '/compose'))}
        >
          빼빼로에 넣을 편지 쓰기
        </Button>
      }
    >
      <main className="charm-pick">
        <section className="placement-preview__copy">
          <h2>
            {recipientName}님 책상에
            <br />
            빼빼로 한 상자 놓고 가요.
          </h2>
          <p>11월 11일 빼빼로데이 한정! 상자 안에 넣을 편지는 다음 단계에서 써요.</p>
        </section>

        <section className="charm-picker" aria-label="빼빼로 맛">
          <div className="charm-picker__designs">
            {peperoDesigns.map((design) => {
              const selected = peperoDraft.assetId === design.id

              return (
                <button
                  type="button"
                  key={design.id}
                  className={[
                    'charm-picker__design',
                    selected ? 'charm-picker__design--selected' : '',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={selected}
                  onClick={() => setPeperoDraft({ assetId: design.id })}
                >
                  <span
                    className="charm-picker__preview desk-object--pepero"
                    aria-hidden
                  >
                    <DeskObjectVisual
                      type="pepero"
                      assetId={design.id}
                      seed={design.id}
                    />
                  </span>
                  <span>{design.name}</span>
                </button>
              )
            })}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
