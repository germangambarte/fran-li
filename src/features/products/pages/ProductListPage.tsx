import { useNavigate } from 'react-router-dom'
import { ChevronRight, Drumstick, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/layout/EmptyState'
import { formatKilos, formatMoney } from '@/lib/format'
import { useProducts, useSetProductActive } from '../hooks'
import type { ProductWithPrices } from '../types'

function priceSummary(product: ProductWithPrices): string {
  const parts: string[] = []
  if (product.price_per_kg !== null) {
    parts.push(`${formatMoney(product.price_per_kg)} /kg`)
  }
  const prices = [...product.franli_product_prices].sort(
    (a, b) => a.min_kg - b.min_kg,
  )
  for (const price of prices) {
    parts.push(`${formatKilos(price.min_kg)} kg · ${formatMoney(price.price)}`)
  }
  return parts.join('  ·  ')
}

export function ProductListPage() {
  const navigate = useNavigate()
  const { data: products, isPending, isError, error } = useProducts()
  const setActive = useSetProductActive()

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <Button onClick={() => navigate('/productos/nuevo')}>
          <Plus />
          Nuevo
        </Button>
      </header>

      {isPending && (
        <p className="text-muted-foreground text-sm">Cargando…</p>
      )}

      {isError && (
        <p className="text-destructive text-sm">
          No se pudieron cargar los productos. Revisá la conexión y que estés
          autenticado.{error instanceof Error ? ` (${error.message})` : ''}
        </p>
      )}

      {products && products.length === 0 && (
        <EmptyState
          icon={Drumstick}
          title="Sin productos todavía"
          description="Tocá el botón «Nuevo» para cargar tu primer producto."
        />
      )}

      <ul className="flex flex-col gap-2">
        {products?.map((product) => (
          <li key={product.id}>
            <div
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border bg-card p-4"
              onClick={() => navigate(`/productos/${product.id}`)}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{product.name}</span>
                  {!product.active && (
                    <span className="text-muted-foreground rounded-full bg-muted px-2 py-0.5 text-xs">
                      inactivo
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground text-sm">
                  {priceSummary(product)}
                </span>
              </div>
              <Switch
                checked={product.active}
                onCheckedChange={(active) =>
                  setActive.mutate({ id: product.id, active })
                }
                onClick={(event) => event.stopPropagation()}
                aria-label={`Activar o desactivar ${product.name}`}
              />
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
