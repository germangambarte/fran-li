import { useMemo, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import { useExpenses } from '@/features/expenses/hooks'
import { useSales } from '@/features/sales/hooks'
import { buildPeriods, computeTotals, type PeriodId } from '../periods'
import { cn } from '@/lib/utils'

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
    </>
  )
}
