import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMoney, toDateInput } from '@/lib/format'
import { useExpenses } from '../hooks'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function ExpenseListPage() {
  const navigate = useNavigate()
  const { data: expenses, isPending, isError, error } = useExpenses()

  const [from, setFrom] = useState(() => toDateInput(new Date().toISOString()))
  const [to, setTo] = useState(() => toDateInput(new Date().toISOString()))

  const filtered = useMemo(() => {
    if (!expenses) return []
    const fromMs = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity
    const toMs = to
      ? new Date(`${to}T23:59:59.999`).getTime()
      : Infinity
    return expenses.filter((expense) => {
      const time = new Date(expense.created_at).getTime()
      return time >= fromMs && time <= toMs
    })
  }, [expenses, from, to])

  const hasFilter = from !== '' || to !== ''

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Gastos</h1>
        <Button onClick={() => navigate('/gastos/nuevo')}>
          <Plus />
          Nuevo
        </Button>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Filtrar por fecha</Label>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}

      {isError && (
        <p className="text-destructive text-sm">
          No se pudieron cargar los gastos. Revisá la conexión.
          {error instanceof Error ? ` (${error.message})` : ''}
        </p>
      )}

      {!isPending && !isError && filtered.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {expenses && expenses.length === 0
            ? 'Todavía no hay gastos registrados. Tocá “Nuevo” para cargar el primero.'
            : 'No hay gastos en ese rango de fechas.'}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((expense) => (
          <li key={expense.id}>
            <div
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border bg-card p-4"
              onClick={() => navigate(`/gastos/${expense.id}`)}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {expense.description}
                  </span>
                  <span className="text-destructive shrink-0 font-semibold tabular-nums">
                    -{formatMoney(expense.amount)}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {dateFormatter.format(new Date(expense.created_at))}
                  {expense.note ? ' · con observación' : ''}
                </span>
              </div>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
