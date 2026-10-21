import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { claimDesk, fetchClaimPreview, type ApiClaimPreview, type ApiClaimResult } from '@/api/desks'
import { deskFromApi } from '@/api/mappers'
import { setLoginReturn } from '@/features/chaltteok/returnFlow'
import { AppBar, Button, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './ClaimFlow.css'

type Step = 'intro' | 'confirm' | 'done'
type Problem = 'gone' | 'has-desk' | 'failed' | null

function Shell({ back, children }: { back: () => void; children: ReactNode }) {
  return (
    <AppShell
      surface="base"
      contentClassName="claim-flow-shell"
      appBar={
        <AppBar
          title="응원 책상 받기"
          leading={<IconButton label="처음으로" icon={<ArrowLeft size={21} aria-hidden />} onClick={back} />}
        />
      }
    >
      <main className="claim-flow">{children}</main>
    </AppShell>
  )
}

/**
 * The page a friend's link opens for the person a desk was made for. They sign in, see how many cheers
 * are waiting (never what they say), confirm they really are that person, and take the desk over.
 */
export function ClaimLinkPage() {
  const { claimToken = '' } = useParams()
  const navigate = useNavigate()
  const authenticated = usePrototypeStore((state) => state.authSession.status === 'authenticated')
  const [preview, setPreview] = useState<ApiClaimPreview | null>(null)
  const [step, setStep] = useState<Step>('intro')
  const [problem, setProblem] = useState<Problem>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ApiClaimResult | null>(null)

  useEffect(() => {
    if (!authenticated || !isApiEnabled) return
    let cancelled = false
    fetchClaimPreview(claimToken)
      .then((value) => !cancelled && setPreview(value))
      .catch((error) => {
        if (cancelled) return
        setProblem(error instanceof ApiError && error.code === 'CLAIM_NOT_AVAILABLE' ? 'gone' : 'failed')
      })
    return () => {
      cancelled = true
    }
  }, [authenticated, claimToken])

  // Without a backend there is no real link to open: the offline prototype has its own walkthrough.
  if (!isApiEnabled) return <Navigate to="/prototype/claim" replace />

  const goHome = () => navigate('/home', { replace: true })

  if (!authenticated) {
    return (
      <Shell back={() => navigate('/')}>
        <section className="claim-flow__heading">
          <h1>
            친구가 응원 책상을
            <br />
            만들어 두었어요.
          </h1>
        </section>
        <p>로그인하면 책상을 받을 수 있어요. 응원 내용은 책상을 받은 뒤에 열어볼 수 있어요.</p>
        <Button
          variant="brand"
          fullWidth
          onClick={() => {
            setLoginReturn({ path: `/claim/${claimToken}`, notice: '로그인하면 친구가 만든 책상을 받을 수 있어요.' })
            navigate('/auth/login')
          }}
        >
          로그인하고 책상 받기
        </Button>
      </Shell>
    )
  }

  if (problem === 'gone') {
    return (
      <Shell back={goHome}>
        <section className="claim-flow__heading">
          <h1>이미 사용했거나<br />없는 링크예요.</h1>
        </section>
        <p>링크를 보낸 친구에게 새 링크를 부탁해 보세요.</p>
        <Button variant="brand" fullWidth onClick={goHome}>홈으로</Button>
      </Shell>
    )
  }

  if (problem === 'has-desk') {
    return (
      <Shell back={goHome}>
        <section className="claim-flow__heading">
          <h1>이미 내 응원 책상이<br />있어요.</h1>
        </section>
        <p>응원 책상은 한 사람에 하나만 가질 수 있어서 이 책상은 받을 수 없어요.</p>
        <Button variant="brand" fullWidth onClick={() => navigate('/prototype/my/desk')}>내 책상 보기</Button>
      </Shell>
    )
  }

  if (!preview) {
    return (
      <Shell back={goHome}>
        <p role={problem ? 'alert' : undefined}>
          {problem === 'failed' ? '책상 정보를 불러오지 못했어요. 잠시 후 다시 열어주세요.' : '불러오고 있어요...'}
        </p>
      </Shell>
    )
  }

  if (step === 'done' && result) {
    return (
      <Shell back={goHome}>
        <section className="claim-flow__heading">
          <h1>이제 내 응원 책상이에요.</h1>
        </section>
        <div className="claim-flow__count">
          <strong>친구들이 먼저 기다리고 있었어요.</strong>
          <span>
            {result.messageCount > 0
              ? `친구 ${result.friendCount}명이 응원 ${result.messageCount}개를 남겼어요.`
              : '곧 응원이 도착할 거예요.'}
          </span>
        </div>
        <Button variant="brand" fullWidth onClick={() => navigate('/prototype/my/desk', { replace: true })}>
          내 책상 보기
        </Button>
      </Shell>
    )
  }

  if (step === 'confirm') {
    const claim = async () => {
      if (busy) return
      setBusy(true)
      try {
        const claimed = await claimDesk(claimToken, true)
        const state = usePrototypeStore.getState()
        state.hydrateDesk({
          desk: deskFromApi(claimed.desk, state.currentDesk, [], claimed.desk.supporterToken),
          messages: [],
          readMessageIds: [],
          basketMessageIds: [],
          ownerSettings: {
            publicFeedEnabled: claimed.desk.publicFeedEnabled,
            roomClosed: claimed.desk.roomClosed,
          },
        })
        setResult(claimed)
        setStep('done')
      } catch (error) {
        if (error instanceof ApiError && error.code === 'DESK_ALREADY_EXISTS') setProblem('has-desk')
        else if (error instanceof ApiError && error.code === 'CLAIM_NOT_AVAILABLE') setProblem('gone')
        else setProblem('failed')
      } finally {
        setBusy(false)
      }
    }
    return (
      <Shell back={() => setStep('intro')}>
        <section className="claim-flow__heading">
          <h1>
            혹시 {preview.displayName}님
            <br />
            본인이 맞나요?
          </h1>
        </section>
        <p>
          이 책상은 {preview.displayName}님을 위해 만들어졌어요. 책상을 받으면 모인 응원을 열어볼 수 있고, 만든 친구는
          더 이상 책상을 관리할 수 없어요.
        </p>
        {problem === 'failed' && <p role="alert">책상을 받지 못했어요. 잠시 후 다시 시도해주세요.</p>}
        <Button variant="brand" fullWidth loading={busy} onClick={claim}>
          네, 제가 {preview.displayName}님 본인이에요
        </Button>
        <Button variant="tertiary" fullWidth onClick={goHome}>
          아니에요
        </Button>
      </Shell>
    )
  }

  return (
    <Shell back={goHome}>
      <section className="claim-flow__heading">
        <h1>
          {preview.creatorName}님이 {preview.displayName}님을 위해
          <br />
          응원 책상을 만들었어요.
        </h1>
      </section>
      <div className="claim-flow__count">
        <strong>
          {preview.messageCount > 0
            ? `친구 ${preview.friendCount}명이 응원 ${preview.messageCount}개를 남겼어요.`
            : '아직 남긴 응원이 없어요.'}
        </strong>
        <span>응원 내용은 책상을 받은 뒤에 열어볼 수 있어요.</span>
      </div>
      <Button variant="brand" fullWidth onClick={() => setStep('confirm')}>
        내 응원 책상 받기
      </Button>
    </Shell>
  )
}
