import type { PropsWithChildren, ReactNode } from 'react'

type AppShellProps = PropsWithChildren<{
  appBar?: ReactNode
  bottomNavigation?: ReactNode
  fixedAction?: ReactNode
  surface?: 'base' | 'paper' | 'transparent'
  contentClassName?: string
  /** Extra class on the shell itself, for a screen that needs its own colors behind the app bar. */
  shellClassName?: string
}>

export function AppShell({
  appBar,
  bottomNavigation,
  fixedAction,
  surface = 'base',
  contentClassName = '',
  shellClassName = '',
  children,
}: AppShellProps) {
  return (
    <div className="app-stage">
      <div className={['app-shell', `app-shell--${surface}`, shellClassName].filter(Boolean).join(' ')}>
        {appBar}
        <main className={['app-shell__content', contentClassName].filter(Boolean).join(' ')}>
          {children}
        </main>
        {fixedAction && <div className="app-shell__fixed-action">{fixedAction}</div>}
        {bottomNavigation}
      </div>
    </div>
  )
}
