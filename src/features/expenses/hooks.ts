import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteExpense, listExpenses, saveExpense, type SaveExpenseInput } from './api'

const expensesKey = ['expenses'] as const

export function useExpenses() {
  return useQuery({
    queryKey: expensesKey,
    queryFn: listExpenses,
  })
}

export function useSaveExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveExpenseInput) => saveExpense(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesKey }),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesKey }),
  })
}
