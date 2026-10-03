import { BottomSheet, ChoiceCard } from '@/design-system'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import { deskStickers, type SupporterObjectChoice } from './deskStickers'

type ObjectChoiceSheetProps = {
  open: boolean
  recipientName: string
  onClose: () => void
  onChoose: (choice: SupporterObjectChoice) => void
}

const choices: {
  type: SupporterObjectChoice
  title: string
  description: (recipientName: string) => string
  color: string
}[] = [
  {
    type: 'letter',
    title: '편지',
    description: () => '하고 싶은 말을 카드에 써서 봉투에 담아요.',
    color: '#D8644A',
  },
  {
    type: 'charm',
    title: '부적',
    description: () =>
      '응원을 부적 안에 담아요. 평면 스티커는 무료, 아크릴 3D는 유료예요.',
    color: '#DD7D95',
  },
  {
    type: 'sticker',
    title: '스티커',
    description: (recipientName) =>
      `글 없이 스티커 하나만 붙이고 가요. 누가 붙였는지는 ${recipientName}님만 봐요.`,
    color: '#EDCB62',
  },
]

export function ObjectChoiceSheet({
  open,
  recipientName,
  onClose,
  onChoose,
}: ObjectChoiceSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="무엇을 놓고 갈까요?"
      description={`${recipientName}님 책상에 놓을 것을 골라요.`}
    >
      <div className="object-choice">
        {choices.map((choice) => (
          <ChoiceCard
            key={choice.type}
            title={choice.title}
            description={choice.description(recipientName)}
            icon={
              <span
                className={[
                  'placement-object-option__preview',
                  `desk-object--${choice.type}`,
                ].join(' ')}
                style={{
                  '--desk-object-color': choice.color,
                } as React.CSSProperties}
                aria-hidden
              >
                <DeskObjectVisual
                  type={choice.type}
                  assetId={
                    choice.type === 'sticker'
                      ? deskStickers[0]!.id
                      : choice.type === 'charm'
                        ? 'charm-yeot'
                        : undefined
                  }
                  material="flat"
                />
              </span>
            }
            onClick={() => onChoose(choice.type)}
          />
        ))}
      </div>
    </BottomSheet>
  )
}
