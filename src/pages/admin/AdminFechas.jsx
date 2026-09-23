import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Sparkles, Pencil, CalendarClock, CalendarDays, ChevronDown, ChevronUp, Save, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Label } from '../../components/ui/Input'
import { getTorneos, generarFechasTorneo, updateFechaTorneo } from '../../api/tournaments.api'
import { TournamentBracketModal } from '../../components/tournaments/TournamentBracketModal'
import { TournamentBracketModal2 } from '../../components/tournaments/TournamentBracketModal2'
import { RoundRobinStandingsModal } from '../../components/tournaments/RoundRobinStandingsModal'
import { RoundRobinStandingsModal2 } from '../../components/tournaments/RoundRobinStandingsModal2'
import { X } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import { getOrganizationBySlug, getOrganizations } from '../../api/organizations.api'
import { downloadTournamentRoundPdf, getTournamentRoundOptions } from '../../utils/downloadTournamentRoundsPdf'

const ESTADO_VARIANT = {
  Confirmado: 'success',
  Pendiente: 'warning',
  Jugado: 'outline',
  Suspendido: 'destructive',
}

const CAMPOS_LUGAR = [
  { key: 'fecha', label: 'Fecha', type: 'date' },
  { key: 'hora', label: 'Hora', type: 'time' },
]

function nombreParticipante(participante) {
  if (!participante) return 'Participante'
  if (participante.nombre || participante.apellido) {
    return `${participante.nombre || ''} ${participante.apellido || ''}`.trim()
  }
  return participante.name || 'Participante'
}

