import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Users, Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Label, Select } from '../../components/ui/Input'
import { getEquipos, crearEquipo, updateEquipo, eliminarEquipo } from '../../api/teams.api'
import { getUsuarios } from '../../api/admin.api'
import { getOrganizationBySlug, getOrganizations } from '../../api/organizations.api'
import { useTenant } from '../../hooks/useTenant'

const EQUIPO_VACIO = {
  name: '',
  integrante1: '',
  integrante2: '',
  tipo: '',
}

function FormularioEquipo({ register, errors, watch, usuarios, setValue }) {
  const integrante1Id = watch('integrante1')
  const integrante2Id = watch('integrante2')
  const tipo = watch('tipo')
  const integrante1 = usuarios.find((usuario) => usuario.id === integrante1Id)
  const integrante2 = usuarios.find((usuario) => usuario.id === integrante2Id)

  const validarMixto = (value, otroId) => {
    if (tipo !== 'Mixto' || !value || !otroId) return true
    const primero = value === integrante1Id ? integrante1 : integrante2
    const segundo = otroId === integrante1Id ? integrante1 : integrante2
    return String(primero?.sexo || '').toUpperCase() !== String(segundo?.sexo || '').toUpperCase() || 'Un equipo mixto debe tener un integrante masculino y uno femenino'
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const sexo = String(usuario.sexo || '').toUpperCase()
    if (tipo === 'Masculino') return sexo === 'MASCULINO'
    if (tipo === 'Femenino') return sexo === 'FEMENINO'
    return true
  })

  function handleTipoChange(event) {
    const value = event.target.value
    setValue('tipo', value, { shouldDirty: true, shouldValidate: true })
    setValue('integrante1', '', { shouldDirty: true, shouldValidate: true })
    setValue('integrante2', '', { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="eq-name">Nombre del Equipo *</Label>
        <Input id="eq-name" placeholder="Ej: Los Halcones" {...register('name', { required: 'El nombre del equipo es obligatorio' })} error={Boolean(errors.name)} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="eq-tipo">Tipo de equipo *</Label>
        <Select id="eq-tipo" value={tipo || ''} onChange={handleTipoChange} error={Boolean(errors.tipo)}>
          <option value="">Seleccionar tipo...</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Mixto">Mixto</option>
        </Select>
        {errors.tipo && <p className="mt-1 text-xs text-destructive">{errors.tipo.message}</p>}
        {!tipo && <p className="mt-1 text-xs font-medium text-primary/80">Primero seleccioná el tipo para habilitar los integrantes.</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[['integrante1', 'Integrante 1 *', integrante2Id, 'El integrante 1 no puede ser igual al integrante 2'], ['integrante2', 'Integrante 2 *', integrante1Id, 'El integrante 2 no puede ser igual al integrante 1']].map(([field, label, otherId, duplicateMessage]) => (
          <div key={field}>
            <Label htmlFor={`eq-${field}`}>{label}</Label>
            <Select id={`eq-${field}`} disabled={!tipo} {...register(field, {
              required: 'Seleccioná el integrante',
              validate: (value) => {
                if (value === otherId) return duplicateMessage
                return validarMixto(value, otherId)
              },
            })} error={Boolean(errors[field])}>
              <option value="">{tipo ? 'Seleccionar integrante...' : 'Seleccioná primero el tipo...'}</option>
              {usuariosFiltrados.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nombre} {usuario.apellido} ({usuario.email || usuario.dni || 'Sin datos'})</option>)}
            </Select>
            {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field].message}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminEquipos() {
  const [equipos, setEquipos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editando, setEditando] = useState(null)
  const [creando, setCreando] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [filtroOrganizacion, setFiltroOrganizacion] = useState('')
  const { isSystem, tenantSlug } = useTenant()

  const editForm = useForm({ defaultValues: EQUIPO_VACIO })
  const createForm = useForm({ defaultValues: EQUIPO_VACIO })

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    const loadOrganizations = isSystem ? getOrganizations() : tenantSlug ? getOrganizationBySlug(tenantSlug).then((org) => org ? [org] : []) : Promise.resolve([])
    loadOrganizations.then(setOrganizations).catch(() => setOrganizations([]))
  }, [isSystem, tenantSlug])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [equiposRes, usuariosRes] = await Promise.all([getEquipos(), getUsuarios()])
      setEquipos(equiposRes)
      setUsuarios(usuariosRes)
    } catch (err) {
      console.error('Error al cargar datos:', err)
    } finally {
      setLoading(false)
    }
  }

  function abrirEdicion(equipo) {
    setErrorMessage('')
    setEditando(equipo)
    editForm.reset({
      name: equipo.name || '',
      integrante1: equipo.integrante1?.id || equipo.integrante1?._id || equipo.integrante1 || '',
      integrante2: equipo.integrante2?.id || equipo.integrante2?._id || equipo.integrante2 || '',
      tipo: equipo.tipo || 'Masculino',
    })
  }

  function abrirCreacion() {
    setErrorMessage('')
    setCreando(true)
    createForm.reset({ ...EQUIPO_VACIO, tipo: '' })
  }

  function abrirEliminar(equipo) {
    setEliminando(equipo)
  }

  function cerrarModal() {
    setEditando(null)
    setCreando(false)
    setEliminando(null)
    setErrorMessage('')
  }

  async function guardarEdicion(data) {
    setSaving(true)
    setErrorMessage('')
    try {
      const actualizado = await updateEquipo(editando.id, data)
      setEquipos((prev) => prev.map((eq) => (eq.id === editando.id ? actualizado : eq)))
      cerrarModal()
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar el equipo'
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSaving(false)
    }
  }

  async function guardarCreacion(data) {
    setSaving(true)
    setErrorMessage('')
    try {
      const nuevo = await crearEquipo(data)
      setEquipos((prev) => [nuevo, ...prev])
      cerrarModal()
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear el equipo'
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSaving(false)
    }
  }

  async function confirmarEliminar() {
    if (!eliminando) return
    setSaving(true)
    try {
      await eliminarEquipo(eliminando.id)
      setEquipos((prev) => prev.filter((eq) => eq.id !== eliminando.id))
      cerrarModal()
    } catch (err) {
      console.error('Error al eliminar el equipo:', err)
    } finally {
      setSaving(false)
    }
  }

  function renderNombreIntegrante(integrante) {
    if (!integrante) return '—'
    if (typeof integrante === 'string') {
      const u = usuarios.find((usr) => usr.id === integrante)
      return u ? `${u.nombre} ${u.apellido}` : integrante
    }
    return `${integrante.nombre || ''} ${integrante.apellido || ''}`.trim() || integrante.email || '—'
  }

  function nombreOrganizacion(organizationId) {
    return organizations.find((org) => String(org._id || org.id) === String(organizationId))?.name || 'Sin organización'
  }

  const equiposFiltrados = equipos.filter((equipo) => {
    if (!filtroOrganizacion) return true
    const organization = organizations.find((org) => String(org._id || org.id) === String(filtroOrganizacion))
    const esSystemMP = ['systemmp'].includes(String(organization?.name || '').trim().toLowerCase()) || ['systemmp'].includes(String(organization?.slug || '').trim().toLowerCase())
    return esSystemMP ? !equipo.organizationId : String(equipo.organizationId) === String(filtroOrganizacion)
  })

  return (
    <div>
      <PageHeader
        eyebrow="Panel exclusivo de administración"
        title="Administración de Equipos"
        description="Gestión de parejas y equipos de dobles registrados en la competición: creación, asignación de integrantes y tipo de equipo."
      />

      <div className="px-6 py-8 sm:px-8">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-[18px] w-[18px] text-court" />
              Equipos registrados
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="admin">{equiposFiltrados.length} equipos</Badge>
              <Button size="sm" onClick={abrirCreacion}>
                <Plus className="h-4 w-4" /> Crear Nuevo Equipo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando equipos...</p>
            ) : equipos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay equipos registrados actualmente.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Nombre del Equipo</TH>
                    <TH>Integrante 1</TH>
                    <TH>Integrante 2</TH>
                    <TH>Tipo</TH>
                    <TH>
                      <div className="flex items-center gap-2"><span>Organización</span>{isSystem && <Select value={filtroOrganizacion} onChange={(event) => setFiltroOrganizacion(event.target.value)} className="h-7 min-w-[100px] px-2 text-[11px]" aria-label="Filtrar equipos por organización">
                        <option value="">Todas</option>
                        {organizations.map((org) => <option key={org._id || org.id} value={org._id || org.id}>{org.name}</option>)}
                      </Select>}</div>
                    </TH>
                    <TH className="text-right">Acciones</TH>
                  </TR>
                </THead>
                <TBody>
                  {equiposFiltrados.map((eq) => (
                    <TR key={eq.id}>
                      <TD className="font-medium text-foreground">{eq.name}</TD>
                      <TD className="text-muted-foreground">{renderNombreIntegrante(eq.integrante1)}</TD>
                      <TD className="text-muted-foreground">{renderNombreIntegrante(eq.integrante2)}</TD>
                      <TD>
                        <Badge
                          variant={
                            eq.tipo === 'Masculino'
                              ? 'masculino' // azul
                              : eq.tipo === 'Femenino'
                              ? 'femenino' // verde
                              : 'warning' // amarillo para Mixto
                          }
                        >
                          {eq.tipo}
                        </Badge>
                      </TD>
                      <TD className="text-muted-foreground">{nombreOrganizacion(eq.organizationId)}</TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => abrirEdicion(eq)}>
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => abrirEliminar(eq)}>
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Edición */}
      <Modal
        open={Boolean(editando)}
        onClose={cerrarModal}
        title={`Editar equipo: ${editando?.name ?? ''}`}
        description="Actualizá los integrantes y el tipo de equipo."
      >
        <form onSubmit={editForm.handleSubmit(guardarEdicion)} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
              {errorMessage}
            </div>
          )}
          <FormularioEquipo
            register={editForm.register}
            errors={editForm.formState.errors}
            watch={editForm.watch}
            setValue={editForm.setValue}
            usuarios={usuarios}
          />
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
            <Button type="submit" loading={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Creación */}
      <Modal
        open={creando}
        onClose={cerrarModal}
        title="Crear nuevo equipo"
        description="Registrá un nuevo equipo seleccionando integrantes existentes del sistema."
      >
        <form onSubmit={createForm.handleSubmit(guardarCreacion)} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
              {errorMessage}
            </div>
          )}
          <FormularioEquipo
            register={createForm.register}
            errors={createForm.formState.errors}
            watch={createForm.watch}
            setValue={createForm.setValue}
            usuarios={usuarios}
          />
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
            <Button type="submit" loading={saving}>{saving ? 'Creando...' : 'Crear equipo'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        open={Boolean(eliminando)}
        onClose={cerrarModal}
        title={`Eliminar equipo: ${eliminando?.name ?? ''}`}
        description="¿Estás seguro de que deseas eliminar este equipo? Esta acción eliminará el registro de la base de datos."
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
