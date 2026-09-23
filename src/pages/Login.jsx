import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { login as loginRequest, registro as registroRequest } from '../api/auth.api'
import { getOrganizationBySlug } from '../api/organizations.api'
import { OrganizationBrand } from '../components/layout/Brand'
import { useBranding } from '../context/BrandingContext'
import { isSystemPath } from '../hooks/useTenant'

const namePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/
const dniPattern = /^\d+$/
const passwordPattern = /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/

export default function Login() {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [organization, setOrganization] = useState(null)

  const loginForm = useForm({
    defaultValues: { email: '', password: '' },
  })

  const registroForm = useForm({
    defaultValues: { nombre: '', apellido: '', email: '', password: '', confirmPassword: '', sexo: '' },
  })

  const { login } = useAuth()
  const { branding } = useBranding()
  const navigate = useNavigate()
  const { tenantSlug } = useParams()
  const isSystem = isSystemPath(window.location.pathname)
  const appPath = (path) => tenantSlug ? `/${tenantSlug}${path}` : isSystem ? `/SystemMP${path}` : path

  useEffect(() => {
    if (!tenantSlug || isSystem) return
    getOrganizationBySlug(tenantSlug).then(setOrganization).catch(() => setOrganization(null))
  }, [tenantSlug, isSystem])

  async function handleLogin(values) {
    setError('')
    setLoading(true)
    try {
      const userData = await loginRequest(values)
      if (!isSystem && tenantSlug) {
        userData.organizationSlug = tenantSlug
        userData.organizationName = organization?.name
        userData.organizationLogoUrl = organization?.logoUrl
      }
      login(userData)
      navigate(appPath('/dashboard'), { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join('. ') : msg || 'No se pudo iniciar sesión. Verificá tus datos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegistro(values) {
    if (isSystem || !tenantSlug) {
      setError('El registro solo está disponible desde la URL de tu organización.')
      return
    }
    const { confirmPassword, ...payload } = values
    setError('')
    setLoading(true)
    try {
      const userData = await registroRequest(payload)
      userData.organizationSlug = tenantSlug
      login(userData)
      navigate(appPath('/perfil'), { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join('. ') : msg || 'No se pudo completar el registro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="court-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-ball/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <OrganizationBrand organization={isSystem ? branding : organization} />
          <p className="mt-1.5 text-sm text-muted-foreground">
            Torneos, fixtures y posiciones de tu club de tenis, en un solo lugar.
          </p>
        </div>

        <Card className="p-6">
          {!isSystem && (
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
              <button
                onClick={() => setMode('login')}
                className={`rounded-md py-2 transition-colors ${mode === 'login' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}
                type="button"
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setMode('registro')}
                className={`rounded-md py-2 transition-colors ${mode === 'registro' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}
                type="button"
              >
                Registrarme
              </button>
            </div>
          )}

          {error && (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  {...loginForm.register('email', {
                    required: 'El email es obligatorio',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Ingresá un email válido',
                    },
                  })}
                  error={Boolean(loginForm.formState.errors.email)}
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register('password', {
                    required: 'La contraseña es obligatoria',
                    minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
                  })}
                  error={Boolean(loginForm.formState.errors.password)}
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Sus datos son privados y no seran dibulgados.
                (<span className="font-mono text-foreground">Su contraseña es completamente privada</span>)
              </p>
            </form>
          ) : (
            <form onSubmit={registroForm.handleSubmit(handleRegistro)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    {...registroForm.register('nombre', {
                      required: 'El nombre es obligatorio',
                      pattern: { value: namePattern, message: 'Solo letras, sin espacios' },
                    })}
                    error={Boolean(registroForm.formState.errors.nombre)}
                  />
                  {registroForm.formState.errors.nombre && (
                    <p className="mt-1 text-xs text-destructive">{registroForm.formState.errors.nombre.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    {...registroForm.register('apellido', {
                      required: 'El apellido es obligatorio',
                      pattern: { value: namePattern, message: 'Solo letras, sin espacios' },
                    })}
                    error={Boolean(registroForm.formState.errors.apellido)}
                  />
                  {registroForm.formState.errors.apellido && (
                    <p className="mt-1 text-xs text-destructive">{registroForm.formState.errors.apellido.message}</p>
                  )}
                </div>
              </div>
{/*               <div>
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  inputMode="numeric"
                  {...registroForm.register('dni', {
                    required: 'El DNI es obligatorio',
                    pattern: { value: dniPattern, message: 'El DNI debe contener solo números' },
                  })}
                  error={Boolean(registroForm.formState.errors.dni)}
                />
                {registroForm.formState.errors.dni && (
                  <p className="mt-1 text-xs text-destructive">{registroForm.formState.errors.dni.message}</p>
                )}
              </div> */}
              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  {...registroForm.register('email', {
                    required: 'El email es obligatorio',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Ingresá un email válido',
                    },
                  })}
                  error={Boolean(registroForm.formState.errors.email)}
                />
                {registroForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">{registroForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="reg-sexo">Sexo</Label>
                <Select
                  id="reg-sexo"
                  {...registroForm.register('sexo', { required: 'El sexo es obligatorio' })}
                  error={Boolean(registroForm.formState.errors.sexo)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </Select>
                {registroForm.formState.errors.sexo && (
                  <p className="mt-1 text-xs text-destructive">{registroForm.formState.errors.sexo.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reg-password">Contraseña</Label>
                <Input
                  id="reg-password"
                  type="password"
                  {...registroForm.register('password', {
                    required: 'La contraseña es obligatoria',
                    minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                    pattern: {
                      value: passwordPattern,
                      message: 'Debe incluir mayúscula, minúscula y un número',
                    },
                  })}
                  error={Boolean(registroForm.formState.errors.password)}
                />
                {registroForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-destructive">{registroForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registroForm.register('confirmPassword', {
                    required: 'Debés confirmar la contraseña',
                    validate: (value, formValues) => value === formValues.password || 'Las contraseñas no coinciden',
                  })}
                  error={Boolean(registroForm.formState.errors.confirmPassword)}
                />
                {registroForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">{registroForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Los registros públicos siempre se crean con rol de jugador (usuario).
              </p>
            </form>
          )}
        </Card>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> Temporada 2026 · Circuito Amateur
        </p>
      </div>
    </div>
  )
}
