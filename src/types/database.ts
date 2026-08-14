export type PaymentMethod = 'cash' | 'transfer'

export interface Product {
  id: string
  name: string
  price_per_kg: number | null
  active: boolean
  created_at: string
}

export interface ProductPrice {
  id: string
  product_id: string
  min_kg: number
  price: number
}

export interface Sale {
  id: string
  created_by: string
  payment_method: PaymentMethod
  total: number
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string | null
  product_name: string
  unit_price: number
  quantity: number
  subtotal: number
}

export interface DailyClosing {
  id: string
  date: string
  opening: number
  observed: number | null
  notes: string | null
  closed_at: string | null
  created_by: string
}

export interface DailySummary {
  day: string
  sales_count: number
  total: number
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
        Relationships: []
      }
      product_prices: {
        Row: ProductPrice
        Insert: Omit<ProductPrice, 'id'>
        Update: Partial<Omit<ProductPrice, 'id'>>
        Relationships: []
      }
      sales: {
        Row: Sale
        Insert: Omit<Sale, 'id' | 'created_by' | 'created_at'>
        Update: Partial<Omit<Sale, 'id' | 'created_by' | 'created_at'>>
        Relationships: []
      }
      sale_items: {
        Row: SaleItem
        Insert: Omit<SaleItem, 'id'>
        Update: Partial<Omit<SaleItem, 'id'>>
        Relationships: []
      }
      daily_closings: {
        Row: DailyClosing
        Insert: Omit<DailyClosing, 'id' | 'created_by'>
        Update: Partial<Omit<DailyClosing, 'id' | 'created_by'>>
        Relationships: []
      }
    }
    Views: {
      daily_summary: {
        Row: DailySummary
        Relationships: []
      }
    }
    Functions: Record<never, never>
    Enums: {
      payment_method: PaymentMethod
    }
    CompositeTypes: Record<never, never>
  }
}
