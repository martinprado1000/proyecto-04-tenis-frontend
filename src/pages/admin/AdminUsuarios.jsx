import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTenant } from '../../hooks/useTenant'
import { useForm } from 'react-hook-form'
import { ChevronLeft, ChevronRight, ChevronsUpDown, Pencil, ShieldCheck, UserPlus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Label, Select } from '../../components/ui/Input'
import { getUsuarios, updateUsuario, crearUsuario, eliminarUsuario } from '../../api/admin.api'
import { getOrganizations, getOrganizationBySlug } from '../../api/organizations.api'

const namePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
const dniPattern = /^\d+$/
const CATEGORIAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const USUARIO_VACIO = {
  nombre: '', apellido: '', dni: '', telefono: '', sexo: '', categoria: '', email: '', fechaNacimiento: '',
  organizationId: '', activo: true, isClient: 'false', rol: 'user', password: '', confirmPassword: '',
}

function FormularioUsuario({ register, errors, watch, organizations, showOrganization, showIsClient = false }) {
  // Sexo obligatorio and club fixed handled by form validation and mock data
  const passwordPattern = /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*/
  const pwd = watch('password')

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="u-nombre">Nombre</Label>
        <Input
          id="u-nombre"
          {...register('nombre', {
            required: 'El nombre es obligatorio',
            pattern: { value: namePattern, message: 'Solo se permiten letras' },
          })}
          error={Boolean(errors.nombre)}
        />
        {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>}
      </div>

      <div>
        <Label htmlFor="u-apellido">Apellido</Label>
        <Input
          id="u-apellido"
          {...register('apellido', {
            required: 'El apellido es obligatorio',
            pattern: { value: namePattern, message: 'Solo se permiten letras' },
          })}
          error={Boolean(errors.apellido)}
        />
        {errors.apellido && <p className="mt-1 text-xs text-destructive">{errors.apellido.message}</p>}
      </div>

      <div>
        <Label htmlFor="u-dni">DNI</Label>
        <Input
          id="u-dni"
          inputMode="numeric"
          {...register('dni', {
            pattern: { value: dniPattern, message: 'El DNI debe contener solo números' },
          })}
          error={Boolean(errors.dni)}
        />
        {errors.dni && <p className="mt-1 text-xs text-destructive">{errors.dni.message}</p>}
      </div>

      <div>
        <Label htmlFor="u-telefono">Número telefónico</Label>
        <Input id="u-telefono" type="tel" placeholder="+5493415551234" {...register('telefono')} />
        <p className="mt-1 text-xs text-muted-foreground">Número telefónico en formato internacional</p>
      </div>

      <div>
        <Label htmlFor="u-email">Email</Label>
        <Input
          id="u-email"
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
        <Label htmlFor="u-fechaNacimiento">Fecha de nacimiento</Label>
        <Input
          id="u-fechaNacimiento"
          type="date"
          {...register('fechaNacimiento')}
          error={Boolean(errors.fechaNacimiento)}
        />
        {errors.fechaNacimiento && <p className="mt-1 text-xs text-destructive">{errors.fechaNacimiento.message}</p>}
      </div>

      {showOrganization && <div>
        <Label htmlFor="u-organizacion">Organización</Label>
        <Select id="u-organizacion" {...register('organizationId', { required: 'Seleccioná una organización' })} error={Boolean(errors.organizationId)}>
          <option value="">Seleccionar...</option>
          {organizations.map((organization) => <option key={organization._id || organization.id} value={organization._id || organization.id}>{organization.name}</option>)}
        </Select>
        {errors.organizationId && <p className="mt-1 text-xs text-destructive">{errors.organizationId.message}</p>}
      </div>}

      <div>
        <Label htmlFor="u-sexo">Sexo</Label>
        <Select id="u-sexo" {...register('sexo', { required: 'El sexo es obligatorio' })} error={Boolean(errors.sexo)}>
          <option value="">Seleccionar...</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </Select>
        {errors.sexo && <p className="mt-1 text-xs text-destructive">{errors.sexo.message}</p>}
      </div>

      {/* Removed torneo-related fields (torneo, enJuegoSingle, enJuegoDobles, nombreEquipo) per requirements */}

      {/* <div>
        <Label htmlFor="u-enjuego">En Juego</Label>
        <Select id="u-enjuego" {...register('enJuego')} error={Boolean(errors.enJuego)} defaultValue="">
          <option value="">Seleccionar...</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </Select>
      </div> */}

      <div>
        <Label htmlFor="u-categoria">Categoría</Label>
        <Select id="u-categoria" {...register('categoria')}>
          <option value="">Seleccionar...</option>
          {CATEGORIAS.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
        </Select>
      </div>

      <div>
        <Label htmlFor="u-activo">Activo</Label>
        <Select id="u-activo" {...register('activo')} error={Boolean(errors.activo)}>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </Select>
      </div>

      {showIsClient && <div>
        <Label htmlFor="u-es-cliente">Es cliente</Label>
        <Select id="u-es-cliente" {...register('isClient')}>
          <option value="false">NO</option>
          <option value="true">SI</option>
        </Select>
      </div>}

      <div>
        <Label htmlFor="u-rol">Rol</Label>
        <Select id="u-rol" {...register('rol', { required: 'Seleccioná un rol' })} error={Boolean(errors.rol)}>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </Select>
        {errors.rol && <p className="mt-1 text-xs text-destructive">{errors.rol.message}</p>}
      </div>

      <div>
        <Label htmlFor="u-password">Contraseña</Label>
        <Input
          id="u-password"
          type="password"
          {...register('password', {
            validate: (v) => {
              if (!v) return true
              if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
              if (!passwordPattern.test(v)) return 'Debe incluir mayúscula, minúscula y un número'
              return true
            },
          })}
          error={Boolean(errors.password)}
        />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        {!showOrganization && <p className="mt-1 text-xs font-semibold text-emerald-500">Si el usuario NO TIENE contraseña se le asignará: Usuario123*</p>}
      </div>

      <div>
        <Label htmlFor="u-confirmPassword">Confirmar contraseña</Label>
        <Input
          id="u-confirmPassword"
          type="password"
          {...register('confirmPassword', {
            validate: (v) => {
              if (!pwd) return true
              return v === pwd || 'Las contraseñas no coinciden'
            },
          })}
          error={Boolean(errors.confirmPassword)}
        />
        {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>
    </div>
  )
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [creando, setCreando] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [pagina, setPagina] = useState(0)
  const [filasPorPagina, setFilasPorPagina] = useState(10)
  const [orden, setOrden] = useState({ campo: '', direccion: 'asc' })
  const isSystem = useLocation().pathname.startsWith('/SystemMP')
  const { tenantSlug } = useTenant()
  const navigate = useNavigate()

  const editForm = useForm({ defaultValues: form || USUARIO_VACIO })
  const createForm = useForm({ defaultValues: form || USUARIO_VACIO })

  useEffect(() => {
    setLoading(true)
    getUsuarios().then((data) => {
      setUsuarios(data)
      setPagina(0)
    }).finally(() => setLoading(false))
  }, [])

  const [filtroOrganizacion, setFiltroOrganizacion] = useState('')

  function alternarOrden(campo) {
    setOrden((actual) => actual.campo === campo
      ? { campo, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
      : { campo, direccion: 'asc' })
    setPagina(0)
  }

  function valorOrden(usuario, campo) {
    if (campo === 'organizacion') {
      return organizations.find((org) => String(org._id || org.id) === String(usuario.organizationId))?.name || 'Sin organización'
    }
    return usuario[campo] || ''
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    if (!filtroOrganizacion) return true
    return String(usuario.organizationId) === String(filtroOrganizacion)
  })

  const usuariosOrdenados = [...usuariosFiltrados].sort((a, b) => {
    if (!orden.campo) return 0
    const resultado = String(valorOrden(a, orden.campo)).localeCompare(String(valorOrden(b, orden.campo)), 'es', { sensitivity: 'base' })
    return orden.direccion === 'asc' ? resultado : -resultado
  })
  const totalPaginas = Math.max(1, Math.ceil(usuariosOrdenados.length / filasPorPagina))
  const usuariosPagina = usuariosOrdenados.slice(pagina * filasPorPagina, pagina * filasPorPagina + filasPorPagina)

  useEffect(() => {
    if (isSystem) getOrganizations().then(setOrganizations).catch(() => setOrganizations([]))
  }, [isSystem])

  useEffect(() => {
    if (!isSystem && tenantSlug) {
      getOrganizationBySlug(tenantSlug)
        .then((organization) => setOrganizations(organization ? [organization] : []))
        .catch(() => setOrganizations([]))
    }
  }, [isSystem, tenantSlug])

  useEffect(() => {
    if (form) {
      const normalized = {
        ...form,
        activo: String(form.activo ?? true),
        isClient: String(form.isClient ?? false),
      }
      editForm.reset(normalized)
      createForm.reset(normalized)
    }
  }, [form, editForm, createForm])

  function abrirEdicion(usuario) {
    setFormError('')
    setEditando(usuario)
    setForm(usuario)
  }

  function abrirCreacion() {
    const organizationId = !isSystem ? organizations[0]?._id || organizations[0]?.id || '' : ''
    setFormError('')
    setCreando(true)
    setForm({ ...USUARIO_VACIO, organizationId })
  }

  function abrirEliminar(usuario) {
    setEliminando(usuario)
  }

  function cerrarModal() {
    setEditando(null)
    setCreando(false)
    setEliminando(null)
    setForm(null)
    setFormError('')
  }

  function getBackendError(error, fallback) {
    const message = error?.response?.data?.message
    if (Array.isArray(message)) return message.join('. ')
    if (typeof message === 'string' && message.trim()) return message
    return error?.response?.data?.error || fallback
  }

  async function guardarEdicion(data) {
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        ...data,
        activo: String(data.activo) === 'true',
      }
      const actualizado = await updateUsuario(editando.id, payload)
      setUsuarios((prev) => prev.map((u) => (u.id === editando.id ? { ...u, ...actualizado } : u)))
      cerrarModal()
    } catch (err) {
      console.error('Error al actualizar usuario:', err)
      setFormError(getBackendError(err, 'No se pudo actualizar el usuario. Revisá los datos e intentá nuevamente.'))
    } finally {
      setSaving(false)
    }
  }

  async function guardarCreacion(data) {
    setSaving(true)
    setFormError('')
    try {
      const defaultPassword = 'Usuario123*'
      const password = data.password || defaultPassword
      const payload = {
        ...data,
        password,
        confirmPassword: data.confirmPassword || password,
        activo: String(data.activo) === 'true',
        organizationId: !isSystem ? organizations[0]?._id || organizations[0]?.id : data.organizationId,
      }
      const nuevo = await crearUsuario(payload)
      setUsuarios((prev) => [nuevo, ...prev])
      cerrarModal()
    } catch (err) {
      console.error('Error al crear usuario:', err)
      setFormError(getBackendError(err, 'No se pudo crear el usuario. Revisá los datos e intentá nuevamente.'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmarEliminar() {
    if (!eliminando) return
    setSaving(true)
    try {
      await eliminarUsuario(eliminando.id)
      setUsuarios((prev) => prev.filter((u) => u.id !== eliminando.id))
      cerrarModal()
    } catch (err) {
      console.error('Error al eliminar usuario:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Panel exclusivo de administración"
        title="Administración de Usuarios"
        description="Gestioná los jugadores registrados, su organización, estado y rol de cuenta."
      />

      <div className="px-6 py-8 sm:px-8">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-[18px] w-[18px] text-court" />
              Jugadores registrados
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="admin">{usuariosOrdenados.length} usuarios {filtroOrganizacion ? '(filtrados)' : ''} · página {pagina + 1} de {totalPaginas}</Badge>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(isSystem ? '/SystemMP/admin/importar_usuarios' : `/${tenantSlug}/admin/importar_usuarios`)}
                >
                  Importar usuarios
                </Button>
                <Button size="sm" onClick={abrirCreacion}>
                  <UserPlus className="h-4 w-4" /> Crear Nuevo Usuario
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
            ) : (
              <>
              <Table>
                <THead>
                  <TR>
                    <TH>Jugador</TH>
                    <TH>
                      <button type="button" onClick={() => alternarOrden('sexo')} className="inline-flex items-center gap-1 hover:text-foreground">
                        Sexo <ChevronsUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TH>
                    <TH>
                      <button type="button" onClick={() => alternarOrden('categoria')} className="inline-flex items-center gap-1 hover:text-foreground">
                        Categoría <ChevronsUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TH>
                    <TH>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button type="button" onClick={() => alternarOrden('organizacion')} className="inline-flex items-center gap-1 hover:text-foreground font-semibold">
                          Organización <ChevronsUpDown className="h-3.5 w-3.5" />
                        </button>
                        {isSystem && organizations.length > 0 && (
                          <select
                            value={filtroOrganizacion}
                            onChange={(e) => {
                              setFiltroOrganizacion(e.target.value)
                              setPagina(0)
                            }}
                            className="h-7 text-xs rounded-lg border border-border bg-background px-2 py-0.5 font-normal text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            title="Filtrar por organización"
                          >
                            <option value="">Todas</option>
                            {organizations.map((org) => (
                              <option key={org._id || org.id} value={org._id || org.id}>
                                {org.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </TH>
                    <TH>Activo en torneos</TH>
                    <TH>Es cliente</TH>
                    <TH>Rol</TH>
                    <TH className="text-right">Acción</TH>
                  </TR>
                </THead>
                <TBody>
                  {usuariosPagina.map((u) => {


                    return (
                      <TR key={u.id}>
                        <TD className="font-medium">{u.nombre} {u.apellido}</TD>
                        <TD className="text-muted-foreground">
                          <Badge variant={u.sexo === 'Masculino' ? 'masculino' : u.sexo === 'Femenino' ? 'femenino' : 'outline'}>
                            {u.sexo}
                          </Badge>
                        </TD>
                        <TD className="text-muted-foreground">{u.categoria || '—'}</TD>
                        <TD className="text-muted-foreground">{organizations.find((org) => (org._id || org.id) === u.organizationId)?.name || 'Sin organización'}</TD>
                        <TD>
                          <Badge variant={u.activo ? 'success' : 'destructive'}>{u.activo ? 'Sí' : 'No'}</Badge>
                        </TD>
                        <TD>
                          <Badge variant={u.isClient ? 'success' : 'outline'}>{u.isClient ? 'Sí' : 'No'}</Badge>
                        </TD>
                        <TD>
                          <Badge variant={u.rol === 'admin' ? 'admin' : 'outline'}>
                            {u.rol === 'admin' ? 'Administrador' : 'Usuario'}
                          </Badge>
                        </TD>
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => abrirEdicion(u)}>
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => abrirEliminar(u)}>
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <label htmlFor="filas-por-pagina" className="text-xs text-muted-foreground">Filas por página</label>
                  <Select
                    id="filas-por-pagina"
                    value={filasPorPagina}
                    onChange={(event) => {
                      setFilasPorPagina(Number(event.target.value))
                      setPagina(0)
                    }}
                    className="h-8 w-20 py-1 text-xs"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Mostrando {usuariosPagina.length ? pagina * filasPorPagina + 1 : 0}-{Math.min((pagina + 1) * filasPorPagina, usuariosOrdenados.length)} de {usuariosOrdenados.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pagina === 0}
                    onClick={() => setPagina((actual) => Math.max(0, actual - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <span className="min-w-20 text-center text-xs text-muted-foreground">Página {pagina + 1} de {totalPaginas}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pagina >= totalPaginas - 1}
                    onClick={() => setPagina((actual) => Math.min(totalPaginas - 1, actual + 1))}
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={Boolean(editando)}
        onClose={cerrarModal}
        title={`Editar jugador: ${editando?.nombre ?? ''} ${editando?.apellido ?? ''}`}
        description="Los cambios se guardan de manera permanente"
      >
        {form && (
          <form onSubmit={editForm.handleSubmit(guardarEdicion)} className="space-y-4">
            {formError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>}
            <FormularioUsuario
              register={editForm.register}
              errors={editForm.formState.errors}
              watch={editForm.watch}
              organizations={organizations}
              showOrganization={isSystem}
              showIsClient
            />
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
              <Button type="submit" loading={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={creando}
        onClose={cerrarModal}
        title="Crear nuevo usuario"
        description="Se registra el nuevo usuario directamente en la base de datos."
      >
        {form && (
          <form onSubmit={createForm.handleSubmit(guardarCreacion)} className="space-y-4">
            {formError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>}
            <FormularioUsuario
              register={createForm.register}
              errors={createForm.formState.errors}
              watch={createForm.watch}
              organizations={organizations}
              showOrganization={isSystem}
              showIsClient
            />
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
              <Button type="submit" loading={saving}>{saving ? 'Creando...' : 'Crear usuario'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(eliminando)}
        onClose={cerrarModal}
        title={`Eliminar usuario: ${eliminando?.nombre ?? ''} ${eliminando?.apellido ?? ''}`}
        description="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
      >
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
          <Button type="button" variant="destructive" loading={saving} onClick={confirmarEliminar}>
            {saving ? 'Eliminando...' : 'Confirmar eliminación'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
