import { useMemo, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatMoney, toDateInput } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useExpenses } from '@/features/expenses/hooks'
import { useSales } from '@/features/sales/hooks'
import { useDailyHistory } from '../history'
import { buildPeriods, computeTotals, type PeriodId } from '../periods'

const dayFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

function dayLabel(day: string, isToday: boolean): string {
  if (isToday) return 'Hoy'
  return dayFormatter.format(new Date(`${day}T12:00:00`))
}

export function DashboardPage() {
  const {
    data: sales,
    isPending: salesPending,
    isError: salesError,
  } = useSales()
  const {
    data: expenses,
    isPending: expensesPending,
    isError: expensesError,
  } = useExpenses()
  const {
    data: history,
    isPending: historyPending,
    isError: historyError,
    error: historyErrorMessage,
  } = useDailyHistory()
  const [periodId, setPeriodId] = useState<PeriodId>('today')

  const summaries = useMemo(() => {
    const periods = buildPeriods()
    return periods.map((period) => ({
      id: period.id,
      label: period.label,
      totals: computeTotals(period, sales ?? [], expenses ?? []),
    }))
  }, [sales, expenses])

  const active = summaries.find((summary) => summary.id === periodId) ?? summaries[0]
  const isPending = salesPending || expensesPending
  const isError = salesError || expensesError
  const profitPositive = active.totals.profit >= 0
  const today = toDateInput(new Date().toISOString())

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Balance</h1>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {summaries.map((summary) => (
          <button
            key={summary.id}
            type="button"
            onClick={() => setPeriodId(summary.id)}
            className={cn(
              'rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
              summary.id === active.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-card text-muted-foreground',
            )}
          >
            {summary.label}
          </button>
        ))}
      </div>

      {isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}

      {isError && (
        <p className="text-destructive text-sm">
          No se pudo calcular el balance. Revisá la conexión.
        </p>
      )}

      {!isPending && !isError && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Ganancia</span>
                {profitPositive ? (
                  <TrendingUp className="text-emerald-600 size-5" />
                ) : (
                  <TrendingDown className="text-destructive size-5" />
                )}
              </div>
              <span
                className={cn(
                  'text-3xl font-bold tabular-nums',
                  profitPositive ? 'text-emerald-600' : 'text-destructive',
                )}
              >
                {formatMoney(active.totals.profit)}
              </span>
              <span className="text-muted-foreground text-xs">
                {active.totals.salesCount} ventas · {active.totals.expensesCount}{' '}
                gastos
              </span>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Ventas</span>
                <span className="text-2xl font-semibold tabular-nums">
                  {formatMoney(active.totals.sales)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {active.totals.salesCount} ventas
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Gastos</span>
                <span className="text-destructive text-2xl font-semibold tabular-nums">
                  -{formatMoney(active.totals.expenses)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {active.totals.expensesCount} gastos
                </span>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Últimos 30 días</h2>

        {historyPending && (
          <p className="text-muted-foreground text-sm">Cargando…</p>
        )}

        {historyError && (
          <p className="text-destructive text-sm">
            No se pudo cargar el historial.
            {historyErrorMessage instanceof Error
              ? ` ${historyErrorMessage.message}`
              : ''}
          </p>
        )}

        {!historyPending && !historyError && history && (
          <>
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 text-xs text-muted-foreground">
              <span>Fecha</span>
              <span className="w-20 text-right">Vendido</span>
              <span className="w-20 text-right">Ganancia</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {history.map((row) => {
                const emptyDay = row.sales === 0 && row.expenses === 0
                const profitPositive = row.profit >= 0
                return (
                  <li key={row.day}>
                    <div
                      className={cn(
                        'grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border bg-card px-3 py-2',
                        emptyDay && 'opacity-60',
                      )}
                    >
                      <span className="text-sm font-medium">
                        {dayLabel(row.day, row.day === today)}
                      </span>
                      <span className="w-20 text-right text-sm tabular-nums">
                        {formatMoney(row.sales)}
                      </span>
                      <span
                        className={cn(
                          'w-20 text-right text-sm tabular-nums',
                          profitPositive
                            ? 'text-emerald-600'
                            : 'text-destructive',
                        )}
                      >
                        {profitPositive ? '' : '-'}
                        {formatMoney(Math.abs(row.profit))}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
