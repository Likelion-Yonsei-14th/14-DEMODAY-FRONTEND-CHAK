import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppBar, Button, Dialog, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'

type NoticeProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
}

/** 아직 만들고 있는 기능을 눌렀을 때 뜨는 안내 팝업. */
export function ComingSoonDialog({ open, onClose, title, description }: NoticeProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description ?? '곧 열릴 예정이에요. 조금만 기다려 주세요.'}
      primaryAction={{ label: '확인', onClick: onClose, variant: 'brand' }}
    />
  )
}

/** 주소로 바로 들어왔을 때 보이는 "개발 중" 화면. */
export function ComingSoonPage({ title, description }: { title: string; description?: string }) {
  const navigate = useNavigate()
  return (
    <AppShell
      surface="base"
      appBar={
        <AppBar
          title={title}
          leading={
            <IconButton label="처음으로" icon={<ArrowLeft size={21} aria-hidden />} onClick={() => navigate('/', { replace: true })} />
          }
        />
      }
    >
      <main style={{ padding: 24, display: 'grid', gap: 14, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>{title}은 아직 개발 중이에요</h1>
        <p style={{ margin: 0 }}>{description ?? '곧 열릴 예정이에요. 조금만 기다려 주세요.'}</p>
        <Button variant="brand" fullWidth onClick={() => navigate('/', { replace: true })}>
          처음으로 돌아가기
        </Button>
      </main>
    </AppShell>
  )
}

export const PAYMENTS_NOTICE = {
  title: '결제는 아직 개발 중이에요',
  description: '찰떡 충전과 구매는 곧 열릴 예정이에요. 조금만 기다려 주세요.',
} as const

export const CLASSROOM_NOTICE = {
  title: '우리 반은 아직 개발 중이에요',
  description: '친구들과 함께 쓰는 교실은 곧 열릴 예정이에요. 지금은 응원 책상을 이용해 주세요.',
} as const
