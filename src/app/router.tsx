import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from '@/app/App'
import { UnifiedComposerPage } from '@/features/composer/UnifiedComposerPage'
import { StickerPickPage } from '@/features/supporter/StickerPickPage'
import {
  ClaimBacklogPage,
  ClaimCompletePage,
  ClaimIntroPage,
  ClaimReadModePage,
} from '@/features/claim/ClaimPages'
import { OwnerDeskPage } from '@/features/owner/OwnerDeskPage'
import {
  DeskCreateCompletePage,
  DeskCreateReadModePage,
  DeskCreateRecipientPage,
  DeskCreateWhoPage,
} from '@/features/deskCreation/DeskCreationPages'
import { EnvelopeStackPage } from '@/features/supporter/EnvelopeStackPage'
import { MessageViewerPage } from '@/features/supporter/MessageViewerPage'
import {
  MessageReplyPage,
  SupporterRepliesPage,
} from '@/features/reply/ReplyPages'
import { PlacementPreviewPage } from '@/features/supporter/PlacementPreviewPage'
import { SupportCompletePage } from '@/features/supporter/SupportCompletePage'
import { SupportDeskPage } from '@/features/supporter/SupportDeskPage'
import { SentMessagesPage } from '@/features/supporter/SentMessagesPage'
import { SupporterSettingsPage } from '@/features/supporter/SupporterSettingsPage'
import { StartPage } from '@/features/start/StartPage'
import { HomePage } from '@/features/start/HomePage'
import {
  GuessGodIntroPage,
  GuessGodPlayPage,
  GuessGodResultPage,
} from '@/features/minigame/guessGod/GuessGodPages'
import { OwnerDeskGate, SupporterDeskGate } from '@/api/DeskGates'
import {
  GoogleCallbackPage,
  KakaoCallbackPage,
} from '@/features/account/OAuthCallbackPages'
import { WelcomePage } from '@/features/start/WelcomePage'
import {
  AccountPage,
  DeleteAccountCompletePage,
  DeleteAccountPage,
  LoginPage,
  ResetPasswordCompletePage,
  ResetPasswordNewPage,
  ResetPasswordPage,
  SignupPage,
} from '@/features/account/AccountPages'
import {
  BlockedSupportersPage,
  ConnectRoomsPage,
  CreatorManagementPage,
  DeskSettingsPage,
  EndRoomPage,
} from '@/features/management/DeskManagementPages'
import {
  OfferCouponPage,
  OfferDetailPage,
  OffersPage,
  WrappedFriendsPage,
  WrappedHomePage,
  WrappedInsightPage,
  WrappedIntroPage,
  WrappedRecordsPage,
  WrappedSharePage,
} from '@/features/wrapped/WrappedPages'
import {
  ClassroomCreateCompletePage,
  ClassroomCreatePage,
  ClassroomEntryRedirect,
  ClassroomJoinPage,
} from '@/features/classroom/ClassroomCreationPages'
import { ClassroomMapPage } from '@/features/classroom/ClassroomMapPage'
import { ClassroomSettingsPage } from '@/features/classroom/ClassroomSettingsPage'
import {
  ClassWrappedPage,
  ClassWrappedSharePage,
} from '@/features/classroom/ClassWrappedPages'
import {
  BlackboardPage,
  BlackboardWritePage,
} from '@/features/classroom/BlackboardPages'
import {
  ClassroomLockerCompletePage,
  ClassroomLockerPage,
  ClassroomLockerPlacementPage,
} from '@/features/classroom/LockerPages'
import { LockerStickerPickPage } from '@/features/classroom/LockerStickerPage'
import { LockerCharmPickPage } from '@/features/classroom/LockerCharmPickPage'
import { CharmPickPage } from '@/features/supporter/CharmPickPage'
import { LockerDecoratePage } from '@/features/classroom/LockerDecoratePage'
import { PrototypeIndexPage } from '@/prototype/screens/PrototypeIndexPage'
import {
  ComposerPage,
  ReaderPage,
} from '@/prototype/screens/flowPages'
import { SystemPage } from '@/system/SystemPage'
import { ChargePage } from '@/features/chaltteok/ChargePage'
import {
  ChargeFailPage,
  ChargeSuccessPage,
} from '@/features/chaltteok/ChargeResultPages'
import {
  StudyTypeIntroPage,
  StudyTypeResultPage,
  StudyTypeTestPage,
} from '@/features/minigame/studyType/StudyTypePages'

