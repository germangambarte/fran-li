import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'

export interface DailyHistory {
  day: string
  sales: number
  expenses: number
  profit: number
}

export function useDailyHistory() {
  return useQuery({
    queryKey: queryKeys.dailyBalance,
    queryFn: async (): Promise<DailyHistory[]> => {
      const tz =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      const { data, error } = await supabase.rpc('franli_daily_balance', { tz })
      if (error) throw new Error(error.message)
      return (data ?? []).map((row) => ({
        day: row.day,
        sales: row.sales,
        expenses: row.expenses,
        profit: row.sales - row.expenses,
      }))
    },
  })
}
