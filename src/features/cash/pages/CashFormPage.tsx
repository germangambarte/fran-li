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
import type { CashMovement } from '@/types/database'
import { useCashMovements, useDeleteCashMovement, useSaveCashMovement } from '../hooks'
import type { CashMovementKind } from '../types'

interface FormValues {
  kind: CashMovementKind
  concept: string
  amount: string
  createdAt: string
  note: string
}

function kindFromMovement(movement: CashMovement | undefined): CashMovementKind {
  return movement?.type === 'cash_out' ? 'cash_out' : 'cash_in'
}

export function CashFormPage() {
  const { movementId } = useParams()
  const { data: movements, isPending } = useCashMovements()
  const movement = movementId
    ? movements?.find((candidate) => candidate.id === movementId)
    : undefined

  if (isPending) {
    return <p className="text-muted-foreground text-sm">Cargando…</p>
  }

  if (movementId && !movement) {
    return (
      <p className="text-muted-foreground text-sm">
        Movimiento no encontrado.{' '}
        <Link className="text-primary underline" to="/caja">
          Volver a caja
        </Link>
      </p>
    )
  }

  return (
    <CashForm key={movement?.id ?? 'nuevo'} movement={movement} />
  )
}

function CashForm({ movement }: { movement?: CashMovement }) {
  const navigate = useNavigate()
  const saveMovement = useSaveCashMovement()
  const deleteMovement = useDeleteCashMovement()
  const [values, setValues] = useState<FormValues>(() => ({
    kind: movement ? kindFromMovement(movement) : 'cash_out',
    concept: movement?.description ?? '',
    amount: movement ? String(movement.amount) : '',
    createdAt: movement
      ? toLocalDateTimeInput(movement.created_at)
      : nowLocalDateTimeInput(),
    note: movement?.note ?? '',
  }))
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const parsedAmount = parseDecimal(values.amount)

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }))

  function validate(): number | null {
    if (values.concept.trim() === '') {
      setError('Ingresá el concepto del movimiento.')
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
      await saveMovement.mutateAsync({
        id: movement?.id,
        kind: values.kind,
        concept: values.concept.trim(),
        amount,
        note,
        created_at: createdAt,
      })
      navigate('/caja')
    } catch {
      setError(
        'No se pudo guardar el movimiento. Revisá la conexión e intentá de nuevo.',
      )
    }
  }

  async function handleDelete() {
    if (!movement) return
    try {
      await deleteMovement.mutateAsync(movement.id)
      navigate('/caja')
    } catch {
      setError(
        'No se pudo eliminar el movimiento. Revisá la conexión e intentá de nuevo.',
      )
    }
  }

  return (
    <>
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/caja')}
          aria-label="Volver"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">
          {movement ? 'Editar movimiento' : 'Nuevo movimiento'}
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={values.kind === 'cash_out' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setField('kind', 'cash_out')}
              >
                Retiro
              </Button>
              <Button
                type="button"
                variant={values.kind === 'cash_in' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setField('kind', 'cash_in')}
              >
                Ajuste
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cash-date">Fecha y hora</Label>
            <Input
              id="cash-date"
              type="datetime-local"
              value={values.createdAt}
              onChange={(event) => setField('createdAt', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cash-concept">Concepto</Label>
            <Input
              id="cash-concept"
              value={values.concept}
              onChange={(event) => setField('concept', event.target.value)}
              placeholder={
                values.kind === 'cash_out'
                  ? 'Ej: retiro para gastos personales'
                  : 'Ej: ajuste por diferencia de caja'
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cash-amount">Importe</Label>
            <Input
              id="cash-amount"
              inputMode="decimal"
              value={values.amount}
              onChange={(event) => setField('amount', event.target.value)}
              placeholder="Ej: 5000"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cash-note">Observación (opcional)</Label>
            <Input
              id="cash-note"
              value={values.note}
              onChange={(event) => setField('note', event.target.value)}
              placeholder="Ej: pagado en efectivo"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted-foreground text-xs">
            {values.kind === 'cash_out' ? 'Retiro' : 'Ajuste'}
          </span>
          <span
            className={
              values.kind === 'cash_out'
                ? 'text-destructive text-lg font-semibold tabular-nums'
                : 'text-emerald-600 text-lg font-semibold tabular-nums'
            }
          >
            {values.kind === 'cash_out' ? '-' : '+'}
            {parsedAmount !== null ? formatMoney(parsedAmount) : '—'}
          </span>
        </div>
        <Button
          className="h-12 px-6 text-base"
          onClick={handleSave}
          disabled={saveMovement.isPending}
        >
          {saveMovement.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>

      {movement && (
        <div className="flex flex-col gap-2">
          {!confirmDelete ? (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
              Eliminar movimiento
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
