import { createBrowserRouter, Navigate, useLocation, type RouteObject } from 'react-router-dom'
import { ComingSoonPage } from '@/features/common/ComingSoon'
import { RouteErrorPage } from '@/app/RouteErrorPage'
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
import { PrivacyPolicyPage, TermsOfServicePage } from '@/features/legal/LegalPages'
import {
  GoogleCallbackPage,
  KakaoCallbackPage,
} from '@/features/account/OAuthCallbackPages'
import { WelcomePage } from '@/features/start/WelcomePage'
import {
  ExamCareerIntroPage,
  ExamCareerPlayPage,
  ExamCareerResultPage,
} from '@/features/minigame/examCareer/ExamCareerPages'
import {
  D1CourseIntroPage,
  D1CoursePlayPage,
  D1CourseResultPage,
} from '@/features/minigame/d1Course/D1CoursePages'
import {
  AccountPage,
  DeleteAccountPage,
  LoginPage,
  ResetPasswordCompletePage,
  ResetPasswordNewPage,
  ResetPasswordPage,
  SignupPage,
} from '@/features/account/AccountPages'
import { ProfileEditPage } from '@/features/account/ProfileEditPage'
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
import { PeperoPickPage } from '@/features/supporter/PeperoPickPage'
import { LockerDecoratePage } from '@/features/classroom/LockerDecoratePage'
import { PrototypeIndexPage } from '@/prototype/screens/PrototypeIndexPage'
import {
  ComposerPage,
  ReaderPage,
} from '@/prototype/screens/flowPages'
import { SystemPage } from '@/system/SystemPage'
import { DeskBlastPage } from '@/features/minigame/deskBlast/DeskBlastPages'
import {
  SneakyPhoneIntroPage,
  SneakyPhonePlayPage,
} from '@/features/minigame/sneakyPhone/SneakyPhonePages'
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
/**
 * 운영에서만 적용하는 화면 가림.
 * - 아직 서버에 연결되지 않은 기능(우리 반, Wrapped, 혜택)은 "개발 중" 화면을 보여 준다.
 * - 내부 확인용 화면(시안 목차, 디자인 확인 페이지, 자리표시 화면)은 처음으로 돌려보낸다.
 * 개발과 테스트에서는 모두 그대로 열려 있다.
 */
const NOT_READY_PATHS: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/classroom(\/|$)/, title: '우리 반' },
  { pattern: /^\/wrapped(\/|$)/, title: '응원 결산' },
  { pattern: /^\/offers(\/|$)/, title: '혜택' },
]
export function LegacyPrototypeRedirect() {
  const { pathname, search, hash } = useLocation()
  return <Navigate to={`${pathname.replace(/^\/prototype/, '') || '/'}${search}${hash}`} replace />
}

const INTERNAL_PATHS = [/^\/prototype$/, /^\/(composer|reader|manage)$/, /^\/system$/]

export function gateRoutes(routes: RouteObject[], production: boolean): RouteObject[] {
  if (!production) return routes
  return routes.map((route) => {
    const path = route.path
    if (!path) return route
    const notReady = NOT_READY_PATHS.find(({ pattern }) => pattern.test(path))
    if (notReady) {
      return { ...route, element: <ComingSoonPage title={notReady.title} description="곧 열릴 예정이에요. 지금은 응원 책상을 이용해 주세요." /> }
    }
    if (INTERNAL_PATHS.some((pattern) => pattern.test(path))) {
      return { ...route, element: <Navigate to="/" replace /> }
    }
    return route
  })
}

