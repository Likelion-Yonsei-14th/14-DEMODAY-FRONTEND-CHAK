import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton, useFeedback } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type {
  MessageVisibility,
  PhotoElement,
  TextElement,
} from '@/types'
import { VisibilitySheet } from '@/features/supporter/VisibilitySheet'
import { ComposerDock, type ComposerTool } from './ComposerDock'
import { ComposerToolTray } from './ComposerToolTray'
import { MessageCanvas } from './MessageCanvas'
import { processPhotoFile } from './photoUtils'
import './composer.css'

const FLOATING_PHOTO_LIMIT = 3

export function UnifiedComposerPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const draft = usePrototypeStore((state) => state.composerDraft)
  const setComposerDraft = usePrototypeStore((state) => state.setComposerDraft)
  const [tool, setTool] = useState<ComposerTool>('background')
  const [visibilityOpen, setVisibilityOpen] = useState(false)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    draft.textElements[0]?.id ?? null,
  )
  const didFocus = useRef(false)

  const primaryText = draft.textElements[0]
  const selectedText = draft.textElements.find(
    (element) => element.id === selectedLayerId,
  )
  const selectedPhoto = draft.photoElements.find(
    (photo) => photo.id === selectedLayerId,
  )

  const hasContent = useMemo(
    () =>
      draft.textElements.some((element) =>
        Boolean(element.text.trim()),
      ) ||
      draft.wordArtElements.length > 0 ||
      draft.stickerElements.length > 0 ||
      draft.photoElements.length > 0,
    [draft],
  )

  useEffect(() => {
    if (didFocus.current) return
    didFocus.current = true

    const timer = window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>(
        '.canvas-text-element__input',
      )?.focus()
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

  const updateSelectedText = (patch: Partial<TextElement>) => {
    if (!selectedText) return
    updateTextElement(selectedText.id, patch)
  }

  const addTextElement = () => {
    const base = selectedText ?? primaryText
    const index = draft.textElements.length
    const id = `text-${Date.now().toString(36)}-${index}`

    const nextText: TextElement = {
      id,
      text: '',
      fontId: base?.fontId ?? 'nanum-gim-yui',
      fontSize: base?.fontSize ?? 23,
      color: base?.color ?? '#3C3833',
      x: 50,
      y: Math.min(72, 38 + index * 11),
      width: base?.width ?? 76,
      zIndex: getFrontLayerZ(draft) + 1,
      align: base?.align ?? 'center',
    }

    setComposerDraft({
      ...draft,
      textElements: [...draft.textElements, nextText],
    })
    setSelectedLayerId(id)
    setTool('text')
  }

  const deleteTextElement = (id: string) => {
    setComposerDraft({
      ...draft,
      textElements: draft.textElements.filter(
        (element) => element.id !== id,
      ),
    })
    setSelectedLayerId(null)
  }

  const sendSelectedTextBackward = () => {
    if (!selectedText) return
    updateSelectedText({
      zIndex: Math.max(4, getBackLayerZ(draft) - 1),
    })
  }

  const bringSelectedTextForward = () => {
    if (!selectedText) return
    updateSelectedText({
      zIndex: Math.min(80, getFrontLayerZ(draft) + 1),
    })
  }

  const updateVisibility = (visibility: MessageVisibility) => {
    setComposerDraft({ ...draft, visibility })
  }

  const moveWordArt = (id: string, x: number, y: number) => {
    setComposerDraft({
      ...draft,
      wordArtElements: draft.wordArtElements.map((element) =>
        element.id === id ? { ...element, x, y } : element,
      ),
    })
  }

  const addPhoto = async (
    file: File,
    role: 'floating' | 'background',
  ) => {
    const floatingCount = draft.photoElements.filter(
      (photo) => photo.role === 'floating',
    ).length

    if (
      role === 'floating' &&
      floatingCount >= FLOATING_PHOTO_LIMIT
    ) {
      showToast('카드 위 사진은 최대 3장까지 올릴 수 있어요.')
      return
    }

    try {
      const processed = await processPhotoFile(file)
      const stamp = Date.now().toString(36)

      if (role === 'background') {
        const backgroundPhoto: PhotoElement = {
          id: `photo-background-${stamp}`,
          src: processed.src,
          role: 'background',
          x: 50,
          y: 50,
          scale: 1,
          rotation: 0,
          frame: 'plain',
          zIndex: 2,
          aspectRatio: processed.aspectRatio,
          hasTransparency: processed.hasTransparency,
          alt: '카드 배경 사진',
        }

        setComposerDraft({
          ...draft,
          photoElements: [
            ...draft.photoElements.filter(
              (photo) => photo.role !== 'background',
            ),
            backgroundPhoto,
          ],
        })
        setSelectedLayerId(backgroundPhoto.id)
        return
      }

      const index = floatingCount
      const photo: PhotoElement = {
        id: `photo-floating-${stamp}`,
        src: processed.src,
        role: 'floating',
        x: 50 + (index - 1) * 4,
        y: 43 + index * 7,
        scale: .86,
        rotation: [-4, 3, -2][index] ?? 0,
        frame: processed.hasTransparency ? 'plain' : 'white',
        zIndex: 10 + index,
        aspectRatio: processed.aspectRatio,
        hasTransparency: processed.hasTransparency,
        alt: '응원 카드에 넣은 사진',
      }

      setComposerDraft({
        ...draft,
        photoElements: [...draft.photoElements, photo],
      })
      setSelectedLayerId(photo.id)

      if (processed.hasTransparency) {
        showToast('투명 배경을 유지해서 사진을 추가했어요.')
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : '사진을 추가하지 못했어요.',
      )
    }
  }

  const updatePhoto = (
    id: string,
    patch: Partial<PhotoElement>,
  ) => {
    setComposerDraft({
      ...draft,
      photoElements: draft.photoElements.map((photo) =>
        photo.id === id ? { ...photo, ...patch } : photo,
      ),
    })
  }

  const deletePhoto = (id: string) => {
    setComposerDraft({
      ...draft,
      photoElements: draft.photoElements.filter(
        (photo) => photo.id !== id,
      ),
    })
    setSelectedLayerId(null)
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
        bottomNavigation={
          <ComposerDock
            value={tool}
            onChange={(nextTool) => {
              setTool(nextTool)

              if (nextTool === 'photo') {
                const latestPhoto = draft.photoElements.at(-1)
                if (latestPhoto) {
                  setSelectedLayerId(latestPhoto.id)
                }
              }
            }}
          />
        }
      >
        <div className="unified-composer">
          <MessageCanvas
            draft={draft}
            selectedId={selectedLayerId}
            onSelect={(id) => {
              setSelectedLayerId(id)

              if (
                id &&
                draft.textElements.some(
                  (element) => element.id === id,
                )
              ) {
                setTool('text')
              }
            }}
            onTextDone={() => setSelectedLayerId(null)}
            onTextChange={(id, text) =>
              updateTextElement(id, { text })
            }
            onTextMove={(id, x, y) =>
              updateTextElement(id, { x, y })
            }
            onTextResize={(id, width, x) =>
              updateTextElement(id, { width, x })
            }
            onWordArtMove={moveWordArt}
            onPhotoChange={updatePhoto}
          />

          <ComposerToolTray
            tool={tool}
            draft={draft}
            selectedText={selectedText}
            selectedPhoto={selectedPhoto}
            onBackgroundChange={(backgroundAssetId) =>
              setComposerDraft({ ...draft, backgroundAssetId })
            }
            onTextAdd={addTextElement}
            onTextSelect={(id) => {
              setSelectedLayerId(id)
              setTool('text')
            }}
            onTextFontChange={(fontId) =>
              updateSelectedText({ fontId })
            }
            onTextSizeChange={(fontSize) =>
              updateSelectedText({ fontSize })
            }
            onTextColorChange={(color) =>
              updateSelectedText({ color })
            }
            onTextAlignChange={(align) =>
              updateSelectedText({ align })
            }
            onTextSendBackward={sendSelectedTextBackward}
            onTextBringForward={bringSelectedTextForward}
            onTextDelete={() => {
              if (selectedText) {
                deleteTextElement(selectedText.id)
              }
            }}
            onPhotoAdd={addPhoto}
            onPhotoSelect={setSelectedLayerId}
            onPhotoUpdate={(patch) => {
              if (selectedPhoto) {
                updatePhoto(selectedPhoto.id, patch)
              }
            }}
            onPhotoDelete={() => {
              if (selectedPhoto) {
                deletePhoto(selectedPhoto.id)
              }
            }}
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


function getLayerZValues(draft: {
  textElements: TextElement[]
  photoElements: PhotoElement[]
  wordArtElements: Array<{ zIndex: number }>
  stickerElements: Array<{ zIndex: number }>
}) {
  return [
    ...draft.photoElements
      .filter((photo) => photo.role === 'floating')
      .map((photo) => photo.zIndex ?? 10),
    ...draft.wordArtElements.map((element) => element.zIndex),
    ...draft.stickerElements.map((element) => element.zIndex),
    ...draft.textElements.map(
      (element, index) => element.zIndex ?? 30 + index,
    ),
  ]
}

function getFrontLayerZ(draft: Parameters<typeof getLayerZValues>[0]) {
  const values = getLayerZValues(draft)
  return values.length > 0 ? Math.max(...values) : 30
}

function getBackLayerZ(draft: Parameters<typeof getLayerZValues>[0]) {
  const values = getLayerZValues(draft)
  return values.length > 0 ? Math.min(...values) : 10
}
