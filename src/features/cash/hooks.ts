import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import {
  deleteCashMovement,
  listCashMovements,
  saveCashMovement,
} from './api'
import type { SaveCashMovementInput } from './types'

export function useCashMovements() {
  return useQuery({
    queryKey: queryKeys.cashMovements,
    queryFn: listCashMovements,
  })
}

export function useSaveCashMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveCashMovementInput) => saveCashMovement(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.cashMovements }),
  })
}

export function useDeleteCashMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCashMovement(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.cashMovements }),
  })
}
