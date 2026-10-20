import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  TextField,
} from '@/design-system'
import { formatChaltteok } from '@/features/chaltteok/chaltteok'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import { AppShell } from '@/layout/AppShell'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  ACRYLIC_CHARM_PRICE,
  CHARM_PHRASE_MAX_LENGTH,
  charmDesigns,
  getCharmDesign,
} from './charmDesigns'
import './supporterFlow.css'

/**
 * Desk charm, step 1: pick the charm before writing the cheer inside it.
 * Design, phrase and material are kept in the store for the placement step.
 */
export function CharmPickPage() {
  const navigate = useNavigate()
  const { supporterToken = DEFAULT_SUPPORTER_TOKEN } = useParams()
  const recipientName = usePrototypeStore(
    (state) => state.currentDesk.displayName,
  )
  const charmDraft = usePrototypeStore((state) => state.charmDraft)
  const setCharmDraft = usePrototypeStore((state) => state.setCharmDraft)
  const recommendedPhrase = getCharmDesign(charmDraft.assetId).phrase

  return (
    <AppShell
      surface="transparent"
      appBar={
        <AppBar
          title="부적 고르기"
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
          이 부적에 응원 쓰기
        </Button>
      }
    >
      <main className="charm-pick">
        <section className="placement-preview__copy">
          <h2>
            {recipientName}님에게 줄
            <br />
            부적을 먼저 골라요.
          </h2>
          <p>응원은 다음 단계에서 부적 안에 적어요.</p>
        </section>

        <section className="charm-picker" aria-label="부적 디자인과 재질">
          <div className="charm-picker__designs">
            {charmDesigns.map((design) => {
              const selected = charmDraft.assetId === design.id

              return (
                <button
                  type="button"
                  key={design.id}
                  className={[
                    'charm-picker__design',
                    selected ? 'charm-picker__design--selected' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={`${design.phrase} 부적`}
                  aria-pressed={selected}
                  onClick={() => setCharmDraft({ assetId: design.id })}
                >
                  <span
                    className="charm-picker__preview desk-object--charm"
                    aria-hidden
                  >
                    <DeskObjectVisual
                      type="charm"
                      assetId={design.id}
                      material={charmDraft.material}
                      charmPhrase={selected ? charmDraft.phrase : undefined}
                      seed={design.id}
                    />
                  </span>
                  <span>{design.phrase}</span>
                </button>
              )
            })}
          </div>

          <div className="charm-phrase">
            <TextField
              id="charm-phrase"
              label="부적에 적을 응원"
              helper={`책상 위에 보여서 누구나 볼 수 있어요. 비워두면 '${recommendedPhrase}'(으)로 적혀요.`}
              placeholder={`${recommendedPhrase}  ·  Tab으로 넣기`}
              maxLength={CHARM_PHRASE_MAX_LENGTH}
              value={charmDraft.phrase}
              onChange={(event) => setCharmDraft({ phrase: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Tab' && !event.shiftKey && !charmDraft.phrase) {
                  event.preventDefault()
                  setCharmDraft({ phrase: recommendedPhrase })
                }
              }}
            />
            {charmDraft.phrase !== recommendedPhrase && (
              <button
                type="button"
                className="charm-phrase__suggestion"
                onClick={() => setCharmDraft({ phrase: recommendedPhrase })}
              >
                추천 문구 넣기 · {recommendedPhrase}
              </button>
            )}
          </div>

          <div
            className="charm-picker__materials"
            role="radiogroup"
            aria-label="재질"
          >
            {([
              ['flat', '평면 스티커', '무료'],
              ['acrylic', '아크릴 3D', formatChaltteok(ACRYLIC_CHARM_PRICE)],
            ] as const).map(([material, label, price]) => (
              <button
                type="button"
                key={material}
                role="radio"
                aria-checked={charmDraft.material === material}
                className={[
                  'charm-picker__material',
                  charmDraft.material === material
                    ? 'charm-picker__material--selected'
                    : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setCharmDraft({ material })}
              >
                <strong>{label}</strong>
                <span>{price}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
