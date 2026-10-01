import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from '@/app/App'
import { UnifiedComposerPage } from '@/features/composer/UnifiedComposerPage'
import { OwnerDeskPage } from '@/features/owner/OwnerDeskPage'
import {
  DeskCreateCompletePage,
  DeskCreateReadModePage,
  DeskCreateRecipientPage,
  DeskCreateWhoPage,
} from '@/features/deskCreation/DeskCreationPages'
import { EnvelopeStackPage } from '@/features/supporter/EnvelopeStackPage'
import { MessageViewerPage } from '@/features/supporter/MessageViewerPage'
import { PlacementPreviewPage } from '@/features/supporter/PlacementPreviewPage'
import { SupportCompletePage } from '@/features/supporter/SupportCompletePage'
import { SupportDeskPage } from '@/features/supporter/SupportDeskPage'
import { PrototypeIndexPage } from '@/prototype/screens/PrototypeIndexPage'
import {
  ClaimPage,
  ClassroomPage,
  ComposerPage,
  ReaderPage,
} from '@/prototype/screens/flowPages'
import { SystemPage } from '@/system/SystemPage'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/prototype" replace /> },
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
      {
        path: '/prototype/my/message/:messageId',
        element: <MessageViewerPage />,
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

      { path: '/prototype/composer', element: <ComposerPage /> },
      { path: '/prototype/reader', element: <ReaderPage /> },
      { path: '/prototype/claim', element: <ClaimPage /> },
      { path: '/prototype/classroom', element: <ClassroomPage /> },
      { path: '/system', element: <SystemPage /> },
      { path: '*', element: <Navigate to="/prototype" replace /> },
    ],
  },
])