// Only the bare entry point (`/`) branches on auth: WelcomePage sends a
// signed-in visitor to the two-door /home and shows everyone else the
// welcome screen. /start itself stays reachable regardless of auth state.
export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <WelcomePage /> },
      { path: '/start', element: <StartPage /> },
      { path: '/home', element: <HomePage /> },
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/kakao/callback', element: <KakaoCallbackPage /> },
      { path: '/auth/google/callback', element: <GoogleCallbackPage /> },
      { path: '/auth/signup', element: <SignupPage /> },
      {
        path: '/auth/reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: '/auth/reset-password/new',
        element: <ResetPasswordNewPage />,
      },
      {
        path: '/auth/reset-password/complete',
        element: <ResetPasswordCompletePage />,
      },
      { path: '/account', element: <AccountPage /> },
      { path: '/account/delete', element: <DeleteAccountPage /> },
      {
        path: '/account/delete/complete',
        element: <DeleteAccountCompletePage />,
      },
      { path: '/prototype', element: <PrototypeIndexPage /> },

      { path: '/prototype/create', element: <DeskCreateWhoPage /> },
      {
        path: '/prototype/create/recipient',
        element: <DeskCreateRecipientPage />,
      },
      {
        path: '/prototype/create/read-mode',
        element: <DeskCreateReadModePage />,
      },
      {
        path: '/prototype/create/complete',
        element: <DeskCreateCompletePage />,
      },

      // Canonical supporter desk routes, keyed by supporter token (the
      // backend looks a desk up by this). `/prototype/support/jisu*` below
      // stays mounted at the same components so old links keep working,
      // but every link this app generates now points here.
      {
        path: '/desk/:supporterToken',
        element: <SupporterDeskGate />,
        children: [
          { index: true, element: <SupportDeskPage /> },
          { path: 'compose', element: <UnifiedComposerPage /> },
          { path: 'charm', element: <CharmPickPage /> },
          { path: 'sticker', element: <StickerPickPage /> },
          { path: 'placement', element: <PlacementPreviewPage /> },
          { path: 'complete', element: <SupportCompletePage /> },
          {
            path: 'cards',
            element: <Navigate to="/prototype/my/desk/cards" replace />,
          },
          { path: 'message/:messageId', element: <MessageViewerPage /> },
          { path: 'replies', element: <SupporterRepliesPage /> },
          { path: 'sent', element: <SentMessagesPage /> },
          { path: 'settings', element: <SupporterSettingsPage /> },
        ],
      },

      { path: '/prototype/support/jisu', element: <SupportDeskPage /> },
      {
        path: '/prototype/support/jisu/compose',
        element: <UnifiedComposerPage />,
      },
      {
        path: '/prototype/support/jisu/charm',
        element: <CharmPickPage />,
      },
      {
        path: '/prototype/support/jisu/sticker',
        element: <StickerPickPage />,
      },
      {
        path: '/prototype/support/jisu/placement',
        element: <PlacementPreviewPage />,
      },
      {
        path: '/prototype/support/jisu/complete',
        element: <SupportCompletePage />,
      },

      {
        element: <OwnerDeskGate />,
        children: [
          { path: '/prototype/my/desk', element: <OwnerDeskPage /> },
          { path: '/prototype/my/desk/cards', element: <EnvelopeStackPage /> },
          { path: '/prototype/my/settings', element: <DeskSettingsPage /> },
          {
            path: '/prototype/my/settings/blocked',
            element: <BlockedSupportersPage />,
          },
          {
            path: '/prototype/my/settings/connect',
            element: <ConnectRoomsPage />,
          },
          {
            path: '/prototype/my/settings/end',
            element: <EndRoomPage />,
          },
          {
            path: '/prototype/my/message/:messageId',
            element: <MessageViewerPage />,
          },
          {
            path: '/prototype/my/message/:messageId/reply',
            element: <MessageReplyPage />,
          },
        ],
      },
      {
        path: '/prototype/desk',
        element: <Navigate to="/prototype/my/desk" replace />,
      },
      {
        path: '/prototype/support/jisu/cards',
        element: <Navigate to="/prototype/my/desk/cards" replace />,
      },
      {
        path: '/prototype/support/jisu/message/:messageId',
        element: <MessageViewerPage />,
      },
      {
        path: '/prototype/support/jisu/replies',
        element: <SupporterRepliesPage />,
      },
      {
        path: '/prototype/support/jisu/sent',
        element: <SentMessagesPage />,
      },
      {
        path: '/prototype/support/jisu/settings',
        element: <SupporterSettingsPage />,
      },

      { path: '/prototype/composer', element: <ComposerPage /> },
      { path: '/prototype/reader', element: <ReaderPage /> },
      { path: '/prototype/manage', element: <CreatorManagementPage /> },
      { path: '/prototype/claim', element: <ClaimIntroPage /> },
      {
        path: '/prototype/claim/backlog',
        element: <ClaimBacklogPage />,
      },
      {
        path: '/prototype/claim/read-mode',
        element: <ClaimReadModePage />,
      },
      {
        path: '/prototype/claim/complete',
        element: <ClaimCompletePage />,
      },
      {
        path: '/prototype/classroom',
        element: <ClassroomEntryRedirect />,
      },
      {
        path: '/prototype/classroom/create',
        element: <ClassroomCreatePage />,
      },
      {
        path: '/prototype/classroom/:classroomId/complete',
        element: <ClassroomCreateCompletePage />,
      },
      {
        path: '/prototype/classroom/:classroomId/join',
        element: <ClassroomJoinPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/map',
        element: <ClassroomMapPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/settings',
        element: <ClassroomSettingsPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/wrapped',
        element: <ClassWrappedPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/wrapped/share',
        element: <ClassWrappedSharePage />,
      },
      {
        path: '/prototype/classroom/:classroomId/blackboard',
        element: <BlackboardPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/blackboard/write',
        element: <BlackboardWritePage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId',
        element: <ClassroomLockerPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId/compose',
        element: <UnifiedComposerPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId/decorate',
        element: <LockerDecoratePage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId/charm',
        element: <LockerCharmPickPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId/sticker',
        element: <LockerStickerPickPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId/placement',
        element: <ClassroomLockerPlacementPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId/complete',
        element: <ClassroomLockerCompletePage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId/message/:messageId',
        element: <MessageViewerPage />,
      },
      {
        path: '/prototype/classroom/:classroomId/locker/:lockerId/message/:messageId/reply',
        element: <MessageReplyPage />,
      },
      { path: '/prototype/wrapped', element: <WrappedHomePage /> },
      {
        path: '/prototype/wrapped/intro',
        element: <WrappedIntroPage />,
      },
      {
        path: '/prototype/wrapped/insight',
        element: <WrappedInsightPage />,
      },
      {
        path: '/prototype/wrapped/friends',
        element: <WrappedFriendsPage />,
      },
      {
        path: '/prototype/wrapped/records',
        element: <WrappedRecordsPage />,
      },
      {
        path: '/prototype/wrapped/share',
        element: <WrappedSharePage />,
      },
      { path: '/prototype/offers', element: <OffersPage /> },
      {
        path: '/prototype/offers/:offerId',
        element: <OfferDetailPage />,
      },
      {
        path: '/prototype/offers/:offerId/coupon',
        element: <OfferCouponPage />,
      },
      { path: '/minigame/study-type', element: <StudyTypeIntroPage /> },
      { path: '/minigame/study-type/test', element: <StudyTypeTestPage /> },
      {
        path: '/minigame/study-type/result/:slug',
        element: <StudyTypeResultPage />,
      },
      { path: '/system', element: <SystemPage /> },
      { path: '/chaltteok/charge', element: <ChargePage /> },
      { path: '/chaltteok/charge/success', element: <ChargeSuccessPage /> },
      { path: '/chaltteok/charge/fail', element: <ChargeFailPage /> },
      { path: '/minigame/guess-god', element: <GuessGodIntroPage /> },
      { path: '/minigame/guess-god/play', element: <GuessGodPlayPage /> },
      {
        path: '/minigame/guess-god/result/:score',
        element: <GuessGodResultPage />,
      },
      { path: '*', element: <Navigate to="/start" replace /> },
    ],
  },
])
