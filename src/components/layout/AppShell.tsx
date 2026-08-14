import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  Drumstick,
  LogOut,
  Receipt,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems: Array<{ to: string; label: string; icon: LucideIcon; end?: boolean }> = [
  { to: '/', label: 'Balance', icon: BarChart3, end: true },
  { to: '/caja', label: 'Caja', icon: Wallet },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/productos', label: 'Productos', icon: Drumstick },
]

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2.5 text-[11px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
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
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Drumstick className="text-primary-foreground size-5" />
            </div>
            <span className="text-lg font-semibold">Fran Li</span>
          </div>
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
