import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { MessageVisibility, PositionedAsset, TextElement } from '@/types'
import { VisibilitySheet } from '@/features/supporter/VisibilitySheet'
import { ComposerDock, type ComposerTool } from './ComposerDock'
import { ComposerToolTray } from './ComposerToolTray'
import { MessageCanvas } from './MessageCanvas'
import { getWordArtDefinition } from './wordArt/wordArtAssets'
import './composer.css'

export function UnifiedComposerPage() {
  const navigate = useNavigate()
  const draft = usePrototypeStore((state) => state.composerDraft)
  const setComposerDraft = usePrototypeStore((state) => state.setComposerDraft)
  const [tool, setTool] = useState<ComposerTool>('background')
  const [visibilityOpen, setVisibilityOpen] = useState(false)
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

  const updateVisibility = (visibility: MessageVisibility) => {
    setComposerDraft({ ...draft, visibility })
  }

  const addWordArt = (assetId: string) => {
    if (draft.wordArtElements.length >= 4) return

    const definition = getWordArtDefinition(assetId)
    if (!definition) return

    const index = draft.wordArtElements.length
    const element: PositionedAsset = {
      id: `word-art-${Date.now().toString(36)}-${index}`,
      assetId,
      x: 50,
      y: 31 + index * 12,
      scale: definition.defaultScale,
      rotation: index % 2 === 0 ? -2 : 2,
      zIndex: 20 + index,
    }

    setComposerDraft({
      ...draft,
      wordArtElements: [...draft.wordArtElements, element],
    })
  }

  const moveWordArt = (id: string, x: number, y: number) => {
    setComposerDraft({
      ...draft,
      wordArtElements: draft.wordArtElements.map((element) =>
        element.id === id ? { ...element, x, y } : element,
      ),
    })
  }

  return (
    <>
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
                onClick={() => setVisibilityOpen(true)}
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
            onWordArtMove={moveWordArt}
          />

          <ComposerToolTray
            tool={tool}
            draft={draft}
            onBackgroundChange={(backgroundAssetId) =>
              setComposerDraft({ ...draft, backgroundAssetId })
            }
            onTextStyleChange={(styleId) => updatePrimaryText({ styleId })}
            onTextAlignChange={(align) => updatePrimaryText({ align })}
            onWordArtAdd={addWordArt}
          />
        </div>
      </AppShell>

      <VisibilitySheet
        open={visibilityOpen}
        value={draft.visibility}
        onChange={updateVisibility}
        onClose={() => setVisibilityOpen(false)}
        onContinue={() => {
          setVisibilityOpen(false)
          navigate('/prototype/support/jisu/placement')
        }}
      />
    </>
  )
}
