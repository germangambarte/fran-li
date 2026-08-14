import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { CashFormPage } from '@/features/cash/pages/CashFormPage'
import { CashListPage } from '@/features/cash/pages/CashListPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ExpenseFormPage } from '@/features/expenses/pages/ExpenseFormPage'
import { ExpenseListPage } from '@/features/expenses/pages/ExpenseListPage'
import { ProductFormPage } from '@/features/products/pages/ProductFormPage'
import { ProductListPage } from '@/features/products/pages/ProductListPage'
import { SaleFormPage } from '@/features/sales/pages/SaleFormPage'
import { SaleListPage } from '@/features/sales/pages/SaleListPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/caja', element: <CashListPage /> },
          { path: '/caja/nuevo', element: <CashFormPage /> },
          { path: '/caja/:movementId', element: <CashFormPage /> },
          { path: '/productos', element: <ProductListPage /> },
          { path: '/productos/nuevo', element: <ProductFormPage /> },
          { path: '/productos/:productId', element: <ProductFormPage /> },
          { path: '/ventas', element: <SaleListPage /> },
          { path: '/ventas/nueva', element: <SaleFormPage /> },
          { path: '/ventas/:saleId', element: <SaleFormPage /> },
          { path: '/gastos', element: <ExpenseListPage /> },
          { path: '/gastos/nuevo', element: <ExpenseFormPage /> },
          { path: '/gastos/:expenseId', element: <ExpenseFormPage /> },
        ],
      },
    ],
  },
])
