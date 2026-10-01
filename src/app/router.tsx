import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from '@/app/App'
import { UnifiedComposerPage } from '@/features/composer/UnifiedComposerPage'
import {
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
import { StartPage } from '@/features/start/StartPage'
import {
  AccountPage,
  DeleteAccountCompletePage,
  DeleteAccountPage,
  LoginPage,
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
import {
  BlackboardPage,
  BlackboardWritePage,
} from '@/features/classroom/BlackboardPages'
import {
  ClassroomLockerCompletePage,
  ClassroomLockerPage,
  ClassroomLockerPlacementPage,
} from '@/features/classroom/LockerPages'
import { PrototypeIndexPage } from '@/prototype/screens/PrototypeIndexPage'
import {
  ComposerPage,
  ReaderPage,
} from '@/prototype/screens/flowPages'
import { SystemPage } from '@/system/SystemPage'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/start" replace /> },
      { path: '/start', element: <StartPage /> },
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/signup', element: <SignupPage /> },
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

      { path: '/prototype/support/jisu', element: <SupportDeskPage /> },
      {
        path: '/prototype/support/jisu/compose',
        element: <UnifiedComposerPage />,
      },
      {
        path: '/prototype/support/jisu/placement',
        element: <PlacementPreviewPage />,
      },
      {
        path: '/prototype/support/jisu/complete',
        element: <SupportCompletePage />,
      },

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

      { path: '/prototype/composer', element: <ComposerPage /> },
      { path: '/prototype/reader', element: <ReaderPage /> },
      { path: '/prototype/manage', element: <CreatorManagementPage /> },
      { path: '/prototype/claim', element: <ClaimIntroPage /> },
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
      { path: '/system', element: <SystemPage /> },
      { path: '*', element: <Navigate to="/start" replace /> },
    ],
  },
])
