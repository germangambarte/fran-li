import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  formatMoney,
  nowLocalDateTimeInput,
  parseDecimal,
  toLocalDateTimeInput,
} from '@/lib/format'
import type { Expense } from '@/types/database'
import { useDeleteExpense, useExpenses, useSaveExpense } from '../hooks'

interface FormValues {
  createdAt: string
  concept: string
  amount: string
  note: string
}

export function ExpenseFormPage() {
  const { expenseId } = useParams()
  const { data: expenses, isPending } = useExpenses()
  const expense = expenseId
    ? expenses?.find((candidate) => candidate.id === expenseId)
    : undefined

  if (isPending) {
    return <p className="text-muted-foreground text-sm">Cargando…</p>
  }

  if (expenseId && !expense) {
    return (
      <p className="text-muted-foreground text-sm">
        Gasto no encontrado.{' '}
        <Link className="text-primary underline" to="/gastos">
          Volver a gastos
        </Link>
      </p>
    )
  }

  return (
    <ExpenseForm key={expense?.id ?? 'nuevo'} expense={expense} />
  )
}

function ExpenseForm({ expense }: { expense?: Expense }) {
  const navigate = useNavigate()
  const saveExpense = useSaveExpense()
  const deleteExpense = useDeleteExpense()
  const [values, setValues] = useState<FormValues>(() => ({
    createdAt: expense
      ? toLocalDateTimeInput(expense.created_at)
      : nowLocalDateTimeInput(),
    concept: expense?.description ?? '',
    amount: expense ? String(expense.amount) : '',
    note: expense?.note ?? '',
  }))
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const parsedAmount = parseDecimal(values.amount)

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }))

  function validate(): number | null {
    if (values.concept.trim() === '') {
      setError('Ingresá el concepto del gasto.')
      return null
    }
    const amount = parseDecimal(values.amount)
    if (amount === null || amount <= 0) {
      setError('Ingresá un importe mayor a cero.')
      return null
    }
    setError(null)
    return amount
  }

  async function handleSave() {
    const amount = validate()
    if (amount === null) return

    const parsedDate = new Date(values.createdAt)
    const createdAt = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString()
    const note = values.note.trim() === '' ? null : values.note.trim()

    try {
      await saveExpense.mutateAsync({
        id: expense?.id,
        concept: values.concept.trim(),
        amount,
        note,
        created_at: createdAt,
      })
      navigate('/gastos')
    } catch {
      setError(
        'No se pudo guardar el gasto. Revisá la conexión e intentá de nuevo.',
      )
    }
  }

  async function handleDelete() {
    if (!expense) return
    try {
      await deleteExpense.mutateAsync(expense.id)
      navigate('/gastos')
    } catch {
      setError(
        'No se pudo eliminar el gasto. Revisá la conexión e intentá de nuevo.',
      )
    }
  }

  return (
    <>
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/gastos')}
          aria-label="Volver"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">
          {expense ? 'Editar gasto' : 'Nuevo gasto'}
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-date">Fecha</Label>
            <Input
              id="expense-date"
              type="datetime-local"
              value={values.createdAt}
              onChange={(event) => setField('createdAt', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-concept">Concepto</Label>
            <Input
              id="expense-concept"
              value={values.concept}
              onChange={(event) => setField('concept', event.target.value)}
              placeholder="Ej: hielo"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-amount">Importe</Label>
            <Input
              id="expense-amount"
              inputMode="decimal"
              value={values.amount}
              onChange={(event) => setField('amount', event.target.value)}
              placeholder="Ej: 2500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-note">Observación (opcional)</Label>
            <Input
              id="expense-note"
              value={values.note}
              onChange={(event) => setField('note', event.target.value)}
              placeholder="Ej: comprado en el mercado"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted-foreground text-xs">Importe</span>
          <span className="text-lg font-semibold tabular-nums">
            {parsedAmount !== null ? formatMoney(parsedAmount) : '—'}
          </span>
        </div>
        <Button
          className="h-12 px-6 text-base"
          onClick={handleSave}
          disabled={saveExpense.isPending}
        >
          {saveExpense.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>

      {expense && (
        <div className="flex flex-col gap-2">
          {!confirmDelete ? (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
              Eliminar gasto
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                Confirmar eliminación
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
