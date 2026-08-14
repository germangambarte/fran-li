import { Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-16 pt-4">
        <Outlet />
      </main>
    </div>
  )
}
