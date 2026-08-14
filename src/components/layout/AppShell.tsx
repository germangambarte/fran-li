import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Drumstick, LogOut, Receipt, ShoppingCart, Wallet } from 'lucide-react'

import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function BottomNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs',
      isActive ? 'text-primary font-medium' : 'text-muted-foreground',
    )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl">
        <NavLink to="/" end className={linkClass}>
          <BarChart3 className="size-5" />
          Balance
        </NavLink>
        <NavLink to="/caja" className={linkClass}>
          <Wallet className="size-5" />
          Caja
        </NavLink>
        <NavLink to="/ventas" className={linkClass}>
          <ShoppingCart className="size-5" />
          Ventas
        </NavLink>
        <NavLink to="/gastos" className={linkClass}>
          <Receipt className="size-5" />
          Gastos
        </NavLink>
        <NavLink to="/productos" className={linkClass}>
          <Drumstick className="size-5" />
          Productos
        </NavLink>
      </div>
    </nav>
  )
}

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
          <span className="font-semibold">🐔 Fran Li</span>
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
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
