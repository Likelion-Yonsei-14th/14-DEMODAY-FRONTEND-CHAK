import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  emptyComposerDraft,
  mockClassroom,
  mockCurrentUser,
  mockDesk,
} from '@/prototype/mock/initialState'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getFirstCardPage, updateDraftPage } from '@/features/composer/messagePages'
import {
  resolveDeskObjectType,
  resolveDeskZone,
  resolveInitialPlacement,
} from '@/features/supporter/supporterFlow'
import type {
  CanvasMode,
  Classroom,
  Desk,
  DeskObjectType,
  DeskPlacement,
  Message,
  MessageDraft,
  PrototypeUser,
} from '@/types'

type ClaimState = 'unclaimed' | 'claiming' | 'claimed'

type PrototypeState = {
  debugMode: boolean
  currentUser: PrototypeUser
  currentDesk: Desk
  messages: Message[]
  composerDraft: MessageDraft
  claimState: ClaimState
  classroom: Classroom
  readMessageIds: string[]
  setDebugMode: (value: boolean) => void
  setCanvasMode: (mode: CanvasMode) => void
  setComposerDraft: (draft: MessageDraft) => void
  resetComposerDraft: () => void
  addMessage: (message: Message) => void
  placeComposerMessage: (
    placement?: DeskPlacement,
    representationType?: DeskObjectType,
    objectColor?: string,
  ) => void
  markMessageRead: (messageId: string) => void
  setClaimState: (state: ClaimState) => void
}

export const usePrototypeStore = create<PrototypeState>()(
  persist(
    (set) => ({
      debugMode: false,
      currentUser: mockCurrentUser,
      currentDesk: mockDesk,
      messages: [],
      composerDraft: emptyComposerDraft,
      claimState: 'claimed',
      classroom: mockClassroom,
      readMessageIds: [],
      setDebugMode: (debugMode) => set({ debugMode }),
      setCanvasMode: (canvasMode) =>
        set((state) => ({
          composerDraft: updateDraftPage(
            state.composerDraft,
            state.composerDraft.activePageId ??
              state.composerDraft.pages?.[0]?.id ??
              `${state.composerDraft.id}-page-1`,
            { canvasMode },
          ),
        })),
      setComposerDraft: (composerDraft) => set({ composerDraft }),
      resetComposerDraft: () => set({ composerDraft: emptyComposerDraft }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      placeComposerMessage: (
        placement,
        selectedRepresentationType,
        objectColor,
      ) =>
        set((state) => {
          const stamp = Date.now().toString(36)
          const messageId = `message-${stamp}`
          const objectId = `desk-object-${stamp}`
          const representationType =
            selectedRepresentationType ??
            resolveDeskObjectType(state.composerDraft)
          const zone = resolveDeskZone(state.currentDesk.objects.length)
          const finalPlacement =
            placement ?? resolveInitialPlacement(state.currentDesk.objects.length)
          const firstPage = getFirstCardPage(state.composerDraft)
          const previewColor = getComposerBackground(
            firstPage.backgroundAssetId,
          ).tone

          const message: Message = {
            ...state.composerDraft,
            id: messageId,
            senderName:
              state.composerDraft.senderName.trim() || '익명의 친구',
            recipientDeskId: state.currentDesk.id,
            status: 'sent',
            createdAt: new Date().toISOString(),
            previewColor,
          }

          return {
            messages: [...state.messages, message],
            currentDesk: {
              ...state.currentDesk,
              objects: [
                ...state.currentDesk.objects,
                {
                  id: objectId,
                  messageId,
                  representationType,
                  color: objectColor,
                  zone,
                  order: state.currentDesk.objects.length,
                  locked: state.composerDraft.visibility === 'private',
                  ...finalPlacement,
                  zIndex: state.currentDesk.objects.length + 10,
                },
              ],
            },
            composerDraft: emptyComposerDraft,
          }
        }),
      markMessageRead: (messageId) =>
        set((state) => {
          const nextIds = state.readMessageIds.includes(messageId)
            ? state.readMessageIds
            : [...state.readMessageIds, messageId]

          return {
            readMessageIds: nextIds,
            messages: state.messages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    status: 'read',
                    readAt: message.readAt ?? new Date().toISOString(),
                  }
                : message,
            ),
          }
        }),
      setClaimState: (claimState) => set({ claimState }),
    }),
    {
      name: 'eun-demoday-prototype',
      partialize: (state) => ({
        debugMode: state.debugMode,
        currentDesk: state.currentDesk,
        messages: state.messages,
        composerDraft: state.composerDraft,
        claimState: state.claimState,
        readMessageIds: state.readMessageIds,
      }),
    },
  ),
)
