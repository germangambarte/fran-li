import { useQueryClient } from '@tanstack/react-query'
import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'

export function AppShell() {
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()

  async function handleLogout() {
    try {
      await signOut()
      queryClient.clear()
    } catch {
      /* el cierre de sesión local ya redirige igual */
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-2xl items-center justify-between gap-2 px-4">
          <span className="font-semibold">Fran Li</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden max-w-48 truncate text-sm sm:block">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-16 pt-4">
        <Outlet />
      </main>
    </div>
  )
}
