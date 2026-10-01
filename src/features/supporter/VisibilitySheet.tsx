import { Eye, LockKeyhole } from 'lucide-react'
import {
  BottomSheet,
  Button,
  ChoiceCard,
} from '@/design-system'
import type { MessageVisibility } from '@/types'

type VisibilitySheetProps = {
  open: boolean
  value: MessageVisibility
  recipientName: string
  onChange: (value: MessageVisibility) => void
  onClose: () => void
  onContinue: () => void
}

export function VisibilitySheet({
  open,
  value,
  recipientName,
  onChange,
  onClose,
  onContinue,
}: VisibilitySheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="누가 볼 수 있게 할까요?"
      description="한 번 놓고 간 뒤에는 공개 범위를 바꿀 수 없어요."
    >
      <div className="supporter-visibility">
        <ChoiceCard
          title="공개"
          description={`${recipientName}님과 이 책상을 방문한 친구들이 함께 볼 수 있어요.`}
          icon={<Eye size={21} aria-hidden />}
          selected={value === 'public'}
          onClick={() => onChange('public')}
        />
        <ChoiceCard
          title="비공개"
          description={`${recipientName}님만 열어볼 수 있어요.`}
          icon={<LockKeyhole size={21} aria-hidden />}
          selected={value === 'private'}
          onClick={() => onChange('private')}
        />
        <Button variant="brand" fullWidth onClick={onContinue}>
          책상에서 확인하기
        </Button>
      </div>
    </BottomSheet>
  )
}