export const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: gateRoutes([
      { index: true, element: <WelcomePage /> },
      {
        // The operators' console loads on demand so visitors never download it.
        path: '/admin',
        lazy: async () => {
          const { AdminLayout } = await import('@/features/admin/AdminLayout')
          return { Component: AdminLayout }
        },
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('@/features/admin/DashboardPage')).DashboardPage,
            }),
          },
          {
            path: 'users',
            lazy: async () => ({
              Component: (await import('@/features/admin/UsersPage')).UsersPage,
            }),
          },
          {
            path: 'minigames',
            lazy: async () => ({
              Component: (await import('@/features/admin/MinigamesPage')).MinigamesPage,
            }),
          },
          {
            path: 'reports',
            lazy: async () => ({
              Component: (await import('@/features/admin/ReportsPage')).ReportsPage,
            }),
          },
          {
            path: 'benefits',
            lazy: async () => ({
              Component: (await import('@/features/admin/BenefitSubmissionsPage')).BenefitSubmissionsPage,
            }),
          },
          {
            path: 'benefits/:id',
            lazy: async () => ({
              Component: (await import('@/features/admin/BenefitSubmissionDetailPage')).BenefitSubmissionDetailPage,
            }),
          },
          {
            path: 'inquiries',
            lazy: async () => ({
              Component: (await import('@/features/admin/InquiriesPage')).InquiriesPage,
            }),
          },
          {
            path: 'pitch',
            lazy: async () => ({
              Component: (await import('@/features/admin/pitch/PitchDeckPage')).PitchDeckPage,
            }),
          },
          {
            path: 'admins',
            lazy: async () => ({
              Component: (await import('@/features/admin/AdminsPage')).AdminsPage,
            }),
          },
        ],
      },
      {
        path: '/promotion',
        lazy: async () => ({
          Component: (await import('@/features/promotion/PromotionPage')).PromotionPage,
        }),
      },
      {
        path: '/promotion/apply',
        lazy: async () => ({
          Component: (await import('@/features/promotion/PromotionApplyPage')).PromotionApplyPage,
        }),
      },
      {
        path: '/promotion/apply/consult',
        lazy: async () => ({
          Component: (await import('@/features/promotion/PromotionConsultPage')).PromotionConsultPage,
        }),
      },
      {
        path: '/promotion/deck',
        lazy: async () => ({
          Component: (await import('@/features/admin/pitch/PitchDeckViewPage')).PitchDeckViewPage,
        }),
      },
      {
        path: '/promotion/apply/benefit',
        lazy: async () => ({
          Component: (await import('@/features/promotion/PromotionBenefitPage')).PromotionBenefitPage,
        }),
      },
      {
        path: '/claim/:claimToken',
        lazy: async () => ({
          Component: (await import('@/features/claim/ClaimLinkPage')).ClaimLinkPage,
        }),
      },
      {
        path: '/friend-desks',
        lazy: async () => ({
          Component: (await import('@/features/deskCreation/FriendDeskPages')).FriendDesksPage,
        }),
      },
      {
        path: '/friend-desks/created',
        lazy: async () => ({
          Component: (await import('@/features/deskCreation/FriendDeskPages')).FriendDeskCreatedPage,
        }),
      },
      {
        path: '/letters',
        lazy: async () => ({
          Component: (await import('@/features/supporter/MyLettersPage')).MyLettersPage,
        }),
      },
      {
        path: '/favorite-desks',
        lazy: async () => ({
          Component: (await import('@/features/supporter/FavoriteDesksPage')).FavoriteDesksPage,
        }),
      },
      { path: '/start', element: <StartPage /> },
      { path: '/home', element: <HomePage /> },
      { path: '/minigame/exam-career', element: <ExamCareerIntroPage /> },
      { path: '/minigame/exam-career/play', element: <ExamCareerPlayPage /> },
      { path: '/minigame/exam-career/result/:code', element: <ExamCareerResultPage /> },
      { path: '/minigame/d1-course', element: <D1CourseIntroPage /> },
      { path: '/minigame/d1-course/play', element: <D1CoursePlayPage /> },
      { path: '/minigame/d1-course/result/:code', element: <D1CourseResultPage /> },
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/privacy', element: <PrivacyPolicyPage /> },
      { path: '/terms', element: <TermsOfServicePage /> },
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
      { path: '/account/profile', element: <ProfileEditPage /> },
      { path: '/account/delete', element: <DeleteAccountPage /> },
      { path: '/prototype', element: <PrototypeIndexPage /> },
      { path: '/minigame/desk-blast', element: <DeskBlastPage /> },
      // Development only: the link-card thumbnails are photographed from here (scripts/make-og-images.mjs).
      ...(import.meta.env.DEV
        ? [{ path: '/__og/:name', lazy: async () => ({ Component: (await import('@/features/ogImages/OgPreviewPage')).default }) }]
        : []),
      { path: '/minigame/sneaky-phone', element: <SneakyPhoneIntroPage /> },
      { path: '/minigame/sneaky-phone/play', element: <SneakyPhonePlayPage /> },

      { path: '/create', element: <DeskCreateWhoPage /> },
      {
        path: '/create/recipient',
        element: <DeskCreateRecipientPage />,
      },
      {
        path: '/create/read-mode',
        element: <DeskCreateReadModePage />,
      },
      {
        path: '/create/complete',
        element: <DeskCreateCompletePage />,
      },

      // Canonical supporter desk routes, keyed by supporter token (the
      // backend looks a desk up by this). `/support/jisu*` below
      // stays mounted at the same components so old links keep working,
      // but every link this app generates now points here.
      {
        path: '/desk/:supporterToken',
        element: <SupporterDeskGate />,
        children: [
          { index: true, element: <SupportDeskPage /> },
          { path: 'compose', element: <UnifiedComposerPage /> },
          { path: 'charm', element: <CharmPickPage /> },
          { path: 'pepero', element: <PeperoPickPage /> },
          { path: 'sticker', element: <StickerPickPage /> },
          { path: 'placement', element: <PlacementPreviewPage /> },
          { path: 'complete', element: <SupportCompletePage /> },
          {
            path: 'cards',
            element: <Navigate to="/my/desk/cards" replace />,
          },
          { path: 'message/:messageId', element: <MessageViewerPage /> },
          { path: 'replies', element: <SupporterRepliesPage /> },
          { path: 'sent', element: <SentMessagesPage /> },
          { path: 'settings', element: <SupporterSettingsPage /> },
        ],
      },

      { path: '/support/jisu', element: <SupportDeskPage /> },
      {
        path: '/support/jisu/compose',
        element: <UnifiedComposerPage />,
      },
      {
        path: '/support/jisu/charm',
        element: <CharmPickPage />,
      },
      {
        path: '/support/jisu/pepero',
        element: <PeperoPickPage />,
      },
      {
        path: '/support/jisu/sticker',
        element: <StickerPickPage />,
      },
      {
        path: '/support/jisu/placement',
        element: <PlacementPreviewPage />,
      },
      {
        path: '/support/jisu/complete',
        element: <SupportCompletePage />,
      },

      {
        element: <OwnerDeskGate />,
        children: [
          { path: '/my/desk', element: <OwnerDeskPage /> },
          { path: '/my/desk/cards', element: <EnvelopeStackPage /> },
          { path: '/my/settings', element: <DeskSettingsPage /> },
          {
            path: '/my/settings/blocked',
            element: <BlockedSupportersPage />,
          },
          {
            path: '/my/settings/connect',
            element: <ConnectRoomsPage />,
          },
          {
            path: '/my/settings/end',
            element: <EndRoomPage />,
          },
          {
            path: '/my/message/:messageId',
            element: <MessageViewerPage />,
          },
          {
            path: '/my/message/:messageId/reply',
            element: <MessageReplyPage />,
          },
        ],
      },
      {
        path: '/desk',
        element: <Navigate to="/my/desk" replace />,
      },
      {
        path: '/support/jisu/cards',
        element: <Navigate to="/my/desk/cards" replace />,
      },
      {
        path: '/support/jisu/message/:messageId',
        element: <MessageViewerPage />,
      },
      {
        path: '/support/jisu/replies',
        element: <SupporterRepliesPage />,
      },
      {
        path: '/support/jisu/sent',
        element: <SentMessagesPage />,
      },
      {
        path: '/support/jisu/settings',
        element: <SupporterSettingsPage />,
      },

      { path: '/composer', element: <ComposerPage /> },
      { path: '/reader', element: <ReaderPage /> },
      { path: '/manage', element: <CreatorManagementPage /> },
      { path: '/claim', element: <ClaimIntroPage /> },
      {
        path: '/claim/backlog',
        element: <ClaimBacklogPage />,
      },
      {
        path: '/claim/read-mode',
        element: <ClaimReadModePage />,
      },
      {
        path: '/claim/complete',
        element: <ClaimCompletePage />,
      },
      {
        path: '/classroom',
        element: <ClassroomEntryRedirect />,
      },
      {
        path: '/classroom/create',
        element: <ClassroomCreatePage />,
      },
      {
        path: '/classroom/:classroomId/complete',
        element: <ClassroomCreateCompletePage />,
      },
      {
        path: '/classroom/:classroomId/join',
        element: <ClassroomJoinPage />,
      },
      {
        path: '/classroom/:classroomId/map',
        element: <ClassroomMapPage />,
      },
      {
        path: '/classroom/:classroomId/settings',
        element: <ClassroomSettingsPage />,
      },
      {
        path: '/classroom/:classroomId/wrapped',
        element: <ClassWrappedPage />,
      },
      {
        path: '/classroom/:classroomId/wrapped/share',
        element: <ClassWrappedSharePage />,
      },
      {
        path: '/classroom/:classroomId/blackboard',
        element: <BlackboardPage />,
      },
      {
        path: '/classroom/:classroomId/blackboard/write',
        element: <BlackboardWritePage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId',
        element: <ClassroomLockerPage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId/compose',
        element: <UnifiedComposerPage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId/decorate',
        element: <LockerDecoratePage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId/charm',
        element: <LockerCharmPickPage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId/sticker',
        element: <LockerStickerPickPage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId/placement',
        element: <ClassroomLockerPlacementPage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId/complete',
        element: <ClassroomLockerCompletePage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId/message/:messageId',
        element: <MessageViewerPage />,
      },
      {
        path: '/classroom/:classroomId/locker/:lockerId/message/:messageId/reply',
        element: <MessageReplyPage />,
      },
      { path: '/wrapped', element: <WrappedHomePage /> },
      {
        path: '/wrapped/intro',
        element: <WrappedIntroPage />,
      },
      {
        path: '/wrapped/insight',
        element: <WrappedInsightPage />,
      },
      {
        path: '/wrapped/friends',
        element: <WrappedFriendsPage />,
      },
      {
        path: '/wrapped/records',
        element: <WrappedRecordsPage />,
      },
      {
        path: '/wrapped/share',
        element: <WrappedSharePage />,
      },
      { path: '/offers', element: <OffersPage /> },
      {
        path: '/offers/:offerId',
        element: <OfferDetailPage />,
      },
      {
        path: '/offers/:offerId/coupon',
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
      // Unknown addresses go through the front door: /home if signed in, welcome otherwise.
      // Addresses from before the `/prototype` prefix was dropped (bookmarks, links already shared).
      { path: '/prototype/*', element: <LegacyPrototypeRedirect /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ], import.meta.env.PROD),
  },
])
