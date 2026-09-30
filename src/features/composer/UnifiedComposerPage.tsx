import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton, useFeedback } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { TextElement } from '@/types'
import { ComposerDock, type ComposerTool } from './ComposerDock'
import { ComposerToolTray } from './ComposerToolTray'
import { MessageCanvas } from './MessageCanvas'
import './composer.css'

export function UnifiedComposerPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const draft = usePrototypeStore((state) => state.composerDraft)
  const setComposerDraft = usePrototypeStore((state) => state.setComposerDraft)
  const [tool, setTool] = useState<ComposerTool>('background')
  const didFocus = useRef(false)

  const primaryText = draft.textElements[0]
  const hasContent = useMemo(
    () =>
      Boolean(primaryText?.text.trim()) ||
      draft.wordArtElements.length > 0 ||
      draft.stickerElements.length > 0 ||
      draft.photoElements.length > 0,
    [draft, primaryText],
  )

  useEffect(() => {
    if (didFocus.current) return
    didFocus.current = true

    const timer = window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>('.canvas-text-element__input')?.focus()
    }, 280)

    return () => window.clearTimeout(timer)
  }, [])

  const updateTextElement = (
    id: string,
    patch: Partial<TextElement>,
  ) => {
    setComposerDraft({
      ...draft,
      textElements: draft.textElements.map((element) =>
        element.id === id ? { ...element, ...patch } : element,
      ),
    })
  }

  const updatePrimaryText = (patch: Partial<TextElement>) => {
    if (!primaryText) return
    updateTextElement(primaryText.id, patch)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="composer-shell"
      appBar={
        <AppBar
          title="응원 만들기"
          leading={
            <IconButton
              label="지수의 책상으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/support/jisu')}
            />
          }
          trailing={
            <Button
              size="m"
              variant="tertiary"
              disabled={!hasContent}
              onClick={() =>
                showToast(
                  hasContent
                    ? '다음 묶음에서 공개/비공개 선택과 Desk Preview를 연결할게요.'
                    : '먼저 지수에게 남길 말을 적어주세요.',
                )
              }
            >
              다음
            </Button>
          }
        />
      }
      bottomNavigation={<ComposerDock value={tool} onChange={setTool} />}
    >
      <div className="unified-composer">
        <header className="unified-composer__intro">
          <p>짧게 적어도, 사진을 넣어도, 마음껏 꾸며도 괜찮아요.</p>
        </header>

        <MessageCanvas
          draft={draft}
          onTextChange={(id, text) => updateTextElement(id, { text })}
          onTextMove={(id, x, y) => updateTextElement(id, { x, y })}
        />

        <ComposerToolTray
          tool={tool}
          draft={draft}
          onBackgroundChange={(backgroundAssetId) =>
            setComposerDraft({ ...draft, backgroundAssetId })
          }
          onTextStyleChange={(styleId) => updatePrimaryText({ styleId })}
          onTextAlignChange={(align) => updatePrimaryText({ align })}
        />
      </div>
    </AppShell>
  )
}
