import { useEffect } from 'react'
import { useNavigate, useRouteError } from 'react-router-dom'
import { Button } from '@/design-system'
import { getLastReportId, reportError } from '@/lib/errorReporter'

/** Shown when a screen crashes. The team is told, and the user gets a code to quote. */
export function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  useEffect(() => {
    reportError({
      kind: 'render_error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }, [error])

  const reportId = getLastReportId()

  return (
    <main style={{ padding: 24, textAlign: 'center', display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>앗, 문제가 생겼어요</h1>
      <p style={{ margin: 0 }}>
        잠시 후 다시 시도해 주세요. 같은 문제가 계속되면 팀에 자동으로 알려져 있어요.
      </p>
      {reportId && <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>접수 코드 {reportId}</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        <Button variant="brand" fullWidth onClick={() => window.location.reload()}>
          새로고침
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate('/', { replace: true })}>
          처음으로
        </Button>
      </div>
    </main>
  )
}