export default function AdminFechas() {
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [bracketModal, setBracketModal] = useState(null)
  const [bracketModal2, setBracketModal2] = useState(null)
  const [standingsModal, setStandingsModal] = useState(null)
  const [standingsModal2, setStandingsModal2] = useState(null)
  const [fechaRonda, setFechaRonda] = useState({})
  const [savingFecha, setSavingFecha] = useState(null)
  const [rondaPdf, setRondaPdf] = useState({})
  const [rondaFechaSeleccionada, setRondaFechaSeleccionada] = useState({})
  const [fechasAbiertas, setFechasAbiertas] = useState({})
  const [organization, setOrganization] = useState(null)
  const [organizations, setOrganizations] = useState([])
  const [filtroOrganizacion, setFiltroOrganizacion] = useState('')
  const [generationErrors, setGenerationErrors] = useState({})
  const { tenantSlug, isSystem } = useTenant()
  const modalForm = useForm({
    defaultValues: modal?.data || { sets: [{ local: '', visitante: '' }, { local: '', visitante: '' }, { local: '', visitante: '' }] },
  })

  useEffect(() => {
    if (isSystem) getOrganizations().then(setOrganizations).catch(() => setOrganizations([]))
    else if (tenantSlug) getOrganizationBySlug(tenantSlug).then((org) => { setOrganization(org); setOrganizations(org ? [org] : []) }).catch(() => {})
    getTorneos().then((data) => {
      setTorneos(data.filter((torneo) => torneo.isActive !== false))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function nombreOrganizacion(organizationId) {
    return organizations.find((org) => String(org._id || org.id) === String(organizationId))?.name || 'Sin organización'
  }

  const torneosFiltrados = torneos.filter((torneo) => {
    if (!filtroOrganizacion) return true
    const org = organizations.find((item) => String(item._id || item.id) === String(filtroOrganizacion))
    const esSystemMP = ['systemmp'].includes(String(org?.name || '').trim().toLowerCase()) || ['systemmp'].includes(String(org?.slug || '').trim().toLowerCase())
    return esSystemMP ? !torneo.organizationId : String(torneo.organizationId) === String(filtroOrganizacion)
  })

  const partidoEditando = modal
    ? torneos.find((torneo) => torneo.id === modal.torneoId)?.fechas?.[modal.fechaIdx]
    : null
  const nombreLocal = nombreParticipante(partidoEditando?.participante1)
  const nombreVisitante = nombreParticipante(partidoEditando?.participante2)

  useEffect(() => { if (modal) modalForm.reset(modal.data) }, [modal, modalForm])

  async function handleGenerarAuto(torneoId) {
    const torneo = torneos.find((item) => item.id === torneoId)
    const participantes = torneo?.formato?.includes('Dobles') ? torneo?.equipos : torneo?.jugadores
    if (!participantes?.length) {
      setGenerationErrors((current) => ({ ...current, [torneoId]: 'No tiene jugadores asignados a este torneo' }))
      return
    }

    setGenerationErrors((current) => ({ ...current, [torneoId]: '' }))
    setGenerando(true)
    try {
      const updated = await generarFechasTorneo(torneoId)
      setTorneos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'No se pudieron generar las fechas.'
      setGenerationErrors((current) => ({
        ...current,
        [torneoId]: Array.isArray(message) ? message.join(', ') : message,
      }))
    } finally {
      setGenerando(false)
    }
  }

  function descargarFechas(torneo) {
    const option = rondaPdf[torneo.id]
    if (option) downloadTournamentRoundPdf(torneo, organization, option)
  }

  function abrirBracket(torneo) {
    setBracketModal({ torneo })
  }

  function cerrarBracket() {
    setBracketModal(null)
  }

  function abrirBracket2(torneo) {
    setBracketModal2({ torneo })
  }

  function cerrarBracket2() {
    setBracketModal2(null)
  }

  function abrirStandings(torneo) {
    setStandingsModal({ torneo })
  }

  function cerrarStandings() {
    setStandingsModal(null)
  }

  function abrirStandings2(torneo) {
    setStandingsModal2({ torneo })
  }

  function cerrarStandings2() {
    setStandingsModal2(null)
  }

  async function guardarFecha(torneoId, fechaIdx, fecha) {
    setSavingFecha(`${torneoId}-${fechaIdx}`)
    try {
      const updated = await updateFechaTorneo(torneoId, fechaIdx, { fecha: fecha || null })
      setTorneos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } finally {
      setSavingFecha(null)
    }
  }

  async function aplicarFechaRonda(torneoId, round) {
    const fecha = fechaRonda[`${torneoId}-${round}`]
    if (!fecha || !round) return
    const torneo = torneos.find((t) => t.id === torneoId)
    const indices = (torneo?.fechas || []).map((f, idx) => ({ f, idx })).filter(({ f }) => (f.round || 1) === round)
    setSavingFecha(`${torneoId}-round-${round}`)
    try {
      let updated = torneo
      for (const { idx } of indices) updated = await updateFechaTorneo(torneoId, idx, { fecha })
      setTorneos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } finally {
      setSavingFecha(null)
    }
  }

  function abrirEditar(torneoId, fechaIdx, fecha) {
    const tieneAmbos = Boolean(fecha.participante1 && fecha.participante1.id && fecha.participante2 && fecha.participante2.id)
    if (!tieneAmbos) return
    const torneo = torneos.find((t) => t.id === torneoId)
    const setsCount = torneo?.setsCount || 3
    const existing = Array.isArray(fecha.sets) ? [...fecha.sets] : []
    // pad existing sets to match tournament setsCount
    while (existing.length < setsCount) existing.push({ local: '', visitante: '' })
    setModalError('')
    setModal({ modo: 'editar', torneoId, fechaIdx, data: { sets: existing } })
  }

  function cerrarModal() {
    setModal(null)
    setModalError('')
  }

  function toggleFechas(torneoId) {
    setFechasAbiertas((prev) => ({
      ...prev,
      [torneoId]: !Boolean(prev[torneoId]),
    }))
  }

  async function guardar(data) {
    setSaving(true)
    setModalError('')
    try {
      const { torneoId, fechaIdx, modo } = modal
      if (modo === 'editar') {
        // client-side validation: consider only sets up to the last non-empty one
        const rawSets = data.sets || []
        let lastNonEmpty = -1
        for (let i = 0; i < rawSets.length; i++) {
          const s = rawSets[i]
          const lRaw = s?.local
          const vRaw = s?.visitante
          const emptyL = lRaw === '' || lRaw === null || lRaw === undefined
          const emptyV = vRaw === '' || vRaw === null || vRaw === undefined
          if (!(emptyL && emptyV)) lastNonEmpty = i
        }

        if (lastNonEmpty === -1) throw new Error('Debe completar al menos un set')

        const effectiveSets = rawSets.slice(0, lastNonEmpty + 1)
        let localWins = 0
        let visitWins = 0
        // determine majority from tournament's configured setsCount (3 or 5)
        const torneoObj = torneos.find((tt) => tt.id === torneoId) || {}
        const tournamentSetsCount = torneoObj.setsCount || 3
        const majority = Math.ceil(tournamentSetsCount / 2)

        for (let i = 0; i < effectiveSets.length; i++) {
          const s = effectiveSets[i]
          const lRaw = s?.local
          const vRaw = s?.visitante
          if (lRaw === '' || lRaw === null || lRaw === undefined || vRaw === '' || vRaw === null || vRaw === undefined) {
            throw new Error(`Set ${i + 1}: completá ambos scores`)
          }

          const nl = Number(lRaw)
          const nv = Number(vRaw)
          if (!Number.isInteger(nl) || !Number.isInteger(nv)) throw new Error(`Set ${i + 1}: los juegos deben ser números enteros`)
          if (nl < 0 || nv < 0 || nl > 7 || nv > 7 || nl === nv) throw new Error(`Set ${i + 1}: marcador de juegos inválido`)
          const normal = (nl >= 6 && nl <= 7 && nv <= 4) || (nv >= 6 && nv <= 7 && nl <= 4)
          const sevenFive = (nl === 7 && nv === 5) || (nv === 7 && nl === 5)
          const tieBreak = (nl === 7 && nv === 6) || (nv === 7 && nl === 6)
          if (!normal && !sevenFive && !tieBreak) throw new Error(`Set ${i + 1}: solo se permiten marcadores 6-0 a 6-4, 7-5 o 7-6`)
          if (tieBreak) {
            const tieLocal = Number(s.tieBreakLocal)
            const tieVisitante = Number(s.tieBreakVisitante)
            const tieBreakValido = Number.isInteger(tieLocal) && Number.isInteger(tieVisitante)
              && tieLocal >= 0 && tieVisitante >= 0
              && Math.max(tieLocal, tieVisitante) >= 7
              && Math.abs(tieLocal - tieVisitante) === 2
              && (nl === 7 ? tieLocal > tieVisitante : tieVisitante > tieLocal)
            if (!tieBreakValido) {
              throw new Error(`Set ${i + 1}: el tie-break debe terminar con al menos 7 puntos y exactamente 2 de diferencia, y ganarlo el participante que tiene 7 juegos`)
            }
          }

          if (localWins >= majority || visitWins >= majority) throw new Error(`El partido ya fue decidido antes; no completar el set ${i + 1}`)

          if (nl > nv) localWins++
          else visitWins++
        }

        if (localWins < majority && visitWins < majority) {
          throw new Error(`Se requiere que un jugador gane ${majority} sets. Completa más sets.`)
        }

        // normalize numeric scores for payload (only effective sets)
        const sets = effectiveSets.map((s) => ({
          local: Number(s.local),
          visitante: Number(s.visitante),
          ...(s.tieBreakLocal !== '' && s.tieBreakLocal !== undefined ? { tieBreakLocal: Number(s.tieBreakLocal), tieBreakVisitante: Number(s.tieBreakVisitante) } : {}),
        }))
        const updated = await updateFechaTorneo(torneoId, fechaIdx, { sets })
        setTorneos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        setBracketModal((prev) => (prev && prev.torneo.id === updated.id ? { torneo: updated } : prev))
      }
      cerrarModal()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar resultado'
      setModalError(Array.isArray(msg) ? msg.join('. ') : msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Panel exclusivo de administración"
        title="Administración de Fechas"
        description="Generá el fixture automáticamente o programá partidos a mano, y actualizá estados y resultados."
      />

      <div className="px-6 py-8 sm:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h3 className="text-lg font-medium">Torneos</h3>
          <div className="flex items-center gap-2">
            {isSystem && <select value={filtroOrganizacion} onChange={(event) => setFiltroOrganizacion(event.target.value)} className="h-9 min-w-[180px] rounded-lg border border-input bg-background px-3 text-sm" aria-label="Filtrar fechas por organización">
              <option value="">Organización: Todas</option>
              {organizations.map((org) => <option key={org._id || org.id} value={org._id || org.id}>{org.name}</option>)}
            </select>}
            <Button variant="outline" onClick={() => { /* placeholder: could refresh */ }}>
              <Sparkles className="h-4 w-4" /> Refrescar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando torneos...</p>
          ) : torneosFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay torneos disponibles.</p>
          ) : (
            torneosFiltrados.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        <CalendarClock className="h-[18px] w-[18px] text-court" />
                        {t.name}
                        {(() => {
                          const isRoundRobin = (t.formato || '').toLowerCase().includes('roundrobin') || (t.formato || '').toLowerCase().includes('round robin')
                          const matchesToComplete = (t.fechas || []).filter((match) => {
                            if (match.bye) return false
                            if (isRoundRobin && (!match.participante1?.id || !match.participante2?.id)) return false
                            if (match.thirdPlace && (!match.participante1?.id || !match.participante2?.id)) return false
                            return true
                          })
                          const torneoFinalizado = matchesToComplete.length > 0 && matchesToComplete.every((match) => match.jugado === true || Boolean(match.resultado))
                          return torneoFinalizado ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Torneo finalizado
                            </span>
                          ) : null
                        })()}
                      </CardTitle>
                      {generationErrors[t.id] && (
                        <p className="mt-1 text-xs font-semibold text-destructive">{generationErrors[t.id]}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Formato: {t.formato} · Participantes: {t.jugadores.length || t.equipos.length}</p>
                      <p className="text-sm text-muted-foreground">Organización: {nombreOrganizacion(t.organizationId)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" disabled={Boolean(t.fechas && t.fechas.length > 0)} loading={generando} onClick={() => handleGenerarAuto(t.id)}>
                        <Sparkles className="h-4 w-4" /> {t.fechas && t.fechas.length > 0 ? 'Fechas generadas' : 'Generar fechas automáticamente'}
                      </Button>
                      {t.formato && t.formato.toLowerCase().includes('playoffs') && (
                        <div className="flex gap-2">
                          {/* <Button variant="outline" onClick={() => abrirBracket(t)}>
                            Mostrar llave 2
                          </Button>*/}
                          <Button variant="outline" onClick={() => abrirBracket2(t)}>
                            Mostrar llave
                          </Button>
                        </div>
                      )}
                      {t.formato && t.formato.toLowerCase().includes('roundrobin') && (
                        <div className="flex gap-2">
                          {/* <Button variant="outline" onClick={() => abrirStandings(t)}>
                            Mostrar tabla de posiciones
                          </Button>*/}
                          <Button variant="outline" onClick={() => abrirStandings2(t)}>
                            Mostrar tabla de posiciones
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-2 py-1.5 shadow-sm">
                        <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-primary/80 sm:inline">PDF</span>
                        <select className="h-8 rounded-lg border border-border bg-background px-2 text-xs" value={rondaPdf[t.id] || ''} onChange={(e) => setRondaPdf((prev) => ({ ...prev, [t.id]: e.target.value }))} disabled={!t.fechas?.length}>
                          <option value="">Elegir instancia</option>
                          {getTournamentRoundOptions(t).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <Button variant="outline" size="sm" onClick={() => descargarFechas(t)} disabled={!t.fechas?.length || !rondaPdf[t.id]}>
                          Descargar PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {t.fechas && t.fechas.length > 0 ? (() => {
                    const maxRound = (t.fechas || []).reduce((mx, ff) => Math.max(mx, ff.round || 1), 0)
                    const rounds = [...new Set((t.fechas || []).map((ff) => ff.round || 1))].sort((a, b) => a - b)
                    const fechasAbiertasParaTorneo = Boolean(fechasAbiertas[t.id])
                    return (
                      <>
                        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-1.5 shadow-sm">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-auto w-full justify-between rounded-lg px-3 py-2.5 text-left hover:bg-background"
                            onClick={() => toggleFechas(t.id)}
                            aria-expanded={fechasAbiertasParaTorneo}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${fechasAbiertasParaTorneo ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                <CalendarDays className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-foreground">
                                  {fechasAbiertasParaTorneo ? 'Ocultar fechas generadas' : 'Ver fechas generadas'}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {t.fechas.length} {t.fechas.length === 1 ? 'partido programado' : 'partidos programados'}
                                </span>
                              </span>
                            </span>
                            <span className="ml-3 flex shrink-0 items-center gap-2 text-xs font-medium text-primary">
                              {fechasAbiertasParaTorneo ? 'Ocultar' : 'Ver'}
                              {fechasAbiertasParaTorneo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          </Button>
                        </div>

                        {fechasAbiertasParaTorneo && (
                          <>
                            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-sm">
                              <span className="w-full text-xs font-semibold uppercase tracking-wide text-primary/80">Asignar fecha límite por ronda</span>
                              <label className="text-xs text-muted-foreground">Ronda
                                <select className="mt-1 ml-1 h-8 rounded-lg border border-border bg-background px-2 text-xs" value={rondaFechaSeleccionada[t.id] || ''} onChange={(e) => setRondaFechaSeleccionada((prev) => ({ ...prev, [t.id]: e.target.value }))}>
                                  <option value="">Elegir ronda</option>
                                  {rounds.map((round) => <option key={round} value={round}>Ronda {round}</option>)}
                                </select>
                              </label>
                              <label className="text-xs text-muted-foreground">
                                <Input type="date" value={fechaRonda[`${t.id}-${rondaFechaSeleccionada[t.id]}`] || ''} onChange={(e) => setFechaRonda((prev) => ({ ...prev, [`${t.id}-${rondaFechaSeleccionada[t.id]}`]: e.target.value }))} className="mt-1 h-8" disabled={!rondaFechaSeleccionada[t.id]} />
                              </label>
                              <Button size="sm" variant="outline" disabled={!rondaFechaSeleccionada[t.id] || !fechaRonda[`${t.id}-${rondaFechaSeleccionada[t.id]}`] || savingFecha === `${t.id}-round-${rondaFechaSeleccionada[t.id]}`} onClick={() => aplicarFechaRonda(t.id, Number(rondaFechaSeleccionada[t.id]))}>
                                <Save className="h-3.5 w-3.5" /> Aplicar
                              </Button>
                            </div>
                            <Table>
                              <THead>
                                <TR>
                                  <TH>{t.formato?.includes('Dobles') ? 'Equipo 1' : 'Participante 1'}</TH>
                                  <TH>{t.formato?.includes('Dobles') ? 'Equipo 2' : 'Participante 2'}</TH>
                                  <TH>Instancia</TH>
                                  <TH>Fecha límite</TH>
                                  <TH>Resultado</TH>
                                  <TH className="text-right">Acción</TH>
                                </TR>
                              </THead>
                              <TBody>
                                {t.fechas.map((f, idx) => {
                                  const isPlayoffs = (t.formato || '').toLowerCase().includes('playoffs')
                                  const isRoundRobin = (t.formato || '').toLowerCase().includes('roundrobin') || (t.formato || '').toLowerCase().includes('round robin')
                                  const tieneAmbos = Boolean(f.participante1 && f.participante1.id && f.participante2 && f.participante2.id)
                                  const instancia = (() => {
                                    if (isPlayoffs) {
                                      if (f.thirdPlace) return 'Definición 3°'
                                      if (f.round === maxRound) return 'Final'
                                      if (f.round === (maxRound - 1)) return 'Semifinal'
                                    }
                                    return `Ronda ${f.round || 1}`
                                  })()
                                  const roundBg = (f.round || 1) % 2 === 0
                                    ? 'bg-white/[0.02]'
                                    : ''
                                  return (
                                    <TR key={f.id} className={roundBg}>
                                      <TD className="font-medium">
                                        <span className={!f.participante1 && isRoundRobin ? 'text-blue-400' : f.participante1?.cancelado ? 'line-through text-muted-foreground' : ''}>
                                          {f.participante1 ? (f.participante1.nombre ? `${f.participante1.nombre} ${f.participante1.apellido || ''}` : f.participante1.name) : (isRoundRobin ? 'Fecha libre' : '—')}
                                        </span>
                                        {f.participante1?.cancelado && <span className="ml-2 text-xs font-normal text-destructive">Fecha cancelada</span>}
                                        {f.reemplazado1 && !f.participante1?.cancelado && <span className="ml-2 text-xs font-normal text-amber-400">Participante reemplazado</span>}
                                      </TD>
                                      <TD className="font-medium">
                                        <span className={!f.participante2 && isRoundRobin ? 'text-blue-400' : f.participante2?.cancelado ? 'line-through text-muted-foreground' : ''}>
                                          {f.participante2 ? (f.participante2.nombre ? `${f.participante2.nombre} ${f.participante2.apellido || ''}` : f.participante2.name) : (isRoundRobin ? 'Fecha libre' : '—')}
                                        </span>
                                        {f.participante2?.cancelado && <span className="ml-2 text-xs font-normal text-destructive">Fecha cancelada</span>}
                                        {f.reemplazado2 && !f.participante2?.cancelado && <span className="ml-2 text-xs font-normal text-amber-400">Participante reemplazado</span>}
                                      </TD>
                                      <TD className="text-sm text-muted-foreground">{instancia}</TD>
                                      <TD>
                                        <div className="flex items-center gap-2">
                                          <Input type="date" value={f.fecha || ''} onChange={(e) => setTorneos((prev) => prev.map((torneo) => torneo.id === t.id ? { ...torneo, fechas: torneo.fechas.map((item, itemIdx) => itemIdx === idx ? { ...item, fecha: e.target.value } : item) } : torneo))} onBlur={(e) => guardarFecha(t.id, idx, e.target.value)} className="h-8 min-w-[145px]" />
                                          {savingFecha === `${t.id}-${idx}` && <span className="text-xs text-muted-foreground">Guardando...</span>}
                                        </div>
                                      </TD>
                                      <TD className={f.resultado || f.jugado ? 'text-muted-foreground' : 'font-semibold text-destructive'}>
                                        {f.resultado || (f.jugado ? 'Jugado' : 'Pendiente')}
                                      </TD>
                                      <TD className="text-right">
                                        <Button size="sm" variant="outline" disabled={!tieneAmbos} onClick={() => abrirEditar(t.id, idx, f)}>
                                          <Pencil className="h-3.5 w-3.5" /> Editar
                                        </Button>
                                      </TD>
                                    </TR>
                                  )
                                })}
                              </TBody>
                            </Table>
                          </>
                        )}
                      </>
                    )
                  })() : (
                    <p className="text-sm text-muted-foreground">No se han generado fechas para este torneo aún.</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal open={Boolean(modal)} onClose={cerrarModal} title={'Editar partido'} description={'Registrar resultado (mínimo 2 sets; tercer set si aplica)'}>

          {modal && (
          <form onSubmit={modalForm.handleSubmit(guardar)} className="space-y-4">
            {modalError && (
              <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
                {modalError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: modal.data.sets.length }).map((_, i) => {
                const sets = modalForm.watch('sets') || []
                // compute wins up to previous sets to optionally disable further inputs
                let localWins = 0
                let visitWins = 0
                for (let j = 0; j < i; j++) {
                  const s = sets[j]
                  const l = Number(s?.local)
                  const v = Number(s?.visitante)
                  if (!Number.isFinite(l) || !Number.isFinite(v)) continue
                  if (l > v) localWins++
                  else if (v > l) visitWins++
                }
                const majority = Math.ceil(modal.data.sets.length / 2)
                const disableFollowing = localWins >= majority || visitWins >= majority

                return (
                  <div key={i} className="grid grid-cols-2 gap-2 items-end">
                    <div>
                      <Label>Set {i+1} - {nombreLocal}</Label>
                      <Input type="number" min={0} max={7} step={1} {...modalForm.register(`sets.${i}.local`)} disabled={disableFollowing} />
                    </div>
                    <div>
                      <Label>Set {i+1} - {nombreVisitante}</Label>
                      <Input type="number" min={0} max={7} step={1} {...modalForm.register(`sets.${i}.visitante`)} disabled={disableFollowing} />
                    </div>
                    {((Number(sets[i]?.local) === 7 && Number(sets[i]?.visitante) === 6) || (Number(sets[i]?.local) === 6 && Number(sets[i]?.visitante) === 7)) && (
                      <div className="col-span-2 grid grid-cols-2 gap-2 rounded-lg border border-ball/30 bg-ball/5 p-3">
                        <div><Label>Tie-break {nombreLocal}</Label><Input type="number" min={0} {...modalForm.register(`sets.${i}.tieBreakLocal`)} /></div>
                        <div><Label>Tie-break {nombreVisitante}</Label><Input type="number" min={0} {...modalForm.register(`sets.${i}.tieBreakVisitante`)} /></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={cerrarModal}>Cancelar</Button>
              <Button type="submit" loading={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <TournamentBracketModal
        torneo={bracketModal?.torneo}
        open={Boolean(bracketModal)}
        onClose={cerrarBracket}
      />

      <TournamentBracketModal2
        torneo={bracketModal2?.torneo}
        open={Boolean(bracketModal2)}
        onClose={cerrarBracket2}
      />

      <RoundRobinStandingsModal
        torneo={standingsModal?.torneo}
        open={Boolean(standingsModal)}
        onClose={cerrarStandings}
      />

      <RoundRobinStandingsModal2
        torneo={standingsModal2?.torneo}
        open={Boolean(standingsModal2)}
        onClose={cerrarStandings2}
      />
    </div>
  )
}
