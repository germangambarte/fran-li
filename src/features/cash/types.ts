export type CashMovementKind = 'cash_in' | 'cash_out'

export interface SaveCashMovementInput {
  id?: string
  kind: CashMovementKind
  concept: string
  amount: number
  note: string | null
  created_at: string
}
