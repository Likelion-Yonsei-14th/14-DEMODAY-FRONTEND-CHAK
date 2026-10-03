import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Lightbulb,
  RefreshCw,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  BottomSheet,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import {
  fitTextElementToBounds,
  getComposerBackground,
  getTextBounds,
} from './backgroundAssets'
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

const IDEA_PROMPT_SETS = [
  [
    '최근 둘이 제일 많이 웃었던 일은?',
    '수능 끝나면 제일 먼저 같이 하고 싶은 건?',
    '요즘 그 친구가 가장 자주 하는 말은?',
  ],
  [
    '같이 찍은 사진 중 가장 먼저 떠오르는 장면은?',
    '힘들 때도 그 친구답다고 느꼈던 순간은?',
    '지금 딱 하나만 해주고 싶은 말은?',
  ],
  [
    '오늘 그 친구는 지금쯤 뭘 하고 있을까?',
    '수능이 끝난 날 같이 먹고 싶은 건?',
    '둘만 아는 웃긴 일 하나를 떠올려볼까?',
  ],
] as const

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
  const [ideaOpen, setIdeaOpen] = useState(false)
  const [ideaSetIndex, setIdeaSetIndex] = useState(0)
  const [ideaPrompt, setIdeaPrompt] = useState<string | null>(null)
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
      textElements: [
        ...current.textElements,
        fitTextElementToBounds(
          nextText,
          getTextBounds(getComposerBackground(current.backgroundAssetId)),
        ),
      ],
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
        showToast('배경을 지운 사진을 추가했어요.')
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

  const focusMessageText = () => {
    setTool('text')
    setSelectedLayerId(
      selectedText?.id ?? primaryText?.id ?? null,
    )

    window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>(
        '.canvas-text-element__input',
      )?.focus()
    }, 120)
  }

  const chooseIdeaPrompt = (prompt: string) => {
    setIdeaPrompt(prompt)
    setIdeaOpen(false)
    focusMessageText()
  }

  const showNextIdeaSet = () => {
    setIdeaSetIndex(
      (current) => (current + 1) % IDEA_PROMPT_SETS.length,
    )
  }

  return (
    <>
      <AppShell
        surface="base"
        contentClassName="composer-shell"
        appBar={
          <AppBar
            title="응원 쓰기"
            leading={
              <IconButton
                label={`${recipientName}님의 책상으로 돌아가기`}
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

          <div className="composer-idea">
            {ideaPrompt ? (
              <div className="composer-idea__prompt">
                <span className="composer-idea__prompt-icon" aria-hidden>
                  <Lightbulb size={16} />
                </span>
                <span className="composer-idea__prompt-copy">
                  <small>생각해볼 거리</small>
                  <strong>{ideaPrompt}</strong>
                </span>
                <button
                  type="button"
                  className="composer-idea__dismiss"
                  aria-label="생각해볼 거리 닫기"
                  onClick={() => setIdeaPrompt(null)}
                >
                  <X size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  className="composer-idea__more"
                  onClick={() => setIdeaOpen(true)}
                >
                  다른 소재
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="composer-idea__entry"
                onClick={() => setIdeaOpen(true)}
              >
                <Lightbulb size={16} aria-hidden />
                무슨 말을 써야 할지 모르겠어요
              </button>
            )}
          </div>

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
            onBackgroundChange={(backgroundAssetId) => {
              // Keep existing text inside the new template's writing area
              const bounds = getTextBounds(
                getComposerBackground(backgroundAssetId),
              )
              updatePage({
                backgroundAssetId,
                textElements: page.textElements.map((element) =>
                  fitTextElementToBounds(element, bounds),
                ),
              })
            }}
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

      <BottomSheet
        open={ideaOpen}
        onClose={() => setIdeaOpen(false)}
        title="이런 얘기부터 떠올려볼까요?"
        description="하나 골라서 떠오르는 말부터 직접 써보세요."
      >
        <div className="composer-idea-sheet">
          <div className="composer-idea-sheet__list">
            {IDEA_PROMPT_SETS[ideaSetIndex]?.map((prompt) => (
              <button
                type="button"
                key={prompt}
                className="composer-idea-sheet__item"
                onClick={() => chooseIdeaPrompt(prompt)}
              >
                <span>{prompt}</span>
                <ArrowLeft
                  className="composer-idea-sheet__arrow"
                  size={17}
                  aria-hidden
                />
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            fullWidth
            leadingIcon={<RefreshCw size={16} aria-hidden />}
            onClick={showNextIdeaSet}
          >
            다른 소재 보기
          </Button>
        </div>
      </BottomSheet>

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
