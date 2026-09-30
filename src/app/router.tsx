import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from '@/app/App'
import { SupportDeskPage } from '@/features/supporter/SupportDeskPage'
import { PrototypeIndexPage } from '@/prototype/screens/PrototypeIndexPage'
import {
  ClaimPage,
  ClassroomPage,
  ComposerPage,
  DeskPage,
  ReaderPage,
} from '@/prototype/screens/flowPages'
import { SystemPage } from '@/system/SystemPage'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/prototype" replace /> },
      { path: '/prototype', element: <PrototypeIndexPage /> },
      { path: '/prototype/support/jisu', element: <SupportDeskPage /> },
      { path: '/prototype/desk', element: <DeskPage /> },
      { path: '/prototype/composer', element: <ComposerPage /> },
      { path: '/prototype/reader', element: <ReaderPage /> },
      { path: '/prototype/claim', element: <ClaimPage /> },
      { path: '/prototype/classroom', element: <ClassroomPage /> },
      { path: '/system', element: <SystemPage /> },
      { path: '*', element: <Navigate to="/prototype" replace /> },
    ],
  },
])
