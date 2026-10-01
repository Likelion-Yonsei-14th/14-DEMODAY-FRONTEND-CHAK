import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBar, Button, IconButton, useFeedback } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type {
  MessageVisibility,
  PhotoElement,
  PositionedAsset,
  TextElement,
} from '@/types'
import { VisibilitySheet } from '@/features/supporter/VisibilitySheet'
import { ComposerDock, type ComposerTool } from './ComposerDock'
import { ComposerPageRail } from './ComposerPageRail'
import { ComposerToolTray } from './ComposerToolTray'
import { MessageCanvas } from './MessageCanvas'
import {
  appendContinuationPage,
  deleteDraftPage,
  getActiveCardPage,
  getMessagePages,
  hasDraftContent,
  selectDraftPage,
  updateDraftPage,
} from './messagePages'
import { processPhotoFile } from './photoUtils'
import './composer.css'

const FLOATING_PHOTO_LIMIT = 3

export function UnifiedComposerPage() {
  const navigate = useNavigate()
  const { classroomId, lockerId } = useParams()
  const { showToast } = useFeedback()
  const draft = usePrototypeStore((state) => state.composerDraft)
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const classroom = usePrototypeStore((state) => state.classroom)
  const setComposerDraft = usePrototypeStore((state) => state.setComposerDraft)
  const classroomLocker = classroom.lockers.find(
    (locker) => locker.id === lockerId,
  )
  const classroomMode = Boolean(classroomId && classroomLocker)
  const recipientName =
    classroomLocker?.studentName ?? currentDesk.displayName
  const backPath = classroomMode
    ? `/prototype/classroom/${classroomId}/locker/${lockerId}`
    : '/prototype/support/jisu'
  const placementPath = classroomMode
    ? `/prototype/classroom/${classroomId}/locker/${lockerId}/placement`
    : '/prototype/support/jisu/placement'
  const [tool, setTool] = useState<ComposerTool>('background')
  const [visibilityOpen, setVisibilityOpen] = useState(false)
  const page = getActiveCardPage(draft)
  const pages = getMessagePages(draft)
  const activePageId = draft.activePageId ?? page.id
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    page.textElements[0]?.id ?? null,
  )
  const [pageOverflow, setPageOverflow] = useState(false)
  const didFocus = useRef(false)

  const primaryText = page.textElements[0]
  const selectedText = page.textElements.find(
    (element) => element.id === selectedLayerId,
  )
  const selectedPhoto = page.photoElements.find(
    (photo) => photo.id === selectedLayerId,
  )
  const selectedSticker = page.stickerElements.find(
    (sticker) => sticker.id === selectedLayerId,
  )

  const hasContent = useMemo(
    () => hasDraftContent(draft),
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

  const updatePage = (
    patch:
      | Partial<typeof page>
      | ((current: typeof page) => typeof page),
  ) => {
    setComposerDraft(
      updateDraftPage(draft, activePageId, patch),
    )
  }

  const updateTextElement = (
    id: string,
    patch: Partial<TextElement>,
  ) => {
    updatePage((current) => ({
      ...current,
      textElements: current.textElements.map((element) =>
        element.id === id ? { ...element, ...patch } : element,
      ),
    }))
  }

  const updateSelectedText = (patch: Partial<TextElement>) => {
    if (!selectedText) return
    updateTextElement(selectedText.id, patch)
  }

  const addTextElement = () => {
    const base = selectedText ?? primaryText
    const index = page.textElements.length
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
      zIndex: getFrontLayerZ(page) + 1,
      align: base?.align ?? 'center',
    }

    updatePage((current) => ({
      ...current,
      textElements: [...current.textElements, nextText],
    }))
    setSelectedLayerId(id)
    setTool('text')
  }

  const deleteTextElement = (id: string) => {
    updatePage((current) => ({
      ...current,
      textElements: current.textElements.filter(
        (element) => element.id !== id,
      ),
    }))
    setSelectedLayerId(null)
  }

  const sendSelectedTextBackward = () => {
    if (!selectedText) return
    updateSelectedText({
      zIndex: Math.max(4, getBackLayerZ(page) - 1),
    })
  }

  const bringSelectedTextForward = () => {
    if (!selectedText) return
    updateSelectedText({
      zIndex: Math.min(80, getFrontLayerZ(page) + 1),
    })
  }

  const updateVisibility = (visibility: MessageVisibility) => {
    setComposerDraft({ ...draft, visibility })
  }

  const moveWordArt = (id: string, x: number, y: number) => {
    updatePage((current) => ({
      ...current,
      wordArtElements: current.wordArtElements.map((element) =>
        element.id === id ? { ...element, x, y } : element,
      ),
    }))
  }

  const addSticker = (assetId: string) => {
    const index = page.stickerElements.length
    const stamp = Date.now().toString(36)
    const id = `sticker-${stamp}-${index}`
    const offset = ((index % 3) - 1) * 7

    const sticker: PositionedAsset = {
      id,
      assetId,
      x: 50 + offset,
      y: 46 + Math.min(index, 2) * 7,
      scale: 1,
      rotation: [-6, 5, -2][index % 3] ?? 0,
      zIndex: Math.min(80, getFrontLayerZ(page) + 1),
    }

    updatePage((current) => ({
      ...current,
      stickerElements: [...current.stickerElements, sticker],
    }))
    setSelectedLayerId(id)
    setTool('sticker')
  }

  const updateSticker = (
    id: string,
    patch: Partial<PositionedAsset>,
  ) => {
    updatePage((current) => ({
      ...current,
      stickerElements: current.stickerElements.map((sticker) =>
        sticker.id === id ? { ...sticker, ...patch } : sticker,
      ),
    }))
  }

  const deleteSticker = (id: string) => {
    updatePage((current) => ({
      ...current,
      stickerElements: current.stickerElements.filter(
        (sticker) => sticker.id !== id,
      ),
    }))
    setSelectedLayerId(null)
  }

  const sendSelectedStickerBackward = () => {
    if (!selectedSticker) return
    updateSticker(selectedSticker.id, {
      zIndex: Math.max(4, getBackLayerZ(page) - 1),
    })
  }

  const bringSelectedStickerForward = () => {
    if (!selectedSticker) return
    updateSticker(selectedSticker.id, {
      zIndex: Math.min(80, getFrontLayerZ(page) + 1),
    })
  }

  const addPhoto = async (
    file: File,
    role: 'floating' | 'background',
  ) => {
    const floatingCount = page.photoElements.filter(
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

        updatePage((current) => ({
          ...current,
          photoElements: [
            ...current.photoElements.filter(
              (photo) => photo.role !== 'background',
            ),
            backgroundPhoto,
          ],
        }))
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
        zIndex: Math.min(80, getFrontLayerZ(page) + 1),
        aspectRatio: processed.aspectRatio,
        hasTransparency: processed.hasTransparency,
        alt: '응원 카드에 넣은 사진',
      }

      updatePage((current) => ({
        ...current,
        photoElements: [...current.photoElements, photo],
      }))
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
    updatePage((current) => ({
      ...current,
      photoElements: current.photoElements.map((photo) =>
        photo.id === id ? { ...photo, ...patch } : photo,
      ),
    }))
  }

  const deletePhoto = (id: string) => {
    updatePage((current) => ({
      ...current,
      photoElements: current.photoElements.filter(
        (photo) => photo.id !== id,
      ),
    }))
    setSelectedLayerId(null)
  }

  const sendSelectedPhotoBackward = () => {
    if (!selectedPhoto || selectedPhoto.role !== 'floating') return
    updatePhoto(selectedPhoto.id, {
      zIndex: Math.max(4, getBackLayerZ(page) - 1),
    })
  }

  const bringSelectedPhotoForward = () => {
    if (!selectedPhoto || selectedPhoto.role !== 'floating') return
    updatePhoto(selectedPhoto.id, {
      zIndex: Math.min(80, getFrontLayerZ(page) + 1),
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
                label={`${recipientName}님의 공간으로 돌아가기`}
                icon={<ArrowLeft size={21} aria-hidden />}
                onClick={() => navigate(backPath)}
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
              setSelectedLayerId(
                getPreferredLayerId(page, nextTool),
              )
            }}
          />
        }
      >
        <div className="unified-composer">
          <MessageCanvas
            draft={page}
            selectedId={selectedLayerId}
            onSelect={(id) => {
              setSelectedLayerId(id)

              if (
                id &&
                page.textElements.some(
                  (element) => element.id === id,
                )
              ) {
                setTool('text')
              } else if (
                id &&
                page.stickerElements.some(
                  (element) => element.id === id,
                )
              ) {
                setTool('sticker')
              } else if (
                id &&
                page.photoElements.some(
                  (element) => element.id === id,
                )
              ) {
                setTool('photo')
              } else if (
                id &&
                page.wordArtElements.some(
                  (element) => element.id === id,
                )
              ) {
                setTool('phrase')
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
            onStickerChange={updateSticker}
            onPhotoChange={updatePhoto}
            onOverflowChange={setPageOverflow}
          />

          <ComposerPageRail
            pages={pages}
            activePageId={activePageId}
            overflow={pageOverflow}
            onSelect={(pageId) => {
              const nextDraft = selectDraftPage(draft, pageId)
              const nextPage = getActiveCardPage(nextDraft)
              setComposerDraft(nextDraft)
              setSelectedLayerId(
                getPreferredLayerId(nextPage, tool),
              )
              setPageOverflow(false)
            }}
            onAdd={() => {
              const nextDraft = appendContinuationPage(draft)
              if (nextDraft === draft) return

              const nextPage = getActiveCardPage(nextDraft)
              setComposerDraft(nextDraft)
              setSelectedLayerId(nextPage.textElements[0]?.id ?? null)
              setTool('text')
              setPageOverflow(false)
            }}
            onDelete={() => {
              const nextDraft = deleteDraftPage(draft, activePageId)
              const nextPage = getActiveCardPage(nextDraft)
              setComposerDraft(nextDraft)
              setSelectedLayerId(
                getPreferredLayerId(nextPage, tool),
              )
              setPageOverflow(false)
            }}
          />

          <ComposerToolTray
            tool={tool}
            draft={page}
            selectedText={selectedText}
            selectedPhoto={selectedPhoto}
            selectedSticker={selectedSticker}
            onBackgroundChange={(backgroundAssetId) =>
              updatePage({ backgroundAssetId })
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
            onStickerAdd={addSticker}
            onStickerSelect={(id) => {
              setSelectedLayerId(id)
              setTool('sticker')
            }}
            onStickerSendBackward={sendSelectedStickerBackward}
            onStickerBringForward={bringSelectedStickerForward}
            onStickerDelete={() => {
              if (selectedSticker) {
                deleteSticker(selectedSticker.id)
              }
            }}
            onPhotoAdd={addPhoto}
            onPhotoSelect={(id) => {
              setSelectedLayerId(id)
              setTool('photo')
            }}
            onPhotoSendBackward={sendSelectedPhotoBackward}
            onPhotoBringForward={bringSelectedPhotoForward}
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
        recipientName={recipientName}
        onChange={updateVisibility}
        onClose={() => setVisibilityOpen(false)}
        onContinue={() => {
          setVisibilityOpen(false)
          navigate(placementPath)
        }}
      />
    </>
  )
}


function getPreferredLayerId(
  page: {
    textElements: TextElement[]
    photoElements: PhotoElement[]
    wordArtElements: PositionedAsset[]
    stickerElements: PositionedAsset[]
  },
  tool: ComposerTool,
) {
  if (tool === 'text') {
    return page.textElements.at(-1)?.id ?? null
  }

  if (tool === 'photo') {
    return page.photoElements.at(-1)?.id ?? null
  }

  if (tool === 'sticker') {
    return page.stickerElements.at(-1)?.id ?? null
  }

  if (tool === 'phrase') {
    return page.wordArtElements.at(-1)?.id ?? null
  }

  return null
}

function getLayerZValues(page: {
  textElements: TextElement[]
  photoElements: PhotoElement[]
  wordArtElements: Array<{ zIndex: number }>
  stickerElements: Array<{ zIndex: number }>
}) {
  return [
    ...page.photoElements
      .filter((photo) => photo.role === 'floating')
      .map((photo) => photo.zIndex ?? 10),
    ...page.wordArtElements.map((element) => element.zIndex),
    ...page.stickerElements.map((element) => element.zIndex),
    ...page.textElements.map(
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
