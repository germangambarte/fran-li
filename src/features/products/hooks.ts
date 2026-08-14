import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { listProducts, saveProduct, setProductActive } from './api'
import type { ProductWithPrices } from './types'

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: listProducts,
  })
}

export function useSaveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveProduct,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
  })
}

export function useSetProductActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setProductActive(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products })
      const previous = queryClient.getQueryData<ProductWithPrices[]>(
        queryKeys.products,
      )
      if (previous) {
        queryClient.setQueryData(
          queryKeys.products,
          previous.map((product) =>
            product.id === id ? { ...product, active } : product,
          ),
        )
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.products, context.previous)
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
  })
}
