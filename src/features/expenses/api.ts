import { supabase } from '@/lib/supabase'
import type { Expense } from '@/types/database'

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('franli_expenses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export interface SaveExpenseInput {
  id?: string
  concept: string
  amount: number
  note: string | null
  created_at: string
}

export async function saveExpense(input: SaveExpenseInput): Promise<void> {
  if (input.id) {
    const { error } = await supabase
      .from('franli_expenses')
      .update({
        description: input.concept,
        amount: input.amount,
        note: input.note,
        created_at: input.created_at,
      })
      .eq('id', input.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('franli_expenses')
      .insert({
        description: input.concept,
        amount: input.amount,
        note: input.note,
        created_at: input.created_at,
        payment_method: 'cash',
      })
    if (error) throw error
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('franli_expenses').delete().eq('id', id)
  if (error) throw error
}
