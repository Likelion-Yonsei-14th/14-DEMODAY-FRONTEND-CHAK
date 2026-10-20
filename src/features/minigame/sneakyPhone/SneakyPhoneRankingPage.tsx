import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Crown, House, LogIn, RotateCcw, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  RANKING_LIMIT,
  sneakyPhoneRankingApi,
  type SneakyPhoneRanking,
} from '@/api/sneakyPhoneRanking'
import { AppBar, Button, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  SNEAKY_PHONE_PATH,
  SNEAKY_PHONE_PLAY_PATH,
  SNEAKY_PHONE_RANKING_PATH,
} from './sneakyPhoneRoutes'
import { goToLogin } from './rankingLogin'
import './SneakyPhone.css'

type RankingState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; ranking: SneakyPhoneRanking }

const points = (score: number) => `${score.toLocaleString('ko-KR')}점`

function useSneakyPhoneRanking() {
  const signedIn = usePrototypeStore((state) => state.authSession.status === 'authenticated')
  const [state, setState] = useState<RankingState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    sneakyPhoneRankingApi
      .getRanking(RANKING_LIMIT)
      .then((ranking) => setState({ status: 'ready', ranking }))
      .catch(() => setState({ status: 'failed' }))
  }, [])

  // Signing in or out changes which row is "me", so reload on either.
  useEffect(load, [load, signedIn])

  return { state, signedIn, reload: load }
}

export function SneakyPhoneRankingPage() {
  const navigate = useNavigate()
  const { state, signedIn, reload } = useSneakyPhoneRanking()

  return (
    <AppShell
      surface="base"
      contentClassName="sneaky-shell"
      appBar={
        <AppBar
          title="몰폰 랭킹"
          leading={
            <IconButton
              label="게임 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(SNEAKY_PHONE_PATH)}
            />
          }
          trailing={
            <IconButton
              label="홈 화면으로 돌아가기"
              icon={<House size={20} aria-hidden />}
              onClick={() => navigate('/')}
            />
          }
        />
      }
      fixedAction={
        <MyRankBar
          signedIn={signedIn}
          me={state.status === 'ready' ? state.ranking.me : null}
          loading={state.status === 'loading'}
          onLogin={() => goToLogin(navigate, SNEAKY_PHONE_RANKING_PATH)}
          onPlay={() => navigate(SNEAKY_PHONE_PLAY_PATH)}
        />
      }
    >
      <div className="sneaky-ranking">
        <header className="sneaky-ranking__header">
          <span className="sneaky-tag">전체 랭킹</span>
          <h1>몰폰 고수 TOP {RANKING_LIMIT}</h1>
          <p>
            {state.status === 'ready' && state.ranking.totalPlayers > 0
              ? `${state.ranking.totalPlayers.toLocaleString('ko-KR')}명 참여 · `
              : ''}
            한 사람당 최고 점수로 순위를 매겨요
          </p>
        </header>

        {state.status === 'loading' && (
          <p className="sneaky-ranking__notice" role="status">
            랭킹을 불러오고 있어요...
          </p>
        )}

        {state.status === 'failed' && (
          <div className="sneaky-ranking__notice" role="alert">
            <p>랭킹을 불러오지 못했어요.</p>
            <Button
              variant="secondary"
              leadingIcon={<RotateCcw size={18} aria-hidden />}
              onClick={reload}
            >
              다시 시도
            </Button>
          </div>
        )}

        {state.status === 'ready' && state.ranking.entries.length === 0 && (
          <p className="sneaky-ranking__notice">
            아직 기록이 없어요. 첫 번째 주인공이 되어 보세요!
          </p>
        )}

        {state.status === 'ready' && state.ranking.entries.length > 0 && (
          <ol className="sneaky-ranking__list" aria-label="몰폰 랭킹">
            {state.ranking.entries.map((entry) => (
              <li
                key={`${entry.rank}-${entry.nickname}`}
                className={[
                  'sneaky-ranking__row',
                  entry.rank <= 3 ? `sneaky-ranking__row--top${entry.rank}` : '',
                  entry.isMe ? 'is-me' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="sneaky-ranking__rank">
                  {entry.rank === 1 ? <Crown size={16} aria-hidden /> : null}
                  {entry.rank}
                  <span className="sneaky-sr-only">위</span>
                </span>
                <span className="sneaky-ranking__name">
                  {entry.nickname}
                  {entry.isMe && <span className="sneaky-ranking__me">나</span>}
                </span>
                <span className="sneaky-ranking__score">{points(entry.score)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </AppShell>
  )
}

function MyRankBar({
  signedIn,
  me,
  loading,
  onLogin,
  onPlay,
}: {
  signedIn: boolean
  me: SneakyPhoneRanking['me']
  loading: boolean
  onLogin: () => void
  onPlay: () => void
}) {
  if (!signedIn) {
    return (
      <div className="sneaky-my-rank">
        <p>로그인하면 내 기록이 랭킹에 올라가요</p>
        <Button
          variant="brand"
          fullWidth
          leadingIcon={<LogIn size={18} aria-hidden />}
          onClick={onLogin}
        >
          로그인하기
        </Button>
      </div>
    )
  }

  return (
    <div className="sneaky-my-rank">
      {me ? (
        <p className="sneaky-my-rank__summary">
          <Trophy size={16} aria-hidden />
          내 순위 <strong>{me.rank.toLocaleString('ko-KR')}위</strong>
          <span aria-hidden>·</span>
          최고 {points(me.score)}
        </p>
      ) : (
        <p>{loading ? '내 순위를 확인하고 있어요' : '아직 내 기록이 없어요'}</p>
      )}
      <Button variant="brand" fullWidth onClick={onPlay}>
        {me ? '기록 갱신하러 가기' : '게임하고 랭킹에 올라가기'}
      </Button>
    </div>
  )
}
