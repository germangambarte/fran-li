import { supabase } from '@/lib/supabase'
import type { PaymentMethod, SaleItem } from '@/types/database'
import { sumItems } from './pricing'
import type { NewSaleItem, SaleWithItems } from './types'

export async function listSales(): Promise<SaleWithItems[]> {
  const [salesResult, itemsResult] = await Promise.all([
    supabase
      .from('franli_sales')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('franli_sale_items').select('*'),
  ])
  if (salesResult.error) throw salesResult.error
  if (itemsResult.error) throw itemsResult.error

  const itemsBySale = new Map<string, SaleItem[]>()
  for (const item of itemsResult.data) {
    const list = itemsBySale.get(item.sale_id) ?? []
    list.push(item)
    itemsBySale.set(item.sale_id, list)
  }

  return salesResult.data.map((sale) => ({
    ...sale,
    franli_sale_items: itemsBySale.get(sale.id) ?? [],
  }))
}

export interface SaveSaleInput {
  id?: string
  payment_method: PaymentMethod
  note: string | null
  created_at: string
  items: NewSaleItem[]
}

export async function saveSale(input: SaveSaleInput): Promise<void> {
  const saleFields = {
    payment_method: input.payment_method,
    note: input.note,
    created_at: input.created_at,
    total: sumItems(input.items),
  }

  let saleId = input.id ?? null

  if (saleId) {
    const { error: updateError } = await supabase
      .from('franli_sales')
      .update(saleFields)
      .eq('id', saleId)
    if (updateError) throw updateError

    const { error: deleteError } = await supabase
      .from('franli_sale_items')
      .delete()
      .eq('sale_id', saleId)
    if (deleteError) throw deleteError
  } else {
    const { data, error: insertError } = await supabase
      .from('franli_sales')
      .insert(saleFields)
      .select('id')
      .single()
    if (insertError) throw insertError
    saleId = data.id
  }

  if (saleId && input.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('franli_sale_items')
      .insert(input.items.map((item) => ({ ...item, sale_id: saleId })))
    if (itemsError) throw itemsError
  }
}

export async function deleteSale(id: string): Promise<void> {
  const { error } = await supabase.from('franli_sales').delete().eq('id', id)
  if (error) throw error
}
