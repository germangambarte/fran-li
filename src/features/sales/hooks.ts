import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { deleteSale, listSales, saveSale, type SaveSaleInput } from './api'

export function useSales() {
  return useQuery({
    queryKey: queryKeys.sales,
    queryFn: listSales,
  })
}

export function useSaveSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveSaleInput) => saveSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales })
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyBalance })
    },
  })
}

export function useDeleteSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales })
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyBalance })
    },
  })
}
