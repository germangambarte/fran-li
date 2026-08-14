import { round2 } from '@/lib/format'
import type { CashMovement, Expense, Sale } from '@/types/database'

export interface CashSummary {
  /** Ganancia acumulada = ventas - gastos. Nunca la modifican los movimientos de caja. */
  profit: number
  /** Total retirado (cash_out). Disminuye el dinero disponible. */
  withdrawals: number
  /** Ajustes de caja (cash_in). Aumentan el dinero disponible. */
  adjustments: number
  /** Dinero disponible = ganancia - retiros + ajustes. Los gastos ya restan en la ganancia. */
  available: number
}

export function computeCashSummary(
  sales: Sale[],
  expenses: Expense[],
  movements: CashMovement[],
): CashSummary {
  let salesTotal = 0
  for (const sale of sales) {
    salesTotal += sale.total
  }

  let expensesTotal = 0
  for (const expense of expenses) {
    expensesTotal += expense.amount
  }

  let withdrawals = 0
  let adjustments = 0
  for (const movement of movements) {
    if (movement.type === 'cash_out') withdrawals += movement.amount
    if (movement.type === 'cash_in') adjustments += movement.amount
  }

  const profit = round2(salesTotal - expensesTotal)
  const totalWithdrawals = round2(withdrawals)
  const totalAdjustments = round2(adjustments)

  return {
    profit,
    withdrawals: totalWithdrawals,
    adjustments: totalAdjustments,
    available: round2(profit - totalWithdrawals + totalAdjustments),
  }
}
