import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  UsersRound,
} from 'lucide-react'
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { usePrototypeStore } from '@/store/prototypeStore'
import './Classroom.css'

export function ClassroomEntryRedirect() {
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const next = member ? 'map' : 'join'

  return (
    <Navigate
      to={`/prototype/classroom/${classroom.id}/${next}`}
      replace
    />
  )
}

export function ClassroomCreatePage() {
  const navigate = useNavigate()
  const createClassroom = usePrototypeStore(
    (state) => state.createClassroom,
  )
  const [name, setName] = useState('')

  const create = () => {
    if (!name.trim()) return
    const classroomId = createClassroom(name)
    // The creator makes their own locker first, so the class isn't empty
    // when the first friend opens the link.
    navigate(
      `/prototype/classroom/${classroomId}/join?from=create`,
      { replace: true },
    )
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-form-shell"
      appBar={
        <AppBar
          title="함께 응원 모으기"
          leading={
            <IconButton
              label="처음으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/start')}
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          disabled={!name.trim()}
          trailingIcon={<ArrowRight size={18} aria-hidden />}
          onClick={create}
        >
          우리 공간 만들기
        </Button>
      }
    >
      <main className="classroom-form">
        <span className="classroom-form__icon" aria-hidden>
          <UsersRound size={24} />
        </span>
        <section className="classroom-form__heading">
          <h1>
            우리끼리 모일 공간에
            <br />
            이름을 붙여주세요.
          </h1>
          <p>
            반 이름도, 스터디 이름도, 우리끼리 부르는 별명도 괜찮아요.
          </p>
        </section>

        <TextField
          id="classroom-name"
          label="공간 이름"
          placeholder="예: 3학년 2반"
          value={name}
          maxLength={20}
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      </main>
    </AppShell>
  )
}

export function ClassroomCreateCompletePage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { classroomId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const id = classroomId ?? classroom.id

  const share = async () => {
    const url = buildPrototypeShareUrl(
      `/prototype/classroom/${id}/join`,
    )

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${classroom.name} 응원 공간`,
          text: '칠판도 채우고, 서로의 사물함에 응원을 남겨줘!',
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      showToast('친구들에게 보낼 링크를 복사했어요.')
    } catch {
      // 공유 시트를 닫은 경우에는 별도 오류를 노출하지 않습니다.
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-form-shell"
      fixedAction={
        member ? (
          <Button
            variant="brand"
            fullWidth
            onClick={() =>
              navigate(`/prototype/classroom/${id}/map`, { replace: true })
            }
          >
            교실로 들어가기
          </Button>
        ) : (
          <Button
            variant="brand"
            fullWidth
            onClick={() =>
              navigate(`/prototype/classroom/${id}/join?from=create`)
            }
          >
            내 사물함 만들러 가기
          </Button>
        )
      }
    >
      <main className="classroom-form classroom-form--complete">
        <span className="classroom-form__complete-mark" aria-hidden>
          ✓
        </span>
        <section className="classroom-form__heading">
          <h1>
            {classroom.name}에
            <br />
            친구들을 불러볼까요?
          </h1>
          <p>
            {member
              ? `${member.displayName}님 사물함이 먼저 자리를 잡았어요. 같은 링크로 들어온 친구마다 이름표 붙은 사물함이 하나씩 생겨요.`
              : '같은 링크로 들어오면 칠판을 함께 채우고, 각자 이름으로 사물함이 생겨요.'}
          </p>
        </section>

        <Button
          variant="secondary"
          fullWidth
          leadingIcon={<Share2 size={18} aria-hidden />}
          onClick={share}
        >
          친구들에게 링크 보내기
        </Button>
      </main>
    </AppShell>
  )
}

export function ClassroomJoinPage() {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const [searchParams] = useSearchParams()
  const creating = searchParams.get('from') === 'create'
  const classroom = usePrototypeStore((state) => state.classroom)
  const joinClassroom = usePrototypeStore(
    (state) => state.joinClassroom,
  )
  const [name, setName] = useState('')

  const join = () => {
    if (!name.trim()) return
    joinClassroom(name)

    // The creator shares the link next; everyone else goes to the class.
    navigate(
      `/prototype/classroom/${classroomId ?? classroom.id}/${creating ? 'complete' : 'map'}`,
      { replace: true },
    )
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-form-shell"
      appBar={
        <AppBar
          title={classroom.name}
          leading={
            <IconButton
              label="이전으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/start')}
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          disabled={!name.trim()}
          onClick={join}
        >
          {creating ? '내 사물함 만들기' : '들어가기'}
        </Button>
      }
    >
      <main className="classroom-form">
        <section className="classroom-form__heading">
          {creating ? (
            <>
              <h1>
                친구들을 부르기 전에
                <br />
                내 사물함부터 만들어요.
              </h1>
              <p>
                입력한 이름이 사물함 이름표에 적혀요. 친구가 들어왔을 때 반이 비어 보이지 않아요.
              </p>
            </>
          ) : (
            <>
              <h1>
                여기서는 어떤 이름으로
                <br />
                불리면 될까요?
              </h1>
              <p>
                입력한 이름으로 내 사물함이 하나 생겨요.
              </p>
            </>
          )}
        </section>

        <TextField
          id="classroom-member-name"
          label="내 이름 또는 별명"
          placeholder="예: 지수"
          value={name}
          maxLength={12}
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      </main>
    </AppShell>
  )
}
