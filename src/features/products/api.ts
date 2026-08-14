import { supabase } from '@/lib/supabase'
import type { ProductPrice } from '@/types/database'
import type { ProductWithPrices, SaveProductInput } from './types'

export async function listProducts(): Promise<ProductWithPrices[]> {
  const [productsResult, pricesResult] = await Promise.all([
    supabase.from('franli_products').select('*').order('name'),
    supabase.from('franli_product_prices').select('*'),
  ])
  if (productsResult.error) throw productsResult.error
  if (pricesResult.error) throw pricesResult.error

  const pricesByProduct = new Map<string, ProductPrice[]>()
  for (const price of pricesResult.data) {
    const list = pricesByProduct.get(price.product_id) ?? []
    list.push(price)
    pricesByProduct.set(price.product_id, list)
  }

  return productsResult.data.map((product) => ({
    ...product,
    franli_product_prices: pricesByProduct.get(product.id) ?? [],
  }))
}

export async function saveProduct(input: SaveProductInput): Promise<void> {
  const productFields = {
    name: input.name,
    price_per_kg: input.price_per_kg,
    active: input.active,
  }

  let productId = input.id ?? null

  if (productId) {
    const { error: updateError } = await supabase
      .from('franli_products')
      .update(productFields)
      .eq('id', productId)
    if (updateError) throw updateError

    const { error: deleteError } = await supabase
      .from('franli_product_prices')
      .delete()
      .eq('product_id', productId)
    if (deleteError) throw deleteError
  } else {
    const { data, error: insertError } = await supabase
      .from('franli_products')
      .insert(productFields)
      .select('id')
      .single()
    if (insertError) throw insertError
    productId = data.id
  }

  if (input.prices.length > 0 && productId) {
    const { error: insertError } = await supabase
      .from('franli_product_prices')
      .insert(input.prices.map((price) => ({ ...price, product_id: productId })))
    if (insertError) throw insertError
  }
}

export async function setProductActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('franli_products')
    .update({ active })
    .eq('id', id)
  if (error) throw error
}
