import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  emptyComposerDraft,
  mockClassroom,
  mockCurrentUser,
  mockDesk,
} from '@/prototype/mock/initialState'
import type { CanvasMode, Classroom, Desk, Message, MessageDraft, PrototypeUser } from '@/types'

type ClaimState = 'unclaimed' | 'claiming' | 'claimed'

type PrototypeState = {
  debugMode: boolean
  currentUser: PrototypeUser
  currentDesk: Desk
  messages: Message[]
  composerDraft: MessageDraft
  claimState: ClaimState
  classroom: Classroom
  setDebugMode: (value: boolean) => void
  setCanvasMode: (mode: CanvasMode) => void
  setComposerDraft: (draft: MessageDraft) => void
  resetComposerDraft: () => void
  addMessage: (message: Message) => void
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
      setDebugMode: (debugMode) => set({ debugMode }),
      setCanvasMode: (canvasMode) =>
        set((state) => ({
          composerDraft: { ...state.composerDraft, canvasMode },
        })),
      setComposerDraft: (composerDraft) => set({ composerDraft }),
      resetComposerDraft: () => set({ composerDraft: emptyComposerDraft }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
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
      }),
    },
  ),
)
