import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { useHomePath } from '@/app/homePath'
import { AppShell } from '@/layout/AppShell'
import type { RollingPaperLoadStatus } from './useRollingPaperLoad'
import './RollingPaperPages.css'

/** What a rolling paper page shows while it loads, when the class is gone, or when loading failed. */
export function RollingPaperLoadState({
  status,
  onRetry,
}: {
  status: Exclude<RollingPaperLoadStatus, 'ready'>
  onRetry: () => void
}) {
  const navigate = useNavigate()
  const homePath = useHomePath()

  return (
    <AppShell
      surface="base"
      contentClassName="rolling-paper-shell"
      appBar={
        <AppBar
          title="연말 롤링페이퍼"
          leading={
            <IconButton
              label="홈으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(homePath)}
            />
          }
        />
      }
    >
      <main className="rolling-paper-load" aria-live="polite">
        {status === 'loading' ? (
          <>
            <LoaderCircle className="rolling-paper-load__spinner" size={28} aria-hidden />
            <p>롤링페이퍼를 불러오고 있어요.</p>
          </>
        ) : status === 'missing' ? (
          <>
            <h1>롤링페이퍼를 찾을 수 없어요</h1>
            <p>링크가 잘못됐거나 반을 만든 사람이 반을 삭제했어요.</p>
            <Button variant="secondary" onClick={() => navigate('/rolling-paper/create')}>
              새 롤링페이퍼 만들기
            </Button>
          </>
        ) : (
          <>
            <h1>불러오지 못했어요</h1>
            <p>연결이 불안정해요. 잠시 후 다시 시도해 주세요.</p>
            <Button variant="secondary" onClick={onRetry}>
              다시 시도
            </Button>
          </>
        )}
      </main>
    </AppShell>
  )
}
