import type { CardPage, MessageDraft, TextElement } from '@/types'

export const MAX_CARD_PAGES = 3

export function getMessagePages(
  message: Pick<
    MessageDraft,
    | 'id'
    | 'pages'
    | 'canvasMode'
    | 'backgroundAssetId'
    | 'textElements'
    | 'wordArtElements'
    | 'stickerElements'
    | 'photoElements'
  >,
): CardPage[] {
  if (message.pages?.length) return message.pages

  return [
    {
      id: `${message.id}-page-1`,
      canvasMode: message.canvasMode,
      backgroundAssetId: message.backgroundAssetId,
      textElements: message.textElements,
      wordArtElements: message.wordArtElements,
      stickerElements: message.stickerElements,
      photoElements: message.photoElements,
    },
  ]
}

export function getActiveCardPage(draft: MessageDraft) {
  const pages = getMessagePages(draft)
  return (
    pages.find((page) => page.id === draft.activePageId) ??
    pages[0]!
  )
}

export function getFirstCardPage(draft: MessageDraft) {
  return getMessagePages(draft)[0]!
}

export function updateDraftPage(
  draft: MessageDraft,
  pageId: string,
  updater:
    | Partial<CardPage>
    | ((page: CardPage) => CardPage),
): MessageDraft {
  const pages = getMessagePages(draft)
  const nextPages = pages.map((page) => {
    if (page.id !== pageId) return page
    return typeof updater === 'function'
      ? updater(page)
      : { ...page, ...updater }
  })
  const activePageId =
    draft.activePageId && nextPages.some((page) => page.id === draft.activePageId)
      ? draft.activePageId
      : nextPages[0]!.id
  const activePage =
    nextPages.find((page) => page.id === activePageId) ??
    nextPages[0]!

  return {
    ...draft,
    ...pageSnapshot(activePage),
    pages: nextPages,
    activePageId,
  }
}

export function selectDraftPage(
  draft: MessageDraft,
  pageId: string,
): MessageDraft {
  const pages = getMessagePages(draft)
  const page = pages.find((item) => item.id === pageId)
  if (!page) return draft

  return {
    ...draft,
    ...pageSnapshot(page),
    pages,
    activePageId: page.id,
  }
}

export function appendContinuationPage(
  draft: MessageDraft,
): MessageDraft {
  const pages = getMessagePages(draft)
  if (pages.length >= MAX_CARD_PAGES) return draft

  const source = getActiveCardPage(draft)
  const lastText = source.textElements.at(-1)
  const stamp = Date.now().toString(36)
  const pageId = `${draft.id}-page-${pages.length + 1}-${stamp}`
  const textId = `text-${stamp}-page-${pages.length + 1}`

  const continuationText: TextElement = {
    id: textId,
    text: '',
    styleId: lastText?.styleId,
    fontId: lastText?.fontId ?? 'nanum-gim-yui',
    fontSize: lastText?.fontSize ?? 23,
    color: lastText?.color ?? '#3C3833',
    x: 50,
    y: 50,
    width: lastText?.width ?? 76,
    zIndex: 30,
    align: lastText?.align ?? 'center',
  }

  const nextPage: CardPage = {
    id: pageId,
    canvasMode: 'standard',
    backgroundAssetId: source.backgroundAssetId,
    textElements: [continuationText],
    wordArtElements: [],
    stickerElements: [],
    photoElements: [],
  }

  return {
    ...draft,
    ...pageSnapshot(nextPage),
    pages: [...pages, nextPage],
    activePageId: pageId,
  }
}

export function deleteDraftPage(
  draft: MessageDraft,
  pageId: string,
): MessageDraft {
  const pages = getMessagePages(draft)
  if (pages.length <= 1) return draft

  const deletedIndex = pages.findIndex((page) => page.id === pageId)
  if (deletedIndex < 0) return draft

  const nextPages = pages.filter((page) => page.id !== pageId)
  const nextIndex = Math.min(
    Math.max(0, deletedIndex - 1),
    nextPages.length - 1,
  )
  const nextPage = nextPages[nextIndex]!

  return {
    ...draft,
    ...pageSnapshot(nextPage),
    pages: nextPages,
    activePageId: nextPage.id,
  }
}

export function hasDraftContent(draft: MessageDraft) {
  return getMessagePages(draft).some(
    (page) =>
      page.textElements.some((element) => Boolean(element.text.trim())) ||
      page.wordArtElements.length > 0 ||
      page.stickerElements.length > 0 ||
      page.photoElements.length > 0,
  )
}


function pageSnapshot(page: CardPage): Omit<CardPage, 'id'> {
  return {
    canvasMode: page.canvasMode,
    backgroundAssetId: page.backgroundAssetId,
    textElements: page.textElements,
    wordArtElements: page.wordArtElements,
    stickerElements: page.stickerElements,
    photoElements: page.photoElements,
  }
}
