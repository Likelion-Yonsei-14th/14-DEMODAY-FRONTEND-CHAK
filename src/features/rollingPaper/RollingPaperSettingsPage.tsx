import { useState } from 'react'
import { ArrowLeft, Flag, Share2, Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  Button,
  Dialog,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import { useHomePath } from '@/app/homePath'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { RollingPaperRevealMode } from '@/types'
import { PaperDesignPicker } from './PaperDesignPicker'
import { RevealModePicker } from './RevealModePicker'
import {
  DEFAULT_PAPER_DESIGN,
  getRevealMode,
  isRollingPaperCreator,
  isRollingPaperEnded,
  isPersonalPaper,
} from './rollingPaper'
import {
  rollingPaperClassPath,
  shareRollingPaperInvite,
} from './rollingPaperShare'
import '@/features/classroom/ClassroomSettingsPage.css'
import {
  deleteRollingPaperClass,
  endRollingPaperClass,
  rollingPaperErrorMessage,
  updateMyRollingPaper,
  updateRollingPaperClass,
} from './rollingPaperActions'
import { RollingPaperLoadState } from './RollingPaperLoadState'
import { useRollingPaperLoad } from './useRollingPaperLoad'
import './RollingPaperPages.css'

type Confirm = 'end' | 'delete' | null

/** Loads the class first, so the form starts from what the server has. */
export function RollingPaperSettingsPage() {
  const { classId } = useParams()
  const load = useRollingPaperLoad(classId)
  if (load.status !== 'ready') {
    return <RollingPaperLoadState status={load.status} onRetry={load.retry} />
  }
  return <RollingPaperSettingsForm />
}

function RollingPaperSettingsForm() {
  const navigate = useNavigate()
  const homePath = useHomePath()
  const { classId } = useParams()
  const { showToast } = useFeedback()
  const paperClass = usePrototypeStore((state) => state.rollingPaperClass)
  const member = usePrototypeStore((state) => state.rollingPaperMember)
  const [busy, setBusy] = useState(false)
  const myLocker = paperClass.lockers.find(
    (locker) => locker.id === member?.lockerId,
  )
  const [className, setClassName] = useState(paperClass.name)
  const [revealMode, setRevealMode] = useState<RollingPaperRevealMode>(
    getRevealMode(paperClass),
  )
  const [displayName, setDisplayName] = useState(member?.displayName ?? '')
  const [paperDesign, setPaperDesign] = useState(
    myLocker?.paperDesign ?? DEFAULT_PAPER_DESIGN,
  )
  const [confirm, setConfirm] = useState<Confirm>(null)

  const id = classId ?? paperClass.id
  if (!member) {
    return <Navigate to={`${rollingPaperClassPath(id)}/join`} replace />
  }

  const creator = isRollingPaperCreator(paperClass, member.lockerId)
  const ended = isRollingPaperEnded(paperClass)
  const canSave =
    Boolean(displayName.trim()) &&
    (!creator || Boolean(className.trim()))

  /** Runs one change; on failure says why and stays on the page. */
  const run = async (action: () => Promise<void>, done: () => void) => {
    if (busy) return
    setBusy(true)
    try {
      await action()
      done()
    } catch (error) {
      showToast(rollingPaperErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    if (!canSave) return
    run(
      async () => {
        if (creator) await updateRollingPaperClass(id, { name: className, revealMode })
        await updateMyRollingPaper(id, { displayName, paperDesign })
      },
      () => {
        showToast('설정을 저장했어요.')
        navigate(rollingPaperClassPath(id))
      },
    )
  }

  const personal = isPersonalPaper(paperClass)

  const end = () =>
    run(
      () => endRollingPaperClass(id),
      () => {
        setConfirm(null)
        showToast(personal ? '롤링페이퍼를 종료했어요. 이제 내 롤링페이퍼를 볼 수 있어요.' : '롤링페이퍼를 종료했어요. 이제 모두 자기 롤링페이퍼를 볼 수 있어요.')
        navigate(rollingPaperClassPath(id))
      },
    )

  const remove = () =>
    run(
      () => deleteRollingPaperClass(id),
      () => {
        setConfirm(null)
        showToast(personal ? '롤링페이퍼를 삭제했어요.' : '반을 삭제했어요.')
        navigate(homePath, { replace: true })
      },
    )

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-settings-shell"
      appBar={
        <AppBar
          title="롤링페이퍼 설정"
          subtitle={paperClass.name}
          leading={
            <IconButton
              label={personal ? '롤링페이퍼로 돌아가기' : '교실로 돌아가기'}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(rollingPaperClassPath(id))}
            />
          }
        />
      }
      fixedAction={
        <Button variant="brand" fullWidth disabled={!canSave} loading={busy} onClick={save}>
          저장
        </Button>
      }
    >
      <main className="classroom-settings">
        {creator && (
          <section className="classroom-settings__section">
            <header>
              <h2>{personal ? '롤링페이퍼 관리' : '반 관리'}</h2>
              <span className="classroom-settings__admin-badge">만든 사람</span>
            </header>

            <TextField
              id="rolling-settings-class-name"
              label={personal ? '롤링페이퍼 제목' : '반 이름'}
              maxLength={20}
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            />

            <div className="rolling-form-field">
              <span>내 롤링페이퍼는 언제 볼까요?</span>
              <RevealModePicker value={revealMode} onChange={setRevealMode} />
            </div>

            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Share2 size={17} aria-hidden />}
              onClick={() =>
                shareRollingPaperInvite(id, paperClass.name, showToast, personal)
              }
            >
              {personal ? '내 롤링페이퍼 링크 보내기' : '초대 링크 공유하기'}
            </Button>
          </section>
        )}

        <section className="classroom-settings__section">
          <header>
            <h2>내 롤링페이퍼</h2>
          </header>

          <TextField
            id="rolling-settings-my-name"
            label={personal ? '내 이름' : '사물함 이름표'}
            maxLength={12}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />

          <div className="rolling-form-field">
            <span>디자인</span>
            <PaperDesignPicker value={paperDesign} onChange={setPaperDesign} />
          </div>
        </section>

        {creator && (
          <section className="classroom-settings__section rolling-settings-danger">
            <header>
              <h2>롤링페이퍼 마무리</h2>
            </header>

            {ended ? (
              <p>롤링페이퍼가 종료됐어요. 모두 자기 롤링페이퍼를 볼 수 있고, 더 이상 글을 쓸 수 없어요.</p>
            ) : (
              <>
                <p>
                  {personal
                    ? '종료하면 더 이상 글을 받지 않고, 내 롤링페이퍼가 열려요.'
                    : '종료하면 더 이상 글을 쓸 수 없고, 모두 자기 롤링페이퍼를 볼 수 있어요.'}
                </p>
                <Button
                  variant="secondary"
                  fullWidth
                  leadingIcon={<Flag size={17} aria-hidden />}
                  onClick={() => setConfirm('end')}
                >
                  롤링페이퍼 종료하기
                </Button>
              </>
            )}

            <Button
              variant="tertiary"
              fullWidth
              className="rolling-settings-danger__delete"
              leadingIcon={<Trash2 size={17} aria-hidden />}
              onClick={() => setConfirm('delete')}
            >
              {personal ? '롤링페이퍼 삭제하기' : '반 삭제하기'}
            </Button>
          </section>
        )}
      </main>

      <Dialog
        open={confirm === 'end'}
        onClose={() => setConfirm(null)}
        title="롤링페이퍼를 종료할까요?"
        description={
          personal
            ? '종료하면 더 이상 글을 받지 않고, 내 롤링페이퍼가 열려요. 종료는 되돌릴 수 없어요.'
            : '종료하면 친구들이 더 이상 글을 쓸 수 없고, 모두 자기 롤링페이퍼를 열어볼 수 있어요. 종료는 되돌릴 수 없어요.'
        }
        secondaryAction={{ label: '취소', onClick: () => setConfirm(null) }}
        primaryAction={{ label: '종료하기', onClick: end, variant: 'brand' }}
      />

      <Dialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title={personal ? '이 롤링페이퍼를 삭제할까요?' : '이 반을 삭제할까요?'}
        description={
          personal
            ? '받은 글이 모두 함께 지워져요. 삭제하면 되돌릴 수 없어요.'
            : '모든 친구의 롤링페이퍼와 남긴 글, 칠판 글이 함께 지워져요. 삭제하면 되돌릴 수 없어요.'
        }
        secondaryAction={{ label: '취소', onClick: () => setConfirm(null) }}
        primaryAction={{ label: '삭제하기', onClick: remove, variant: 'primary' }}
      />
    </AppShell>
  )
}
