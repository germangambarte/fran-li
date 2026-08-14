import { supabase } from '@/lib/supabase'
import type { CashMovement } from '@/types/database'
import type { SaveCashMovementInput } from './types'

export async function listCashMovements(): Promise<CashMovement[]> {
  const { data, error } = await supabase
    .from('franli_cash_movements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveCashMovement(
  input: SaveCashMovementInput,
): Promise<void> {
  const fields = {
    type: input.kind,
    description: input.concept,
    amount: input.amount,
    note: input.note,
    created_at: input.created_at,
  }

  if (input.id) {
    const { error } = await supabase
      .from('franli_cash_movements')
      .update(fields)
      .eq('id', input.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('franli_cash_movements')
      .insert({ ...fields, sale_id: null, expense_id: null })
    if (error) throw error
  }
}

export async function deleteCashMovement(id: string): Promise<void> {
  const { error } = await supabase
    .from('franli_cash_movements')
    .delete()
    .eq('id', id)
  if (error) throw error
}
