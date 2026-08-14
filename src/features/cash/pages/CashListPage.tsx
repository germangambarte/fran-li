import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/layout/EmptyState'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useExpenses } from '@/features/expenses/hooks'
import { useSales } from '@/features/sales/hooks'
import { useCashMovements } from '../hooks'
import { computeCashSummary } from '../balance'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function CashListPage() {
  const navigate = useNavigate()
  const {
    data: movements,
    isPending: movementsPending,
    isError: movementsError,
    error: movementsErrorMessage,
  } = useCashMovements()
  const {
    data: sales,
    isPending: salesPending,
    isError: salesError,
    error: salesErrorMessage,
  } = useSales()
  const {
    data: expenses,
    isPending: expensesPending,
    isError: expensesError,
    error: expensesErrorMessage,
  } = useExpenses()

  const summary = useMemo(
    () => computeCashSummary(sales ?? [], expenses ?? [], movements ?? []),
    [sales, expenses, movements],
  )

  const isPending = movementsPending || salesPending || expensesPending
  const isError = movementsError || salesError || expensesError
  const errorMessage =
    movementsErrorMessage ?? salesErrorMessage ?? expensesErrorMessage
  const availablePositive = summary.available >= 0

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Caja</h1>
        <Button onClick={() => navigate('/caja/nuevo')}>
          <Plus />
          Nuevo
        </Button>
      </header>

      {isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}

      {isError && (
        <p className="text-destructive text-sm">
          No se pudieron cargar los datos de caja. Revisá la conexión.
          {errorMessage instanceof Error ? ` (${errorMessage.message})` : ''}
        </p>
      )}

      {!isPending && !isError && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Dinero disponible
                </span>
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full',
                    availablePositive
                      ? 'bg-emerald-600/10'
                      : 'bg-destructive/10',
                  )}
                >
                  <Wallet
                    className={cn(
                      'size-4',
                      availablePositive ? 'text-emerald-600' : 'text-destructive',
                    )}
                  />
                </div>
              </div>
              <span
                className={cn(
                  'text-3xl font-bold tabular-nums',
                  availablePositive ? 'text-emerald-600' : 'text-destructive',
                )}
              >
                {formatMoney(summary.available)}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col divide-y">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground text-sm">
                  Ganancia acumulada
                </span>
                <span className="text-emerald-600 font-semibold tabular-nums">
                  {formatMoney(summary.profit)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground text-sm">
                  Total retirado
                </span>
                <span className="text-destructive font-semibold tabular-nums">
                  -{formatMoney(summary.withdrawals)}
                </span>
              </div>
              {summary.adjustments !== 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground text-sm">
                    Ajustes de caja
                  </span>
                  <span className="text-emerald-600 font-semibold tabular-nums">
                    +{formatMoney(summary.adjustments)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!isPending && !isError && movements?.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="Sin movimientos de caja"
          description="Tocá el botón «Nuevo» para registrar un retiro o un ajuste."
        />
      )}

      <ul className="flex flex-col gap-2">
        {movements?.map((movement) => {
          const isAdjustment = movement.type === 'cash_in'
          return (
            <li key={movement.id}>
              <div
                className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border bg-card p-4"
                onClick={() => navigate(`/caja/${movement.id}`)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {movement.description ?? 'Sin concepto'}
                    </span>
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                      {isAdjustment ? 'Ajuste' : 'Retiro'}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {dateFormatter.format(new Date(movement.created_at))}
                    {movement.note ? ' · con observación' : ''}
                  </span>
                </div>
                <span
                  className={cn(
                    'shrink-0 font-semibold tabular-nums',
                    isAdjustment ? 'text-emerald-600' : 'text-destructive',
                  )}
                >
                  {isAdjustment ? '+' : '-'}
                  {formatMoney(movement.amount)}
                </span>
                <ChevronRight className="text-muted-foreground size-5 shrink-0" />
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
