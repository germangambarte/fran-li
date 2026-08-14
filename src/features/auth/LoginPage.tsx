import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Drumstick } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { useAuth } from './AuthContext'

interface LocationState {
  from?: { pathname: string }
}

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirmá tu email antes de ingresar.'
  }
  if (lower.includes('rate limit')) {
    return 'Demasiados intentos. Esperá un momento y volvé a intentar.'
  }
  return message
}

export function LoginPage() {
  const { user, isInitializing, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/productos'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isInitializing) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : String(err)))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="bg-primary shadow-primary/30 flex size-16 items-center justify-center rounded-2xl shadow-lg">
          <Drumstick className="text-primary-foreground size-9" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Fran Li</h1>
          <p className="text-muted-foreground text-sm">
            Tu negocio de pollo, simple y ordenado.
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Ingresar</CardTitle>
          <CardDescription>
            Entrá con tu email y contraseña para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vos@ejemplo.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
