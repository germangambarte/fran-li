export type PaymentMethod = 'cash' | 'transfer'

export type Product = {
  id: string
  name: string
  price_per_kg: number | null
  active: boolean
  created_at: string
}

export type ProductPrice = {
  id: string
  product_id: string
  min_kg: number
  price: number
}

export type Sale = {
  id: string
  created_by: string
  payment_method: PaymentMethod
  total: number
  note: string | null
  created_at: string
}

export type SaleItem = {
  id: string
  sale_id: string
  product_id: string | null
  product_name: string
  price_min_kg: number | null
  pack_price: number | null
  unit_price: number
  quantity: number
  subtotal: number
}

export type Expense = {
  id: string
  created_by: string
  description: string
  amount: number
  payment_method: PaymentMethod
  note: string | null
  created_at: string
}

export type CashMovementType =
  | 'opening'
  | 'sale'
  | 'expense'
  | 'cash_in'
  | 'cash_out'
  | 'closing'

export type CashMovement = {
  id: string
  created_by: string
  type: CashMovementType
  amount: number
  description: string | null
  note: string | null
  sale_id: string | null
  expense_id: string | null
  created_at: string
}

export type DailySummary = {
  day: string
  sales_count: number
  total: number
}

export type DailyBalance = {
  day: string
  sales: number
  expenses: number
}

export type Database = {
  public: {
    Tables: {
      franli_products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
        Relationships: []
      }
      franli_product_prices: {
        Row: ProductPrice
        Insert: Omit<ProductPrice, 'id' | 'created_at'>
        Update: Partial<Omit<ProductPrice, 'id' | 'created_at'>>
        Relationships: []
      }
      franli_sales: {
        Row: Sale
        Insert: Omit<Sale, 'id' | 'created_by'>
        Update: Partial<Omit<Sale, 'id' | 'created_by'>>
        Relationships: []
      }
      franli_sale_items: {
        Row: SaleItem
        Insert: Omit<SaleItem, 'id'>
        Update: Partial<Omit<SaleItem, 'id'>>
        Relationships: []
      }
      franli_expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_by'>
        Update: Partial<Omit<Expense, 'id' | 'created_by'>>
        Relationships: []
      }
      franli_cash_movements: {
        Row: CashMovement
        Insert: Omit<CashMovement, 'id' | 'created_by'>
        Update: Partial<Omit<CashMovement, 'id' | 'created_by'>>
        Relationships: []
      }
    }
    Views: {
      franli_daily_summary: {
        Row: DailySummary
        Relationships: []
      }
    }
    Functions: {
      franli_daily_balance: {
        Args: { tz: string }
        Returns: DailyBalance[]
      }
    }
    Enums: {
      payment_method: PaymentMethod
      cash_movement_type: CashMovementType
    }
    CompositeTypes: Record<never, never>
  }
}
