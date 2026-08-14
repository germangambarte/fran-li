import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { ProductFormPage } from '@/features/products/pages/ProductFormPage'
import { ProductListPage } from '@/features/products/pages/ProductListPage'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/productos" replace /> },
      { path: '/productos', element: <ProductListPage /> },
      { path: '/productos/nuevo', element: <ProductFormPage /> },
      { path: '/productos/:productId', element: <ProductFormPage /> },
    ],
  },
])
