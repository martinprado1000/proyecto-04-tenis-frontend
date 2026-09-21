import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Trophy, Plus, Pencil, Trash2, Users, UserPlus, ShieldAlert, CheckCircle2, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Label, Select } from '../../components/ui/Input'
import {
  getTorneos,
  crearTorneo,
  updateTorneo,
  eliminarTorneo,
  asignarJugadoresATorneo,
  asignarEquiposATorneo,
  FORMATOS_TORNEO,
} from '../../api/tournaments.api'
import { getUsuarios } from '../../api/admin.api'
import { getEquipos } from '../../api/teams.api'
import { getOrganizationBySlug } from '../../api/organizations.api'
import { useTenant } from '../../hooks/useTenant'

const TORNEO_VACIO = {
  name: '',
  formato: FORMATOS_TORNEO[0],
  fechaInicio: '',
  fechaFin: '',
  isActive: true,
  setsCount: 3,
}

function FormularioTorneo({ register, errors }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="t-name">Nombre del Torneo *</Label>
        <Input
          id="t-name"
          placeholder="Ej: Torneo Anual Año: 2000"
          {...register('name', { required: 'El nombre del torneo es obligatorio' })}
          error={Boolean(errors.name)}
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="t-formato">Formato del Torneo *</Label>
        <Select
          id="t-formato"
          {...register('formato', { required: 'Seleccioná el formato del torneo' })}
          error={Boolean(errors.formato)}
        >
          {FORMATOS_TORNEO.map((fmt) => (
            <option key={fmt} value={fmt}>
              {fmt}
            </option>
          ))}
        </Select>
        {errors.formato && <p className="mt-1 text-xs text-destructive">{errors.formato.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="t-fechaInicio">Fecha de inicio (Opcional)</Label>
          <Input id="t-fechaInicio" type="date" {...register('fechaInicio')} />
        </div>

        <div>
          <Label htmlFor="t-fechaFin">Fecha de fin (Opcional)</Label>
          <Input id="t-fechaFin" type="date" {...register('fechaFin')} />
        </div>
      </div>

      <div>
        <Label htmlFor="t-isActive">Estado</Label>
        <Select id="t-isActive" {...register('isActive')}>
          <option value="true">Activo</option>
          <option value="false">Inactivo / Finalizado</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="t-setsCount">Cantidad de sets</Label>
        <Select id="t-setsCount" {...register('setsCount') }>
          <option value={3}>3</option>
          <option value={5}>5</option>
        </Select>
      </div>
    </div>
  )
}

export default function AdminTorneos() {
  const [torneos, setTorneos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [equipos, setEquipos] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editando, setEditando] = useState(null)
  const [creando, setCreando] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const [gestionandoInscriptos, setGestionandoInscriptos] = useState(null)
  const [selectedToAdd, setSelectedToAdd] = useState([])
  const [selectedToRemove, setSelectedToRemove] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [replaceMode, setReplaceMode] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const editForm = useForm({ defaultValues: TORNEO_VACIO })
  const createForm = useForm({ defaultValues: TORNEO_VACIO })
  const { tenantSlug } = useTenant()

  useEffect(() => {
    cargarTodo()
  }, [])

  useEffect(() => {
    if (tenantSlug) {
      getOrganizationBySlug(tenantSlug).then((organization) => {
        setOrganizations(organization ? [organization] : [])
      }).catch(() => setOrganizations([]))
    }
  }, [tenantSlug])

  async function cargarTodo() {
    setLoading(true)
    try {
      const [torneosRes, usuariosRes, equiposRes] = await Promise.all([
        getTorneos(),
        getUsuarios(),
        getEquipos(),
      ])
      setTorneos(torneosRes)
      setUsuarios(usuariosRes)
      setEquipos(equiposRes)
    } catch (err) {
      console.error('Error al cargar datos de torneos:', err)
    } finally {
      setLoading(false)
    }
  }

  function abrirEdicion(torneo) {
    setErrorMessage('')
    setEditando(torneo)
    editForm.reset({
      name: torneo.name || '',
      formato: torneo.formato || FORMATOS_TORNEO[0],
      fechaInicio: torneo.fechaInicio || '',
      fechaFin: torneo.fechaFin || '',
      isActive: String(torneo.isActive ?? true),
      setsCount: torneo.setsCount ?? 3,
    })
  }

  function abrirCreacion() {
    setErrorMessage('')
    setCreando(true)
    createForm.reset({ ...TORNEO_VACIO, isActive: 'true' })
  }

  function abrirEliminar(torneo) {
    setEliminando(torneo)
  }

  function abrirInscriptos(torneo) {
    setErrorMessage('')
    setSelectedToAdd([])
    setSelectedToRemove('')
    setSelectedCategory('')
    setReplaceMode(false)
    setGestionandoInscriptos(torneo)
  }

  function cerrarModal() {
    setEditando(null)
    setCreando(false)
    setEliminando(null)
    setGestionandoInscriptos(null)
    setSelectedToAdd([])
    setSelectedToRemove('')
    setSelectedCategory('')
    setReplaceMode(false)
    setErrorMessage('')
  }

  async function guardarEdicion(data) {
    setSaving(true)
    setErrorMessage('')
    try {
      const payload = {
        ...data,
        isActive: String(data.isActive) === 'true',
        setsCount: Number(data.setsCount) || 3,
        fechaInicio: data.fechaInicio || undefined,
        fechaFin: data.fechaFin || undefined,
      }
      const actualizado = await updateTorneo(editando.id, payload)
      setTorneos((prev) => prev.map((t) => (t.id === editando.id ? actualizado : t)))
      cerrarModal()
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar el torneo'
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSaving(false)
    }
  }

  async function guardarCreacion(data) {
    setSaving(true)
    setErrorMessage('')
    try {
      const payload = {
        ...data,
        isActive: String(data.isActive) === 'true',
        setsCount: Number(data.setsCount) || 3,
        fechaInicio: data.fechaInicio || undefined,
        fechaFin: data.fechaFin || undefined,
      }
      const nuevo = await crearTorneo(payload)
      setTorneos((prev) => [nuevo, ...prev])
      cerrarModal()
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear el torneo'
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSaving(false)
    }
  }

  async function confirmarEliminar() {
    if (!eliminando) return
    setSaving(true)
    try {
      await eliminarTorneo(eliminando.id)
      setTorneos((prev) => prev.filter((t) => t.id !== eliminando.id))
      cerrarModal()
    } catch (err) {
      console.error('Error al eliminar torneo:', err)
    } finally {
      setSaving(false)
    }
  }

  // --- LÓGICA DE GESTIÓN DE INSCRIPTOS ---
  const esSingle = gestionandoInscriptos?.formato?.includes('Single')
  const esDobles = gestionandoInscriptos?.formato?.includes('Dobles')
  const esMasculino = gestionandoInscriptos?.formato?.includes('Masculino')
  const esFemenino = gestionandoInscriptos?.formato?.includes('Femenino')
  const esMixto = gestionandoInscriptos?.formato?.includes('Mixto')

  // Obtener inscriptos actuales
  const jugadoresInscriptos = gestionandoInscriptos?.jugadores || []
  const equiposInscriptos = gestionandoInscriptos?.equipos || []

  function nombreOrganizacionUsuario(usuario) {
    const organizationId = String(usuario.organizationId || usuario.organization?._id || usuario.organization?.id || '')
    return organizations.find((organization) => String(organization._id || organization.id) === organizationId)?.name
      || usuario.organization?.name
      || usuario.organizationName
      || 'Sin organización'
  }

  // Filtrar candidatos a agregar
  const candidatosJugadores = usuarios.filter((u) => {
    // Ya inscripto?
    const yaEsta = jugadoresInscriptos.some((j) => (j.id || j._id) === (u.id || u._id))
    if (yaEsta) return false

    const sexoUser = (u.sexo || '').toUpperCase()
    if (esMasculino && sexoUser !== 'MASCULINO') return false
    if (esFemenino && sexoUser !== 'FEMENINO') return false
    return true
  })

  function seleccionarCategoria(categoria) {
    setSelectedCategory(categoria)
    if (!categoria) {
      setSelectedToAdd([])
      return
    }

    const idsPorCategoria = candidatosJugadores
      .filter((usuario) => String(usuario.categoria || usuario.categoriaSingle || '').toUpperCase() === categoria)
      .map((usuario) => usuario.id || usuario._id)

    setSelectedToAdd((actuales) => [...new Set([...actuales, ...idsPorCategoria])])
  }

  const candidatosEquipos = equipos.filter((eq) => {
    // Ya inscripto?
    const yaEsta = equiposInscriptos.some((e) => (e.id || e._id) === eq.id)
    if (yaEsta) return false

    const tipoEq = (eq.tipo || '').toUpperCase()
    if (esMasculino && tipoEq !== 'MASCULINO') return false
    if (esFemenino && tipoEq !== 'FEMENINO') return false
    if (esMixto && tipoEq !== 'MIXTO') return false
    return true
  })

  async function agregarInscripto() {
    if (!selectedToAdd.length || !gestionandoInscriptos) return
    if (gestionandoInscriptos.fechas?.length > 0) {
      setErrorMessage('No se pueden agregar nuevos participantes después de generar las fechas. Solo podés eliminar participantes.')
      return
    }
    setSaving(true)
    setErrorMessage('')

    try {
      let actualizado
      if (esSingle) {
        const nuevosIds = [...jugadoresInscriptos.map((j) => j.id || j._id), ...selectedToAdd]
        actualizado = await asignarJugadoresATorneo(gestionandoInscriptos.id, nuevosIds)
      } else {
        const nuevosIds = [...equiposInscriptos.map((e) => e.id || e._id), ...selectedToAdd]
        actualizado = await asignarEquiposATorneo(gestionandoInscriptos.id, nuevosIds)
      }

      setGestionandoInscriptos(actualizado)
      setTorneos((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)))
      setSelectedToAdd([])
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al asignar inscripto'
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSaving(false)
    }
  }

  async function removerInscripto(idARemover) {
    if (!gestionandoInscriptos) return
    setSaving(true)
    setErrorMessage('')

    try {
      let actualizado
      if (esSingle) {
        const nuevosIds = jugadoresInscriptos
          .map((j) => j.id || j._id)
          .filter((id) => id !== idARemover)
        actualizado = await asignarJugadoresATorneo(gestionandoInscriptos.id, nuevosIds)
      } else {
        const nuevosIds = equiposInscriptos
          .map((e) => e.id || e._id)
          .filter((id) => id !== idARemover)
        actualizado = await asignarEquiposATorneo(gestionandoInscriptos.id, nuevosIds)
      }

      setGestionandoInscriptos(actualizado)
      setTorneos((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)))
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al remover inscripto'
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Panel exclusivo de administración"
        title="Administración de Torneos"
        description="Gestión de competiciones y modalidades de torneo (Single, Dobles, Round Robin, Playoffs, Masculino, Femenino y Mixto) con asignación de participantes."
      />

      <div className="px-6 py-8 sm:px-8">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-[18px] w-[18px] text-court" />
              Torneos programados
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="admin">{torneos.length} torneos</Badge>
              <Button size="sm" onClick={abrirCreacion}>
                <Plus className="h-4 w-4" /> Crear Nuevo Torneo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando torneos...</p>
            ) : torneos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay torneos creados actualmente.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Nombre del Torneo</TH>
                    <TH>Formato</TH>
                    <TH>Inscriptos</TH>
                    <TH>Fecha Inicio / Fin</TH>
                    <TH>Estado</TH>
                    <TH className="text-right">Acciones</TH>
                  </TR>
                </THead>
                <TBody>
                  {torneos.map((t) => {
                    const isSingleFmt = t.formato?.includes('Single')
                    const inscriptosCount = isSingleFmt ? (t.jugadores?.length || 0) : (t.equipos?.length || 0)

                    return (
                      <TR key={t.id}>
                        <TD className="font-medium text-foreground">{t.name}</TD>
                        <TD>
                          <Badge variant="outline">{t.formato}</Badge>
                        </TD>
                        <TD>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 px-2.5 text-xs text-court hover:bg-court/10 hover:text-court"
                            onClick={() => abrirInscriptos(t)}
                          >
                            <Users className="h-3.5 w-3.5" />
                            {inscriptosCount} {isSingleFmt ? 'Jugadores' : 'Equipos'}
                          </Button>
                        </TD>
                        <TD className="text-muted-foreground font-mono text-xs">
                          {t.fechaInicio || '—'} / {t.fechaFin || '—'}
                        </TD>
                        <TD>
                          <Badge variant={t.isActive ? 'success' : 'secondary'}>
                            {t.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TD>
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => abrirInscriptos(t)}>
                              <UserPlus className="h-3.5 w-3.5" /> Inscriptos
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => abrirEdicion(t)}>
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => abrirEliminar(t)}>
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Editar */}
      <Modal
        open={Boolean(editando)}
        onClose={cerrarModal}
        title={`Editar torneo: ${editando?.name ?? ''}`}
        description="Modificá la información o el formato del torneo."
      >
        <form onSubmit={editForm.handleSubmit(guardarEdicion)} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
              {errorMessage}
            </div>
          )}
          <FormularioTorneo register={editForm.register} errors={editForm.formState.errors} />
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
            <Button type="submit" loading={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Crear */}
      <Modal
        open={creando}
        onClose={cerrarModal}
        title="Crear nuevo torneo"
        description="Ingresá los datos del torneo y seleccioná uno de los 10 formatos disponibles."
      >
        <form onSubmit={createForm.handleSubmit(guardarCreacion)} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
              {errorMessage}
            </div>
          )}
          <FormularioTorneo register={createForm.register} errors={createForm.formState.errors} />
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
            <Button type="submit" loading={saving}>{saving ? 'Creando...' : 'Crear torneo'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        open={Boolean(eliminando)}
        onClose={cerrarModal}
        title={`Eliminar torneo: ${eliminando?.name ?? ''}`}
        description="¿Estás seguro de que deseas eliminar este torneo de la base de datos? Esta acción no se puede deshacer."
      >
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
          <Button type="button" variant="destructive" loading={saving} onClick={confirmarEliminar}>
            {saving ? 'Eliminando...' : 'Confirmar eliminación'}
          </Button>
        </div>
      </Modal>

      {/* Modal Asignar / Gestionar Inscriptos */}
      <Modal
        open={Boolean(gestionandoInscriptos)}
        onClose={cerrarModal}
        title={`Inscriptos: ${gestionandoInscriptos?.name ?? ''}`}
        description={`Formato: ${gestionandoInscriptos?.formato ?? ''}. Asigná o eliminá ${
          esSingle ? 'jugadores individuales' : 'equipos'
        } respetando las reglas del torneo.`}
        className="max-w-7xl"
      >
        <div className="space-y-5">
          {errorMessage && (
            <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario Agregar Nuevo Inscripto */}
          <div className="rounded-xl border border-court/30 bg-court/5 p-4 space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-court flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" /> {replaceMode ? 'Reemplazar participante' : `Seleccionar ${esSingle ? 'jugadores' : 'equipos'}`}
            </Label>
            {replaceMode && <p className="text-xs text-muted-foreground">{selectedToRemove ? 'Ahora seleccioná el nuevo participante para reemplazar al seleccionado.' : 'Primero marcá el participante actual que querés quitar y luego seleccioná el nuevo.'}</p>}
            {esSingle && !replaceMode && (
              <div>
                <Label htmlFor="categoria-inscriptos">Cargar todos los usuarios de la categoría:</Label>
                <Select
                  id="categoria-inscriptos"
                  value={selectedCategory}
                  onChange={(event) => seleccionarCategoria(event.target.value)}
                >
                  <option value="">Seleccionar categoría...</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((categoria) => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {(replaceMode && selectedToRemove ? (esSingle ? candidatosJugadores : candidatosEquipos) : (esSingle ? candidatosJugadores : candidatosEquipos)).map((item) => {
                const id = item.id || item._id
                const selected = selectedToAdd.includes(id)
                const label = esSingle ? `${item.nombre} ${item.apellido}` : `${item.name} (${item.tipo})`
                return <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${selected ? 'border-court bg-court/10' : 'border-border bg-card hover:border-court/50'}`}>
                  <input type={replaceMode ? 'radio' : 'checkbox'} name={replaceMode ? 'participante-reemplazo' : 'participantes-nuevos'} checked={selected} onChange={() => replaceMode ? setSelectedToAdd([id]) : setSelectedToAdd((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} />
                  <span className="truncate">{label}</span>
                </label>
              })}
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              {!replaceMode ? <>
                {/* <Button variant="outline" disabled={!selectedToAdd.length || saving} onClick={() => setReplaceMode(true)}>Reemplazar participante</Button>*/}
                <Button disabled={!selectedToAdd.length || saving} loading={saving} onClick={agregarInscripto}>Guardar</Button>
              </> : <>
                <Button variant="outline" onClick={() => { setReplaceMode(false); setSelectedToRemove('') }}>Cancelar reemplazo</Button>
                <Button disabled={!selectedToRemove || selectedToAdd.length !== 1 || saving} loading={saving} onClick={async () => {
                                  const nuevosIds = (esSingle ? jugadoresInscriptos : equiposInscriptos).map((item) => item.id || item._id).filter((id) => id !== selectedToRemove)
                                  const actualizado = esSingle
                                    ? await asignarJugadoresATorneo(gestionandoInscriptos.id, [...nuevosIds, selectedToAdd[0]], 'reemplazo', selectedToRemove, selectedToAdd[0])
                                    : await asignarEquiposATorneo(gestionandoInscriptos.id, [...nuevosIds, selectedToAdd[0]], 'reemplazo', selectedToRemove, selectedToAdd[0])
                                  setGestionandoInscriptos(actualizado)
                                  setTorneos((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)))
                                  setSelectedToAdd([])
                                  setSelectedToRemove('')
                                  setReplaceMode(false)
                                }}>Guardar reemplazo</Button>
              </>}
            </div>
          </div>

          {/* Listado de Inscriptos Actuales */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Participantes Inscriptos ({esSingle ? jugadoresInscriptos.length : equiposInscriptos.length})
            </h4>

            {esSingle ? (
              jugadoresInscriptos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No hay jugadores inscriptos en este torneo Single.
                </div>
              ) : (
                <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-3 lg:grid-cols-6">
                  {jugadoresInscriptos.map((j) => (
                    <div
                      key={j.id || j._id}
                      className={`flex min-w-0 items-center justify-between gap-2 rounded-lg border p-2 shadow-sm transition-colors ${replaceMode && selectedToRemove === (j.id || j._id) ? 'border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40' : 'border-border bg-card hover:border-court/40'}`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-court/10 text-court font-semibold text-xs">
                          {(j.nombre?.[0] || 'J').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">
                            {j.nombre} {j.apellido}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            Organización: <span className="text-foreground">{nombreOrganizacionUsuario(j)}</span> • Categoría: <span className="text-foreground">{j.categoria || j.categoriaSingle || '—'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                      {/*   <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setSelectedToRemove(j.id || j._id); setSelectedToAdd([]); setReplaceMode(true) }}
                          disabled={saving}
                        >
                          Reemplazar
                          </Button> */}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => removerInscripto(j.id || j._id)}
                          disabled={saving}
                          title="Eliminar participante"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              equiposInscriptos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No hay equipos inscriptos en este torneo Dobles.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {equiposInscriptos.map((eq) => (
                    <div
                      key={eq.id || eq._id}
                      className={`flex items-center justify-between rounded-lg border p-3 shadow-sm transition-colors ${replaceMode && selectedToRemove === (eq.id || eq._id) ? 'border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40' : 'border-border bg-card hover:border-court/40'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-court/10 text-court font-semibold text-xs">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{eq.name}</p>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              {eq.tipo}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            1: {eq.integrante1?.nombre} {eq.integrante1?.apellido} | 2: {eq.integrante2?.nombre} {eq.integrante2?.apellido}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setSelectedToRemove(eq.id || eq._id); setSelectedToAdd([]); setReplaceMode(true) }}
                          disabled={saving}
                        >
                          Reemplazar
                        </Button>*/}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => removerInscripto(eq.id || eq._id)}
                          disabled={saving}
                          title="Eliminar participante"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          <div className="flex items-center justify-end border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={cerrarModal}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
