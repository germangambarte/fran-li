import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { formatKilos, formatMoney } from '@/lib/format'
import type { ProductWithPrices } from '@/features/products/types'
import { defaultModality, lineSubtotal, modalityOptions } from '../pricing'
import type { SaleItemDraft } from '../types'

interface SaleItemRowProps {
  index: number
  products: ProductWithPrices[]
  item: SaleItemDraft
  onChange: (index: number, patch: Partial<SaleItemDraft>) => void
  onRemove: (index: number) => void
}

export function SaleItemRow({
  index,
  products,
  item,
  onChange,
  onRemove,
}: SaleItemRowProps) {
  const product = products.find((candidate) => candidate.id === item.productId)
  const options = product ? modalityOptions(product) : []
  const option = options.find((candidate) => candidate.key === item.modalityKey)
  const modalityLabel =
    option?.label ??
    (item.packPrice !== null
      ? `${formatKilos(item.packMinKg ?? 0)} kg → ${formatMoney(item.packPrice)}`
      : `Por kilo · ${formatMoney(item.pricePerKg)}`)

  const subtotal = lineSubtotal(item)

  function handleProductChange(productId: string) {
    const nextProduct = products.find((candidate) => candidate.id === productId)
    if (!nextProduct) return
    const nextOption = defaultModality(nextProduct)
    if (!nextOption) {
      onChange(index, { productId })
      return
    }
    onChange(index, {
      productId,
      modalityKey: nextOption.key,
      pricePerKg: nextOption.unitPrice,
      packMinKg: nextOption.minKg,
      packPrice: nextOption.packPrice,
      quantity: nextOption.minKg !== null ? String(nextOption.minKg) : '',
    })
  }

  function handleModalityChange(modalityKey: string) {
    const nextOption = options.find((candidate) => candidate.key === modalityKey)
    if (!nextOption) return
    onChange(index, {
      modalityKey,
      pricePerKg: nextOption.unitPrice,
      packMinKg: nextOption.minKg,
      packPrice: nextOption.packPrice,
      quantity: nextOption.minKg !== null ? String(nextOption.minKg) : '',
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">
          Producto {index + 1}
        </Label>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onRemove(index)}
          aria-label={`Quitar producto ${index + 1}`}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Select
          value={item.productId}
          onChange={(event) => handleProductChange(event.target.value)}
          aria-label={`Producto ${index + 1}`}
        >
          <option value="" disabled>
            Elegí un producto
          </option>
          {products.map((candidate) => (
            <option
              key={candidate.id}
              value={candidate.id}
              disabled={!candidate.active}
            >
              {candidate.name}
              {!candidate.active ? ' (inactivo)' : ''}
            </option>
          ))}
        </Select>
      </div>

      {product && (
        <>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Modalidad de precio</Label>
            <Select
              value={item.modalityKey}
              onChange={(event) => handleModalityChange(event.target.value)}
            >
              {options.map((candidate) => (
                <option key={candidate.key} value={candidate.key}>
                  {candidate.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs">Peso (kg)</Label>
              <Input
                inputMode="decimal"
                value={item.quantity}
                onChange={(event) =>
                  onChange(index, { quantity: event.target.value })
                }
                placeholder="0"
              />
              {item.packMinKg !== null && (
                <p className="text-muted-foreground text-xs">
                  Mínimo {formatKilos(item.packMinKg)} kg
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Subtotal</Label>
              <div className="min-w-20 py-2 text-right text-base font-medium tabular-nums">
                {subtotal !== null ? formatMoney(subtotal) : '—'}
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">{modalityLabel}</p>
        </>
      )}
    </div>
  )
}
