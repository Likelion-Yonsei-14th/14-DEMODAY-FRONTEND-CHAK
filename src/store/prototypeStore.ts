import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  emptyComposerDraft,
  emptyDeskCreationDraft,
  mockClassroom,
  mockCurrentUser,
  mockDesk,
} from '@/prototype/mock/initialState'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getFirstCardPage } from '@/features/composer/messagePages'
import {
  resolveDeskObjectType,
  resolveDeskZone,
  resolveInitialPlacement,
} from '@/features/supporter/supporterFlow'
import type {
  AuthProvider,
  AuthSession,
  BlackboardEntry,
  Classroom,
  ClassroomMember,
  Desk,
  DeskCreationDraft,
  DeskObjectType,
  DeskPlacement,
  Message,
  MessageDraft,
  MessageReaction,
  MessageReply,
  OwnerSettings,
  PrototypeUser,
  ReadMode,
  SupporterSettings,
} from '@/types'

type ClaimState = 'unclaimed' | 'claiming' | 'claimed'

type PrototypeState = {
  debugMode: boolean
  currentUser: PrototypeUser
  authSession: AuthSession
  currentDesk: Desk
  messages: Message[]
  composerDraft: MessageDraft
  deskCreationDraft: DeskCreationDraft
  claimReadMode: ReadMode
  claimState: ClaimState
  claimBacklogDeferred: boolean
  classroom: Classroom
  classroomMember: ClassroomMember | null
  ownerSettings: OwnerSettings
  messageReplies: MessageReply[]
  messageReactions: Partial<Record<string, MessageReaction>>
  supporterIdentityName: string | null
  supporterSettings: SupporterSettings
  publicHiddenMessageIds: string[]
  publicBlockedSupporters: string[]
  reportedMessageIds: string[]
  readMessageIds: string[]
  setDebugMode: (value: boolean) => void
  signIn: (email: string, provider?: AuthProvider) => void
  signUp: (displayName: string, email: string) => void
  signOut: () => void
  deleteAccount: () => void
  setDeskReadMode: (readMode: ReadMode) => void
  updateOwnerSettings: (patch: Partial<OwnerSettings>) => void
  toggleBlockedSupporter: (senderName: string) => void
  connectRoom: (code: string) => void
  endRoom: () => void
  sendMessageReply: (reply: Omit<MessageReply, 'id' | 'createdAt'>) => void
  reactToMessage: (
    messageId: string,
    reaction: MessageReaction,
  ) => void
  hidePublicMessage: (messageId: string) => void
  blockPublicSupporter: (senderName: string) => void
  reportMessage: (messageId: string) => void
  deleteOwnPublicMessage: (messageId: string) => void
  updateSupporterSettings: (
    patch: Partial<SupporterSettings>,
  ) => void
  setComposerDraft: (draft: MessageDraft) => void
  resetComposerDraft: () => void
  setDeskCreationDraft: (patch: Partial<DeskCreationDraft>) => void
  resetDeskCreationDraft: () => void
  createDeskFromDraft: () => void
  beginClaim: () => void
  setClaimReadMode: (readMode: ReadMode) => void
  completeClaim: () => void
  setClaimBacklogDeferred: (value: boolean) => void
  clearClaimBacklogDeferred: () => void
  addMessage: (message: Message) => void
  createClassroom: (name: string) => string
  joinClassroom: (displayName: string) => string
  addBlackboardEntry: (
    entry: Pick<BlackboardEntry, 'text' | 'drawingDataUrl'>,
  ) => void
  placeComposerMessageInLocker: (
    lockerId: string,
    placement?: DeskPlacement,
    representationType?: DeskObjectType,
    objectColor?: string,
  ) => void
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
      authSession: { status: 'anonymous' },
      currentDesk: mockDesk,
      messages: [],
      composerDraft: emptyComposerDraft,
      deskCreationDraft: emptyDeskCreationDraft,
      claimReadMode: mockDesk.readMode,
      claimState: 'claimed',
      claimBacklogDeferred: false,
      classroom: mockClassroom,
      classroomMember: null,
      ownerSettings: {
        publicFeedEnabled: true,
        pushEnabled: true,
        roomClosed: false,
        blockedSupporters: [],
        connectedRooms: [],
      },
      messageReplies: [],
      messageReactions: {},
      supporterIdentityName: null,
      supporterSettings: {
        defaultNickname: '',
        revealAfterExam: false,
        pushEnabled: true,
      },
      publicHiddenMessageIds: [],
      publicBlockedSupporters: [],
      reportedMessageIds: [],
      readMessageIds: [],
      setDebugMode: (debugMode) => set({ debugMode }),
      signIn: (email, provider = 'password') =>
        set({
          authSession: {
            status: 'authenticated',
            email: email.trim() || 'jisu@example.com',
            provider,
          },
        }),
      signUp: (displayName, email) =>
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            displayName: displayName.trim() || state.currentUser.displayName,
          },
          authSession: {
            status: 'authenticated',
            email: email.trim() || 'jisu@example.com',
            provider: 'password',
          },
        })),
      signOut: () =>
        set({
          authSession: { status: 'anonymous' },
        }),
      deleteAccount: () =>
        set({
          currentUser: mockCurrentUser,
          authSession: { status: 'anonymous' },
        }),
      setDeskReadMode: (readMode) =>
        set((state) => ({
          currentDesk: {
            ...state.currentDesk,
            readMode,
          },
        })),
      updateOwnerSettings: (patch) =>
        set((state) => ({
          ownerSettings: {
            ...state.ownerSettings,
            ...patch,
          },
        })),
      toggleBlockedSupporter: (senderName) =>
        set((state) => ({
          ownerSettings: {
            ...state.ownerSettings,
            blockedSupporters: state.ownerSettings.blockedSupporters.includes(
              senderName,
            )
              ? state.ownerSettings.blockedSupporters.filter(
                  (name) => name !== senderName,
                )
              : [
                  ...state.ownerSettings.blockedSupporters,
                  senderName,
                ],
          },
        })),
      connectRoom: (code) =>
        set((state) => {
          const normalized = code.trim().toUpperCase()
          if (!normalized) return state
          if (
            state.ownerSettings.connectedRooms.some(
              (room) => room.code === normalized,
            )
          ) {
            return state
          }

          return {
            ownerSettings: {
              ...state.ownerSettings,
              connectedRooms: [
                ...state.ownerSettings.connectedRooms,
                {
                  id: `connected-${Date.now().toString(36)}`,
                  name: `응원 공간 ${normalized}`,
                  code: normalized,
                },
              ],
            },
          }
        }),
      endRoom: () =>
        set((state) => ({
          ownerSettings: {
            ...state.ownerSettings,
            roomClosed: true,
          },
        })),
      sendMessageReply: (reply) =>
        set((state) => ({
          messageReplies: [
            ...state.messageReplies,
            {
              ...reply,
              id: `reply-${Date.now().toString(36)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      reactToMessage: (messageId, reaction) =>
        set((state) => ({
          messageReactions: {
            ...state.messageReactions,
            [messageId]:
              state.messageReactions[messageId] === reaction
                ? undefined
                : reaction,
          },
        })),
      hidePublicMessage: (messageId) =>
        set((state) => ({
          publicHiddenMessageIds: state.publicHiddenMessageIds.includes(
            messageId,
          )
            ? state.publicHiddenMessageIds
            : [...state.publicHiddenMessageIds, messageId],
        })),
      blockPublicSupporter: (senderName) =>
        set((state) => ({
          publicBlockedSupporters:
            state.publicBlockedSupporters.includes(senderName)
              ? state.publicBlockedSupporters
              : [...state.publicBlockedSupporters, senderName],
        })),
      reportMessage: (messageId) =>
        set((state) => ({
          reportedMessageIds: state.reportedMessageIds.includes(
            messageId,
          )
            ? state.reportedMessageIds
            : [...state.reportedMessageIds, messageId],
        })),
      updateSupporterSettings: (patch) =>
        set((state) => ({
          supporterSettings: {
            ...state.supporterSettings,
            ...patch,
          },
          composerDraft:
            typeof patch.defaultNickname === 'string'
              ? {
                  ...state.composerDraft,
                  senderName: patch.defaultNickname,
                }
              : state.composerDraft,
        })),
      deleteOwnPublicMessage: (messageId) =>
        set((state) => {
          const message = state.messages.find(
            (item) => item.id === messageId,
          )
          const ownMessage =
            Boolean(message) &&
            Boolean(state.supporterIdentityName) &&
            message?.senderName === state.supporterIdentityName
          const unread =
            message?.status !== 'read' &&
            !state.readMessageIds.includes(messageId)
          const deletable =
            ownMessage &&
            message?.visibility === 'public' &&
            unread

          if (!deletable) return state

          return {
            messages: state.messages.filter(
              (item) => item.id !== messageId,
            ),
            currentDesk: {
              ...state.currentDesk,
              objects: state.currentDesk.objects.filter(
                (object) => object.messageId !== messageId,
              ),
            },
            classroom: {
              ...state.classroom,
              lockers: state.classroom.lockers.map((locker) => ({
                ...locker,
                messageIds: locker.messageIds.filter(
                  (id) => id !== messageId,
                ),
                objects: locker.objects.filter(
                  (object) => object.messageId !== messageId,
                ),
              })),
            },
          }
        }),
      setComposerDraft: (composerDraft) => set({ composerDraft }),
      resetComposerDraft: () =>
        set((state) => ({
          composerDraft: {
            ...emptyComposerDraft,
            senderName:
              state.supporterSettings.defaultNickname ||
              state.supporterIdentityName ||
              '',
          },
        })),
      setDeskCreationDraft: (patch) =>
        set((state) => ({
          deskCreationDraft: {
            ...state.deskCreationDraft,
            ...patch,
          },
        })),
      resetDeskCreationDraft: () =>
        set({ deskCreationDraft: emptyDeskCreationDraft }),
      createDeskFromDraft: () =>
        set((state) => {
          const createdFor =
            state.deskCreationDraft.createdFor ?? 'self'
          const displayName =
            createdFor === 'self'
              ? state.currentUser.displayName
              : state.deskCreationDraft.recipientDisplayName.trim() || '친구'
          const claimStatus =
            createdFor === 'self' ? 'claimed' : 'unclaimed'

          return {
            currentDesk: {
              ...state.currentDesk,
              ownerId:
                createdFor === 'self'
                  ? state.currentUser.id
                  : undefined,
              creatorId: state.currentUser.id,
              displayName,
              createdFor,
              readMode: state.deskCreationDraft.readMode,
              objects: [],
              claimStatus,
            },
            messages: [],
            readMessageIds: [],
            claimReadMode: state.deskCreationDraft.readMode,
            claimState: claimStatus,
            claimBacklogDeferred: false,
          }
        }),
      beginClaim: () =>
        set((state) => ({
          claimReadMode: state.currentDesk.readMode,
          claimState:
            state.currentDesk.claimStatus === 'claimed'
              ? 'claimed'
              : 'claiming',
        })),
      setClaimReadMode: (claimReadMode) => set({ claimReadMode }),
      completeClaim: () =>
        set((state) => ({
          currentDesk: {
            ...state.currentDesk,
            ownerId:
              state.currentDesk.createdFor === 'other'
                ? 'user-claimed-recipient-01'
                : state.currentUser.id,
            readMode: state.claimReadMode,
            claimStatus: 'claimed',
          },
          claimState: 'claimed',
        })),
      setClaimBacklogDeferred: (claimBacklogDeferred) =>
        set({ claimBacklogDeferred }),
      clearClaimBacklogDeferred: () =>
        set({ claimBacklogDeferred: false }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      createClassroom: (name) => {
        const stamp = Date.now().toString(36)
        const classroomId = `classroom-${stamp}`

        set({
          classroom: {
            id: classroomId,
            name: name.trim() || '우리 반',
            blackboardMessageIds: [],
            blackboardEntries: [],
            lockers: [],
            dailyUnlockTime: '22:00',
          },
          classroomMember: null,
        })

        return classroomId
      },
      joinClassroom: (displayName) => {
        const stamp = Date.now().toString(36)
        const lockerId = `locker-${stamp}`
        const normalizedName = displayName.trim() || '친구'

        set((state) => ({
          classroom: {
            ...state.classroom,
            lockers: [
              ...state.classroom.lockers,
              {
                id: lockerId,
                studentName: normalizedName,
                messageIds: [],
                objects: [],
              },
            ],
          },
          classroomMember: {
            lockerId,
            displayName: normalizedName,
          },
        }))

        return lockerId
      },
      addBlackboardEntry: (entry) =>
        set((state) => {
          const stamp = Date.now().toString(36)
          const authorName =
            state.classroomMember?.displayName ??
            state.currentUser.displayName

          return {
            classroom: {
              ...state.classroom,
              blackboardEntries: [
                ...state.classroom.blackboardEntries,
                {
                  id: `board-entry-${stamp}`,
                  authorName,
                  text: entry.text.trim(),
                  drawingDataUrl: entry.drawingDataUrl,
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          }
        }),
      placeComposerMessageInLocker: (
        lockerId,
        placement,
        selectedRepresentationType,
        objectColor,
      ) =>
        set((state) => {
          const locker = state.classroom.lockers.find(
            (item) => item.id === lockerId,
          )
          if (!locker) return state

          const stamp = Date.now().toString(36)
          const messageId = `classroom-message-${stamp}`
          const objectId = `locker-object-${stamp}`
          const representationType =
            selectedRepresentationType ??
            resolveDeskObjectType(state.composerDraft)
          const finalPlacement =
            placement ??
            resolveInitialPlacement(locker.objects.length)
          const firstPage = getFirstCardPage(state.composerDraft)
          const previewColor = getComposerBackground(
            firstPage.backgroundAssetId,
          ).tone
          const senderName =
            state.classroomMember?.displayName ??
            state.composerDraft.senderName.trim() ??
            '친구'

          const message: Message = {
            ...state.composerDraft,
            id: messageId,
            senderName: senderName || '친구',
            recipientDeskId: locker.id,
            status: 'sent',
            createdAt: new Date().toISOString(),
            previewColor,
          }

          return {
            messages: [...state.messages, message],
            supporterIdentityName: message.senderName,
            classroom: {
              ...state.classroom,
              lockers: state.classroom.lockers.map((item) =>
                item.id === lockerId
                  ? {
                      ...item,
                      messageIds: [...item.messageIds, messageId],
                      objects: [
                        ...item.objects,
                        {
                          id: objectId,
                          messageId,
                          representationType,
                          color: objectColor,
                          zone: resolveDeskZone(item.objects.length),
                          order: item.objects.length,
                          locked: false,
                          ...finalPlacement,
                          zIndex: item.objects.length + 10,
                        },
                      ],
                    }
                  : item,
              ),
            },
            composerDraft: {
              ...emptyComposerDraft,
              senderName: state.supporterSettings.defaultNickname,
            },
          }
        }),
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
            supporterIdentityName: message.senderName,
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
            composerDraft: {
              ...emptyComposerDraft,
              senderName: state.supporterSettings.defaultNickname,
            },
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
        currentUser: state.currentUser,
        authSession: state.authSession,
        currentDesk: state.currentDesk,
        messages: state.messages,
        composerDraft: state.composerDraft,
        deskCreationDraft: state.deskCreationDraft,
        claimReadMode: state.claimReadMode,
        claimState: state.claimState,
        claimBacklogDeferred: state.claimBacklogDeferred,
        classroom: state.classroom,
        classroomMember: state.classroomMember,
        ownerSettings: state.ownerSettings,
        messageReplies: state.messageReplies,
        messageReactions: state.messageReactions,
        supporterIdentityName: state.supporterIdentityName,
        supporterSettings: state.supporterSettings,
        publicHiddenMessageIds: state.publicHiddenMessageIds,
        publicBlockedSupporters: state.publicBlockedSupporters,
        reportedMessageIds: state.reportedMessageIds,
        readMessageIds: state.readMessageIds,
      }),
    },
  ),
)
