import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { listProducts, saveProduct, setProductActive } from './api'
import type { ProductWithPrices } from './types'

const productsKey = ['products'] as const

export function useProducts() {
  return useQuery({
    queryKey: productsKey,
    queryFn: listProducts,
  })
}

export function useSaveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsKey }),
  })
}

export function useSetProductActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setProductActive(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: productsKey })
      const previous = queryClient.getQueryData<ProductWithPrices[]>(productsKey)
      if (previous) {
        queryClient.setQueryData(
          productsKey,
          previous.map((product) =>
            product.id === id ? { ...product, active } : product,
          ),
        )
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productsKey, context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productsKey }),
  })
}
