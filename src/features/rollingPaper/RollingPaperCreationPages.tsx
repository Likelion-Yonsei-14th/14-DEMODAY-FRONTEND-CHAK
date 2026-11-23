import { useEffect, useState } from 'react'
import { ArrowLeft, ScrollText, Share2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import { useHomePath } from '@/app/homePath'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { RollingPaperKind, RollingPaperRevealMode } from '@/types'
import { KindPicker } from './KindPicker'
import { PaperDesignPicker } from './PaperDesignPicker'
import { RevealModePicker } from './RevealModePicker'
import {
  DEFAULT_PAPER_DESIGN,
  describeOwnPaperReveal,
  isPersonalPaper,
} from './rollingPaper'
import { rollingPaperClassPath, shareRollingPaperInvite } from './rollingPaperShare'
import {
  createRollingPaperClass,
  findMyRollingPaperClass,
  joinRollingPaperClass,
  rollingPaperErrorMessage,
} from './rollingPaperActions'
import { RollingPaperLoadState } from './RollingPaperLoadState'
import { useRollingPaperLoad } from './useRollingPaperLoad'
import '@/features/classroom/Classroom.css'
import './RollingPaperPages.css'

export function RollingPaperEntryRedirect() {
  const [target, setTarget] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    findMyRollingPaperClass().then(
      (code) => {
        if (!cancelled) setTarget(code ? rollingPaperClassPath(code) : '/rolling-paper/create')
      },
      () => {
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (target) return <Navigate to={target} replace />
  return (
    <RollingPaperLoadState
      status={failed ? 'error' : 'loading'}
      onRetry={() => {
        setFailed(false)
        setAttempt((count) => count + 1)
      }}
    />
  )
}

/** The creator names the class, picks when owners see their paper and makes their own paper in one go. */
export function RollingPaperCreatePage() {
  const navigate = useNavigate()
  const homePath = useHomePath()
  const { showToast } = useFeedback()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [paperDesign, setPaperDesign] = useState(DEFAULT_PAPER_DESIGN)
  const [revealMode, setRevealMode] = useState<RollingPaperRevealMode>('onEnd')
  const [kind, setKind] = useState<RollingPaperKind>('class')
  const personal = kind === 'personal'
  // A personal paper's title defaults to "{name}에게 한마디".
  const title = name.trim() || (personal && displayName.trim() ? `${displayName.trim()}에게 한마디` : '')
  const ready = Boolean(title && displayName.trim())

  const create = async () => {
    if (!ready || busy) return
    setBusy(true)
    try {
      const classId = await createRollingPaperClass({
        name: title.slice(0, 20),
        displayName,
        paperDesign,
        revealMode,
        kind,
      })
      navigate(`${rollingPaperClassPath(classId)}/share`, { replace: true })
    } catch (error) {
      showToast(rollingPaperErrorMessage(error))
      setBusy(false)
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-form-shell"
      appBar={
        <AppBar
          title="연말 롤링페이퍼"
          leading={
            <IconButton
              label="이전으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(homePath)}
            />
          }
        />
      }
      fixedAction={
        <Button variant="brand" fullWidth disabled={!ready} loading={busy} onClick={create}>
          내 롤링페이퍼 만들기
        </Button>
      }
    >
      <main className="classroom-form">
        <span className="classroom-form__icon" aria-hidden>
          <ScrollText size={24} />
        </span>
        <section className="classroom-form__heading">
          <h1>
            한 해를 마무리하는
            <br />
            연말 롤링페이퍼
          </h1>
          <p>
            반을 만들어 친구들과 서로의 종이를 채우거나, 내 롤링페이퍼 한 장을
            링크로 보내 한마디씩 받아요.
          </p>
        </section>

        <div className="rolling-form-field">
          <span>어떤 롤링페이퍼를 만들까요?</span>
          <KindPicker value={kind} onChange={setKind} />
        </div>

        <TextField
          id="rolling-class-my-name"
          label="내 이름 또는 별명"
          placeholder="예: 지수"
          value={displayName}
          maxLength={12}
          helper={
            personal
              ? '내 롤링페이퍼에 "To. 이름"으로 적혀요.'
              : '내 사물함 이름표와 내가 남긴 글의 서명에 적혀요.'
          }
          onChange={(event) => setDisplayName(event.target.value)}
        />

        <TextField
          id="rolling-class-name"
          label={personal ? '롤링페이퍼 제목' : '반 이름'}
          placeholder={
            personal
              ? `예: ${displayName.trim() || '지수'}에게 한마디`
              : '예: 3학년 2반'
          }
          value={name}
          maxLength={20}
          helper={personal ? '비워 두면 "이름에게 한마디"로 만들어요.' : undefined}
          onChange={(event) => setName(event.target.value)}
        />

        <div className="rolling-form-field">
          <span>내 롤링페이퍼 디자인</span>
          <PaperDesignPicker value={paperDesign} onChange={setPaperDesign} />
        </div>

        <div className="rolling-form-field">
          <span>내 롤링페이퍼는 언제 볼까요?</span>
          <RevealModePicker value={revealMode} onChange={setRevealMode} />
        </div>
      </main>
    </AppShell>
  )
}

export function RollingPaperSharePage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { classId } = useParams()
  const paperClass = usePrototypeStore((state) => state.rollingPaperClass)
  const member = usePrototypeStore((state) => state.rollingPaperMember)
  const load = useRollingPaperLoad(classId)
  const id = classId ?? paperClass.id

  if (load.status !== 'ready') {
    return <RollingPaperLoadState status={load.status} onRetry={load.retry} />
  }
  if (!member) {
    return <Navigate to={`${rollingPaperClassPath(id)}/join`} replace />
  }

  const personal = isPersonalPaper(paperClass)
  const share = () =>
    shareRollingPaperInvite(id, paperClass.name, showToast, personal)

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-form-shell"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate(rollingPaperClassPath(id), { replace: true })}
        >
          {personal ? '내 롤링페이퍼 보기' : '교실로 들어가기'}
        </Button>
      }
    >
      <main className="classroom-form classroom-form--complete">
        <span className="classroom-form__complete-mark" aria-hidden>
          ✓
        </span>
        <section className="classroom-form__heading">
          <h1>
            {member.displayName}님 롤링페이퍼를
            <br />
            {personal ? '만들었어요.' : '사물함에 걸었어요.'}
          </h1>
          <p>
            {personal
              ? '이제 링크를 보내요. 받은 사람은 내 종이에 한마디를 남기고, 다른 사람이 쓴 글은 흐리게 보여서 나만 읽을 수 있어요.'
              : '이제 친구들을 불러요. 링크로 들어온 친구마다 자기 롤링페이퍼를 걸고, 서로의 종이에 한마디씩 남길 수 있어요. 다른 친구가 쓴 글은 흐리게 보여서 종이 주인만 읽을 수 있어요.'}
            <br />
            {describeOwnPaperReveal(paperClass)}
          </p>
        </section>

        <Button
          variant="secondary"
          fullWidth
          leadingIcon={<Share2 size={18} aria-hidden />}
          onClick={share}
        >
          {personal ? '내 롤링페이퍼 링크 보내기' : '친구들에게 링크 보내기'}
        </Button>
      </main>
    </AppShell>
  )
}

/** A friend from the link makes their own paper. */
export function RollingPaperJoinPage() {
  const navigate = useNavigate()
  const { classId } = useParams()
  const homePath = useHomePath()
  const paperClass = usePrototypeStore((state) => state.rollingPaperClass)
  const member = usePrototypeStore((state) => state.rollingPaperMember)
  const { showToast } = useFeedback()
  const load = useRollingPaperLoad(classId)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [paperDesign, setPaperDesign] = useState(DEFAULT_PAPER_DESIGN)
  const id = classId ?? paperClass.id

  if (load.status !== 'ready') {
    return <RollingPaperLoadState status={load.status} onRetry={load.retry} />
  }
  if (member) {
    return <Navigate to={rollingPaperClassPath(id)} replace />
  }

  const personal = isPersonalPaper(paperClass)
  const ownerName = personal ? paperClass.lockers[0]?.studentName : undefined

  const join = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      // A personal paper's writer hangs no paper of their own.
      await joinRollingPaperClass(id, name, personal ? undefined : paperDesign)
      navigate(rollingPaperClassPath(id), { replace: true })
    } catch (error) {
      showToast(rollingPaperErrorMessage(error))
      setBusy(false)
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-form-shell"
      appBar={
        <AppBar
          title={paperClass.name}
          leading={
            <IconButton
              label="이전으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(homePath)}
            />
          }
        />
      }
      fixedAction={
        <Button variant="brand" fullWidth disabled={!name.trim()} loading={busy} onClick={join}>
          {personal ? '한마디 쓰러 가기' : '내 롤링페이퍼 걸기'}
        </Button>
      }
    >
      <main className="classroom-form">
        <span className="classroom-form__icon" aria-hidden>
          <ScrollText size={24} />
        </span>
        <section className="classroom-form__heading">
          {personal ? (
            <>
              <h1>
                {ownerName ? `${ownerName}의 롤링페이퍼에` : `${paperClass.name}에`}
                <br />
                한마디 남겨 주세요.
              </h1>
              <p>
                이름을 적고 종이의 빈 곳에 한마디를 남겨요. 다른 사람이 쓴 글은 흐리게
                보여서 {ownerName ?? '주인'}만 읽을 수 있어요.
              </p>
            </>
          ) : (
            <>
              <h1>
                {paperClass.name} 롤링페이퍼에
                <br />
                초대받았어요.
              </h1>
              <p>
                이름을 적으면 내 사물함에 롤링페이퍼가 걸려요.{' '}
                {describeOwnPaperReveal(paperClass)}
              </p>
            </>
          )}
        </section>

        <TextField
          id="rolling-class-join-name"
          label="내 이름 또는 별명"
          placeholder="예: 지수"
          value={name}
          maxLength={12}
          autoFocus
          helper={personal ? '내가 남긴 글의 서명에 적혀요.' : undefined}
          onChange={(event) => setName(event.target.value)}
        />

        {!personal && (
          <div className="rolling-form-field">
            <span>내 롤링페이퍼 디자인</span>
            <PaperDesignPicker value={paperDesign} onChange={setPaperDesign} />
          </div>
        )}
      </main>
    </AppShell>
  )
}
