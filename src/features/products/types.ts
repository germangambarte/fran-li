import type { Product, ProductPrice } from '@/types/database'

export interface ProductWithPrices extends Product {
  franli_product_prices: ProductPrice[]
}

export interface PriceInput {
  min_kg: number
  price: number
}

export interface SaveProductInput {
  id?: string
  name: string
  price_per_kg: number | null
  active: boolean
  prices: PriceInput[]
}
