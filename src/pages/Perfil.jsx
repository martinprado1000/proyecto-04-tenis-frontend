import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Input, Label, Select } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { getPerfil, updatePerfil } from '../api/perfil.api'


const namePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
const dniPattern = /^\d+$/
const passwordPattern = /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*/

function normalizeSexo(value) {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'MASCULINO') return 'Masculino'
  if (normalized === 'FEMENINO') return 'Femenino'
  return value || ''
}

export default function Perfil() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      ...user,
      sexo: normalizeSexo(user?.sexo),
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password') || ''

  useEffect(() => {
    let mounted = true
    getPerfil(user).then((data) => {
      if (mounted) {
        const normalized = {
          ...data,
          sexo: normalizeSexo(data?.sexo),
          password: '',
          confirmPassword: '',
        }
        reset(normalized)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [reset, user])


  async function onSubmit(data) {
    setSaving(true)
    try {
      const normalized = {
        ...data,
        sexo: data.sexo?.toUpperCase(),
        ...(data.password ? { password: data.password, confirmPassword: data.confirmPassword } : {}),
      }
      const updated = await updatePerfil(normalized)
      setUser((prev) => ({ ...prev, ...updated }))
      setSavedOk(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Cuenta"
        title="Mi Perfil"
        description="Mantené tus datos personales y deportivos actualizados para torneos y comunicaciones del club."
      />

      <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando datos del perfil...</p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      {...register('nombre', {
                        required: 'El nombre es obligatorio',
                        pattern: { value: namePattern, message: 'Solo se permiten letras' },
                      })}
                      error={Boolean(errors.nombre)}
                    />
                    {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      {...register('apellido', {
                        required: 'El apellido es obligatorio',
                        pattern: { value: namePattern, message: 'Solo se permiten letras' },
                      })}
                      error={Boolean(errors.apellido)}
                    />
                    {errors.apellido && <p className="mt-1 text-xs text-destructive">{errors.apellido.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                      id="dni"
                      inputMode="numeric"
                      {...register('dni', {
                        pattern: { value: dniPattern, message: 'El DNI debe contener solo números' },
                      })}
                      error={Boolean(errors.dni)}
                    />
                    {errors.dni && <p className="mt-1 text-xs text-destructive">{errors.dni.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', {
                        required: 'El email es obligatorio',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingresá un email válido' },
                      })}
                      error={Boolean(errors.email)}
                    />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="telefono">Número telefónico</Label>
                    <Input id="telefono" type="tel" placeholder="+5493415551234" {...register('telefono')} />
                    <p className="mt-1 text-xs text-muted-foreground">Número telefónico en formato internacional</p>
                  </div>

                  <div>
                    <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      {...register('fechaNacimiento')}
                      error={Boolean(errors.fechaNacimiento)}
                    />
                    {errors.fechaNacimiento && <p className="mt-1 text-xs text-destructive">{errors.fechaNacimiento.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="sexo">Sexo</Label>
                    <Select id="sexo" {...register('sexo')} error={Boolean(errors.sexo)}>
                      <option value="">Seleccionar...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </Select>
                    {errors.sexo && <p className="mt-1 text-xs text-destructive">{errors.sexo.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" {...register('password', {
                      validate: (value) => !value || (value.length >= 8 && passwordPattern.test(value)) || 'Debe tener 8 caracteres, mayúscula, minúscula y número o símbolo',
                    })} error={Boolean(errors.password)} />
                    {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input id="confirmPassword" type="password" {...register('confirmPassword', {
                      validate: (value) => !password || value === password || 'Las contraseñas no coinciden',
                    })} error={Boolean(errors.confirmPassword)} />
                    {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
                  </div>

                  {false && (
                    <div className="sm:col-span-2 rounded-xl border border-emerald-500/60 bg-emerald-500/5 px-4 pb-5 pt-3 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]">
                      <div className="mb-3 border-b border-emerald-500/30 pb-2">
                        <p className="text-sm font-semibold text-emerald-400">Single</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="categoriaSingle">Categoría Single</Label>
                          <Select
                            id="categoriaSingle"
                            {...register('categoriaSingle', {
                              validate: (value) => !esSingle || value?.trim() !== '' || 'Seleccioná la categoría de Single',
                            })}
                            error={Boolean(errors.categoriaSingle)}
                          >
                            <option value="">Seleccionar...</option>
                            {CATEGORIAS.map((item) => <option key={item} value={item}>{item}</option>)}
                          </Select>
                          {errors.categoriaSingle && <p className="mt-1 text-xs text-destructive">{errors.categoriaSingle.message}</p>}
                        </div>

                        <div>
                          <Label htmlFor="enJuegoSingle">En juego single</Label>
                          <Select id="enJuegoSingle" {...register('enJuegoSingle')} defaultValue="">
                            <option value="">Seleccionar...</option>
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {false && (
                    <div className="sm:col-span-2 rounded-xl border border-emerald-500/60 bg-emerald-500/5 px-4 pb-5 pt-3 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]">
                      <div className="mb-3 border-b border-emerald-500/30 pb-2">
                        <p className="text-sm font-semibold text-emerald-400">Dobles</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="categoriaDobles">Categoría Dobles</Label>
                          <Select
                            id="categoriaDobles"
                            {...register('categoriaDobles', {
                              validate: (value) => !esDobles || value?.trim() !== '' || 'Seleccioná la categoría de Dobles',
                            })}
                            error={Boolean(errors.categoriaDobles)}
                          >
                            <option value="">Seleccionar...</option>
                            {CATEGORIAS.map((item) => <option key={item} value={item}>{item}</option>)}
                          </Select>
                          {errors.categoriaDobles && <p className="mt-1 text-xs text-destructive">{errors.categoriaDobles.message}</p>}
                        </div>

                        <div>
                          <Label htmlFor="enJuegoDobles">En juego dobles</Label>
                          <Select id="enJuegoDobles" {...register('enJuegoDobles')} defaultValue="">
                            <option value="">Seleccionar...</option>
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                          </Select>
                        </div>

                        <div className="sm:col-span-2">
                          <Label htmlFor="nombreEquipo">Nombre de equipo</Label>
                          <Input
                            id="nombreEquipo"
                            {...register('nombreEquipo', {
                              validate: (value) => !esDobles || value?.trim() !== '' || 'El nombre de equipo es obligatorio para Dobles',
                            })}
                            error={Boolean(errors.nombreEquipo)}
                          />
                          {errors.nombreEquipo && <p className="mt-1 text-xs text-destructive">{errors.nombreEquipo.message}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" loading={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                  {savedOk && <span className="text-sm text-primary">Cambios guardados correctamente.</span>}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
