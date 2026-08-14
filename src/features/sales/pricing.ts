import type { ProductWithPrices } from '@/features/products/types'
import { formatKilos, formatMoney, parseDecimal, round2 } from '@/lib/format'
import type { NewSaleItem, SaleItemDraft } from './types'

export interface ModalityOption {
  key: string
  label: string
  minKg: number | null
  unitPrice: number
  packPrice: number | null
}

export function modalityOptions(product: ProductWithPrices): ModalityOption[] {
  const options: ModalityOption[] = []
  if (product.price_per_kg !== null) {
    options.push({
      key: 'per_kg',
      label: `Por kilo · ${formatMoney(product.price_per_kg)}`,
      minKg: null,
      unitPrice: product.price_per_kg,
      packPrice: null,
    })
  }
  const prices = [...product.franli_product_prices].sort(
    (a, b) => a.min_kg - b.min_kg,
  )
  for (const price of prices) {
    options.push({
      key: `pack:${price.min_kg}`,
      label: `${formatKilos(price.min_kg)} kg → ${formatMoney(price.price)}`,
      minKg: price.min_kg,
      unitPrice: price.price / price.min_kg,
      packPrice: price.price,
    })
  }
  return options
}

export function defaultModality(
  product: ProductWithPrices,
): ModalityOption | undefined {
  return modalityOptions(product)[0]
}

export function lineSubtotal(item: SaleItemDraft): number | null {
  const quantity = parseDecimal(item.quantity)
  if (quantity === null || quantity <= 0) return null
  if (
    item.packPrice !== null &&
    item.packMinKg !== null &&
    quantity === item.packMinKg
  ) {
    return item.packPrice
  }
  return round2(item.pricePerKg * quantity)
}

export function sumItems(items: NewSaleItem[]): number {
  return round2(items.reduce((acc, item) => acc + item.subtotal, 0))
}
