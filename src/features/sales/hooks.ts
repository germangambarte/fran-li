import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteSale, listSales, saveSale, type SaveSaleInput } from './api'

const salesKey = ['sales'] as const

export function useSales() {
  return useQuery({
    queryKey: salesKey,
    queryFn: listSales,
  })
}

export function useSaveSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveSaleInput) => saveSale(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: salesKey }),
  })
}

export function useDeleteSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSale(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: salesKey }),
  })
}
