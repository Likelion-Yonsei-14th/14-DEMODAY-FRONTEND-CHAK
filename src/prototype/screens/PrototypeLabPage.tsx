import { useState } from 'react'
import { FlaskConical, ScrollText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import {
  isPrototypeUnlocked,
  isRollingPaperReleased,
  setPrototypeUnlocked,
} from '@/lib/featureFlags'
import '@/features/classroom/Classroom.css'

/**
 * chak.live/prototype: 정식으로 열기 전 기능을 운영 서버에서 미리 써 보는 테스트 모드.
 * 켜면 이 브라우저에서만 열리고, 테스트 중에 보낸 링크(?prototype=1)로 들어온 사람도 켜진다.
 */
export function PrototypeLabPage() {
  const navigate = useNavigate()
  const [on, setOn] = useState(isPrototypeUnlocked)

  const start = (path: string) => {
    setPrototypeUnlocked(true)
    setOn(true)
    navigate(path)
  }

  const stop = () => {
    setPrototypeUnlocked(false)
    setOn(false)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-form-shell"
      appBar={<AppBar title="테스트 모드" />}
      fixedAction={
        on ? (
          <Button variant="secondary" fullWidth onClick={stop}>
            테스트 모드 끄기
          </Button>
        ) : undefined
      }
    >
      <main className="classroom-form">
        <span className="classroom-form__icon" aria-hidden>
          <FlaskConical size={24} />
        </span>
        <section className="classroom-form__heading">
          <h1>
            정식으로 열기 전에
            <br />
            미리 써 보는 곳이에요.
          </h1>
          <p>
            테스트 모드를 켠 브라우저에서만 열려요. 테스트 중에 보낸 초대 링크로 들어온
            사람도 함께 테스트할 수 있어요. 여기서 만든 롤링페이퍼와 글은 실제 서버에
            저장돼요.
          </p>
          <p>{on ? '지금 이 브라우저는 테스트 모드예요.' : '아직 테스트 모드가 꺼져 있어요.'}</p>
        </section>

        <Button
          variant="brand"
          fullWidth
          leadingIcon={<ScrollText size={18} aria-hidden />}
          onClick={() => start('/rolling-paper/create')}
        >
          연말 롤링페이퍼 만들어 보기
        </Button>
        <Button variant="secondary" fullWidth onClick={() => start('/home')}>
          홈 화면에서 보기
        </Button>
        {isRollingPaperReleased() && (
          <p className="rolling-paper-page__hint">연말 롤링페이퍼는 이미 정식으로 열려 있어요.</p>
        )}
      </main>
    </AppShell>
  )
}
