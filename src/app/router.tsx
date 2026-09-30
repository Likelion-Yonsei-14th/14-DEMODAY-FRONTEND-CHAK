import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from '@/app/App'
import { PrototypeIndexPage } from '@/prototype/screens/PrototypeIndexPage'
import { SystemPage } from '@/system/SystemPage'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/prototype" replace /> },
      { path: '/prototype', element: <PrototypeIndexPage /> },
      { path: '/system', element: <SystemPage /> },
    ],
  },
])
