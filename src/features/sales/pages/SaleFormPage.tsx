import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

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
  formatKilos,
  formatMoney,
  nowLocalDateTimeInput,
  parseDecimal,
  round2,
  toLocalDateTimeInput,
} from '@/lib/format'
import type { ProductWithPrices } from '@/features/products/types'
import { useProducts } from '@/features/products/hooks'
import type { PaymentMethod } from '@/types/database'
import { useDeleteSale, useSales, useSaveSale } from '../hooks'
import { defaultModality, lineSubtotal } from '../pricing'
import { SaleItemRow } from '../components/SaleItemRow'
import type { NewSaleItem, SaleItemDraft, SaleWithItems } from '../types'

interface FormValues {
  createdAt: string
  paymentMethod: PaymentMethod
  note: string
  items: SaleItemDraft[]
}

function toDrafts(sale: SaleWithItems): SaleItemDraft[] {
  return sale.franli_sale_items.map((item) => ({
    productId: item.product_id ?? '',
    modalityKey:
      item.price_min_kg !== null ? `pack:${item.price_min_kg}` : 'per_kg',
    quantity: String(item.quantity),
    pricePerKg: item.unit_price,
    packMinKg: item.price_min_kg,
    packPrice: item.pack_price,
  }))
}

export function SaleFormPage() {
  const { saleId } = useParams()
  const { data: sales, isPending: isPendingSales } = useSales()
  const { data: products, isPending: isPendingProducts } = useProducts()
  const sale = saleId
    ? sales?.find((candidate) => candidate.id === saleId)
    : undefined

  if (isPendingSales || isPendingProducts) {
    return <p className="text-muted-foreground text-sm">Cargando…</p>
  }

  if (saleId && !sale) {
    return (
      <p className="text-muted-foreground text-sm">
        Venta no encontrada.{' '}
        <Link className="text-primary underline" to="/ventas">
          Volver a ventas
        </Link>
      </p>
    )
  }

  return (
    <SaleForm key={sale?.id ?? 'nueva'} sale={sale} products={products ?? []} />
  )
}

function SaleForm({
  sale,
  products,
}: {
  sale?: SaleWithItems
  products: ProductWithPrices[]
}) {
  const navigate = useNavigate()
  const saveSale = useSaveSale()
  const deleteSale = useDeleteSale()
  const [values, setValues] = useState<FormValues>(() => ({
    createdAt: sale
      ? toLocalDateTimeInput(sale.created_at)
      : nowLocalDateTimeInput(),
    paymentMethod: sale?.payment_method ?? 'cash',
    note: sale?.note ?? '',
    items: sale ? toDrafts(sale) : [],
  }))
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const activeProducts = products.filter((product) => product.active)

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }))

  const updateItem = (index: number, patch: Partial<SaleItemDraft>) =>
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }))

  const removeItem = (index: number) =>
    setValues((previous) => ({
      ...previous,
      items: previous.items.filter((_, i) => i !== index),
    }))

  function addItem() {
    const product = activeProducts[0]
    if (!product) return
    const option = defaultModality(product)
    if (!option) return
    setValues((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          productId: product.id,
          modalityKey: option.key,
          quantity: option.minKg !== null ? String(option.minKg) : '',
          pricePerKg: option.unitPrice,
          packMinKg: option.minKg,
          packPrice: option.packPrice,
        },
      ],
    }))
  }

  const total = round2(
    values.items.reduce((acc, item) => {
      const subtotal = lineSubtotal(item)
      return acc + (subtotal ?? 0)
    }, 0),
  )

  function buildItems(): { items: NewSaleItem[]; total: number } | null {
    if (values.items.length === 0) {
      setError('Agregá al menos un producto a la venta.')
      return null
    }

    const items: NewSaleItem[] = []
    for (const [index, draft] of values.items.entries()) {
      const product = products.find(
        (candidate) => candidate.id === draft.productId,
      )
      if (!product) {
        setError(`Elegí el producto del item ${index + 1}.`)
        return null
      }
      const quantity = parseDecimal(draft.quantity)
      if (quantity === null || quantity <= 0) {
        setError(`Ingresá el peso del item ${index + 1}.`)
        return null
      }
      if (draft.packMinKg !== null && quantity < draft.packMinKg) {
        setError(
          `El item ${index + 1} requiere al menos ${formatKilos(
            draft.packMinKg,
          )} kg.`,
        )
        return null
      }
      const subtotal = lineSubtotal(draft)
      if (subtotal === null) {
        setError(`No se pudo calcular el subtotal del item ${index + 1}.`)
        return null
      }
      items.push({
        product_id: product.id,
        product_name: product.name,
        price_min_kg: draft.packMinKg,
        pack_price: draft.packPrice,
        unit_price: round2(draft.pricePerKg),
        quantity,
        subtotal,
      })
    }

    return {
      items,
      total: round2(items.reduce((acc, item) => acc + item.subtotal, 0)),
    }
  }

  async function handleSave() {
    const built = buildItems()
    if (!built) return

    const parsedDate = new Date(values.createdAt)
    const createdAt = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString()
    const note = values.note.trim() === '' ? null : values.note.trim()

    try {
      await saveSale.mutateAsync({
        id: sale?.id,
        payment_method: values.paymentMethod,
        note,
        created_at: createdAt,
        items: built.items,
      })
      navigate('/ventas')
    } catch {
      setError(
        'No se pudo guardar la venta. Revisá la conexión e intentá de nuevo.',
      )
    }
  }

  async function handleDelete() {
    if (!sale) return
    try {
      await deleteSale.mutateAsync(sale.id)
      navigate('/ventas')
    } catch {
      setError(
        'No se pudo eliminar la venta. Revisá la conexión e intentá de nuevo.',
      )
    }
  }

  return (
    <>
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/ventas')}
          aria-label="Volver"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">
          {sale ? 'Editar venta' : 'Nueva venta'}
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sale-date">Fecha</Label>
            <Input
              id="sale-date"
              type="datetime-local"
              value={values.createdAt}
              onChange={(event) => setField('createdAt', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Medio de pago</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={values.paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setField('paymentMethod', 'cash')}
              >
                Efectivo
              </Button>
              <Button
                type="button"
                variant={
                  values.paymentMethod === 'transfer' ? 'default' : 'outline'
                }
                className="flex-1"
                onClick={() => setField('paymentMethod', 'transfer')}
              >
                Transferencia
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sale-note">Observación (opcional)</Label>
            <Input
              id="sale-note"
              value={values.note}
              onChange={(event) => setField('note', event.target.value)}
              placeholder="Ej: picado al momento"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Productos</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={activeProducts.length === 0}
            >
              <Plus />
              Agregar
            </Button>
          </div>

          {activeProducts.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No hay productos activos para vender.
            </p>
          )}

          {values.items.length === 0 && activeProducts.length > 0 && (
            <p className="text-muted-foreground text-sm">
              Tocá “Agregar” para cargar el primer producto.
            </p>
          )}

          {values.items.map((item, index) => (
            <SaleItemRow
              key={index}
              index={index}
              products={products}
              item={item}
              onChange={updateItem}
              onRemove={removeItem}
            />
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted-foreground text-xs">Total</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatMoney(total)}
          </span>
        </div>
        <Button
          className="h-12 px-6 text-base"
          onClick={handleSave}
          disabled={saveSale.isPending}
        >
          {saveSale.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>

      {sale && (
        <div className="flex flex-col gap-2">
          {!confirmDelete ? (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
              Eliminar venta
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
