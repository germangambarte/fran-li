import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/layout/EmptyState'
import { formatMoney } from '@/lib/format'
import type { PaymentMethod } from '@/types/database'
import { useSales } from '../hooks'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

export function SaleListPage() {
  const navigate = useNavigate()
  const { data: sales, isPending, isError, error } = useSales()

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <Button onClick={() => navigate('/ventas/nueva')}>
          <Plus />
          Nueva
        </Button>
      </header>

      {isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}

      {isError && (
        <p className="text-destructive text-sm">
          No se pudieron cargar las ventas. Revisá la conexión.
          {error instanceof Error ? ` (${error.message})` : ''}
        </p>
      )}

      {sales && sales.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title="Sin ventas todavía"
          description="Tocá el botón «Nueva» para registrar la primera venta."
        />
      )}

      <ul className="flex flex-col gap-2">
        {sales?.map((sale) => (
          <li key={sale.id}>
            <div
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border bg-card p-4"
              onClick={() => navigate(`/ventas/${sale.id}`)}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {dateFormatter.format(new Date(sale.created_at))}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(sale.total)}
                  </span>
                </div>
                <span className="text-muted-foreground truncate text-sm">
                  {sale.franli_sale_items
                    .map((item) => item.product_name)
                    .join(' · ')}
                </span>
                <span className="text-muted-foreground text-xs">
                  {paymentLabels[sale.payment_method]}
                  {sale.note ? ' · con observación' : ''}
                </span>
              </div>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
