import type { Sale, SaleItem } from '@/types/database'

export interface SaleWithItems extends Sale {
  franli_sale_items: SaleItem[]
}

export interface SaleItemDraft {
  productId: string
  modalityKey: string
  quantity: string
  pricePerKg: number
  packMinKg: number | null
  packPrice: number | null
}

export interface NewSaleItem {
  product_id: string | null
  product_name: string
  price_min_kg: number | null
  pack_price: number | null
  unit_price: number
  quantity: number
  subtotal: number
}
