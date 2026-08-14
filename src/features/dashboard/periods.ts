import { round2 } from '@/lib/format'
import type { Expense, Sale } from '@/types/database'

export type PeriodId = 'today' | 'last7' | 'month'

export interface BalancePeriod {
  id: PeriodId
  label: string
  from: Date
  to: Date
}

export interface PeriodTotals {
  sales: number
  expenses: number
  profit: number
  salesCount: number
  expensesCount: number
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function startOfMonth(date: Date): Date {
  const result = new Date(date)
  result.setDate(1)
  result.setHours(0, 0, 0, 0)
  return result
}

export function buildPeriods(now = new Date()): BalancePeriod[] {
  const today = startOfDay(now)
  const last7 = new Date(today)
  last7.setDate(today.getDate() - 6)
  const month = startOfMonth(now)

  return [
    { id: 'today', label: 'Hoy', from: today, to: now },
    { id: 'last7', label: '7 días', from: last7, to: now },
    { id: 'month', label: 'Mes', from: month, to: now },
  ]
}

export function computeTotals(
  period: BalancePeriod,
  sales: Sale[],
  expenses: Expense[],
): PeriodTotals {
  const fromMs = period.from.getTime()
  const toMs = period.to.getTime()

  let salesTotal = 0
  let salesCount = 0
  for (const sale of sales) {
    const time = new Date(sale.created_at).getTime()
    if (time >= fromMs && time <= toMs) {
      salesTotal += sale.total
      salesCount++
    }
  }

  let expensesTotal = 0
  let expensesCount = 0
  for (const expense of expenses) {
    const time = new Date(expense.created_at).getTime()
    if (time >= fromMs && time <= toMs) {
      expensesTotal += expense.amount
      expensesCount++
    }
  }

  return {
    sales: round2(salesTotal),
    expenses: round2(expensesTotal),
    profit: round2(salesTotal - expensesTotal),
    salesCount,
    expensesCount,
  }
}
