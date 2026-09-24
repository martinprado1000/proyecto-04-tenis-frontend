import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, CheckCircle, ArrowLeft, Trophy } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { OrganizationBrand } from '../components/layout/Brand'
import { getOrganizationBySlug } from '../api/organizations.api'
import { recoveryPassword as recoveryPasswordRequest } from '../api/auth.api'

export default function RecuperarPassword() {
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(10)

  const navigate = useNavigate()
  const { tenantSlug } = useParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({ defaultValues: { email: '' } })

  useEffect(() => {
    if (!tenantSlug) return
    getOrganizationBySlug(tenantSlug)
      .then(setOrganization)
      .catch(() => setOrganization(null))
  }, [tenantSlug])

  // Countdown y redirección luego del éxito
  useEffect(() => {
    if (!success) return
    if (countdown === 0) {
      navigate(`/${tenantSlug}/login`, { replace: true })
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [success, countdown, navigate, tenantSlug])

  async function onSubmit(values) {
    setError('')
    setLoading(true)
    try {
      await recoveryPasswordRequest({ email: values.email })
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message
      if (err.response?.status === 404) {
        setError('No existe ningún usuario registrado con ese email.')
      } else {
        setError(Array.isArray(msg) ? msg.join('. ') : msg || 'Ocurrió un error. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Background decorations */}
      <div className="court-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-ball/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <OrganizationBrand organization={organization} />
          <p className="mt-1.5 text-sm text-muted-foreground">
            Torneos, fixtures y posiciones de tu club de tenis, en un solo lugar.
          </p>
        </div>

        <Card className="p-6">
          {!success ? (
            <>
              {/* Title */}
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-lg font-semibold text-foreground">Recuperar contraseña</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ingresá tu email y te enviaremos una nueva contraseña temporal.
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="recovery-email">Email</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register('email', {
                      required: 'El email es obligatorio',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Ingresá un email válido',
                      },
                    })}
                    error={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? 'Enviando...' : 'Enviar nueva contraseña'}
                </Button>
              </form>

              {/* Back link */}
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate(`/${tenantSlug}/login`)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver al login
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center py-4 text-center">
              {/* Animated check */}
              <div className="relative mb-5">
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-9 w-9 text-green-500" />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-foreground">¡Email enviado!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Te enviamos una nueva contraseña temporal a
              </p>
              <p className="mt-1 rounded-md bg-muted px-3 py-1 font-mono text-sm font-medium text-foreground">
                {getValues('email')}
              </p>

              <p className="mt-4 text-sm text-muted-foreground">
                Revisá tu bandeja de entrada (y el spam por las dudas).
              </p>

              {/* Countdown bar */}
              <div className="mt-6 w-full">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Redirigiendo al login en...</span>
                  <span className="font-semibold text-primary">{countdown}s</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/${tenantSlug}/login`, { replace: true })}
                className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
              >
                Ir al login ahora
              </button>
            </div>
          )}
        </Card>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> Temporada 2026 · Circuito Amateur
        </p>
      </div>
    </div>
  )
}
