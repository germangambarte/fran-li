function requiredEnv(key: string): string {
  const value = import.meta.env[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `Falta la variable de entorno "${key}". Copiá .env.example a .env y configurala.`,
    )
  }
  return value
}

export const env = {
  supabaseUrl: requiredEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: requiredEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
} as const
