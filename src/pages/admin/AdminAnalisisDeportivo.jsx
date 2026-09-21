import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { BarChart3, CalendarDays, Eye, FileText, Pencil, Plus, Target, Trash2, Trophy, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { getUsuarios } from '../../api/admin.api'
import { createSportsAnalysisSession, deleteSportsAnalysisSession, getMySportsAnalysis, getSportsAnalysisSessions, updateSportsAnalysisSession } from '../../api/sportsAnalysis.api'
import { useAuth } from '../../context/AuthContext'

const emptyMetrics = {
  firstServeTotal: 0,
  firstServeIn: 0,
  secondServeTotal: 0,
  secondServeIn: 0,
  doubleFaults: 0,
  net: 0,
  long: 0,
  t: 0,
  body: 0,
  wide: 0,
  total: 0,
  deep: 0,
  short: 0,
  winners: 0,
  errorsNet: 0,
  errorsLong: 0,
  forehandWinners: 0,
  backhandWinners: 0,
  approaches: 0,
  won: 0,
  smashes: 0,
  smashesWon: 0,
  volleys: 0,
  volleysWon: 0,
  totalRallies: 0,
  breakPointsWon: 0,
  breakPointsLost: 0,
  forcedErrors: 0,
  unforcedErrors: 0,
  coachRating: 0,
}

const metricNumber = (value) => Number(value || 0)

function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(1)}%`
}

const emptyFormValues = () => ({
  date: new Date().toISOString().slice(0, 10), title: '', opponent: '', type: 'session', notes: '', coachRating: 5,
  serving: { ...emptyMetrics }, groundstrokes: { ...emptyMetrics }, netPlay: { ...emptyMetrics }, rally: { ...emptyMetrics },
})

export default function AdminAnalisisDeportivo({ ownMode = false }) {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [summary, setSummary] = useState({ average: {}, overview: {}, sessions: [], chartData: [] })
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [viewingSession, setViewingSession] = useState(null)

  const { register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues: emptyFormValues() })

  useEffect(() => {
    if (ownMode) {
      const ownId = user?.id || user?._id
      if (ownId) setSelectedUserId(String(ownId))
      return
    }

    async function fetchUsers() {
      try {
        const data = await getUsuarios()
        setUsuarios(data || [])
      } catch {
        setUsuarios([])
      }
    }
    fetchUsers()
  }, [ownMode, user])

  useEffect(() => {
    if (!selectedUserId) {
      setSummary({ average: {}, overview: {}, sessions: [], chartData: [] })
      return
    }

    async function loadSummary() {
      setLoading(true)
      try {
        const data = ownMode
          ? await getMySportsAnalysis()
          : await getSportsAnalysisSessions(selectedUserId)
        setSummary(data || { average: {}, overview: {}, sessions: [], chartData: [] })
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [selectedUserId, ownMode])

  const onSubmit = async (values) => {
    if (!selectedUserId) return

    setSaving(true)
    try {
      const payload = {
        userId: selectedUserId,
        title: values.title,
        date: values.date,
        opponent: values.opponent || '',
        type: values.type,
        notes: values.notes || '',
        coachRating: Number(values.coachRating || 0),
        serving: {
          firstServeTotal: metricNumber(values.serving?.firstServeTotal),
          firstServeIn: metricNumber(values.serving?.firstServeIn),
          secondServeTotal: metricNumber(values.serving?.secondServeTotal),
          secondServeIn: metricNumber(values.serving?.secondServeIn),
          doubleFaults: metricNumber(values.serving?.doubleFaults),
          net: metricNumber(values.serving?.net),
          long: metricNumber(values.serving?.long),
          t: metricNumber(values.serving?.t),
          body: metricNumber(values.serving?.body),
          wide: metricNumber(values.serving?.wide),
        },
        groundstrokes: {
          total: metricNumber(values.groundstrokes?.total),
          deep: metricNumber(values.groundstrokes?.deep),
          short: metricNumber(values.groundstrokes?.short),
          winners: metricNumber(values.groundstrokes?.winners),
          errorsNet: metricNumber(values.groundstrokes?.errorsNet),
          errorsLong: metricNumber(values.groundstrokes?.errorsLong),
          forehandWinners: metricNumber(values.groundstrokes?.forehandWinners),
          backhandWinners: metricNumber(values.groundstrokes?.backhandWinners),
        },
        netPlay: {
          approaches: metricNumber(values.netPlay?.approaches),
          won: metricNumber(values.netPlay?.won),
          smashes: metricNumber(values.netPlay?.smashes),
          smashesWon: metricNumber(values.netPlay?.smashesWon),
          volleys: metricNumber(values.netPlay?.volleys),
          volleysWon: metricNumber(values.netPlay?.volleysWon),
          errors: metricNumber(values.netPlay?.errors),
        },
        rally: {
          totalRallies: metricNumber(values.rally?.totalRallies),
          winners: metricNumber(values.rally?.winners),
          forcedErrors: metricNumber(values.rally?.forcedErrors),
          unforcedErrors: metricNumber(values.rally?.unforcedErrors),
          breakPointsWon: metricNumber(values.rally?.breakPointsWon),
          breakPointsLost: metricNumber(values.rally?.breakPointsLost),
        },
      }
      if (editingSession) {
        await updateSportsAnalysisSession(editingSession._id || editingSession.id, payload)
      } else {
        await createSportsAnalysisSession(payload)
      }
      const refreshed = ownMode ? await getMySportsAnalysis() : await getSportsAnalysisSessions(selectedUserId)
      setSummary(refreshed)
      setModalOpen(false)
      setEditingSession(null)
      reset(emptyFormValues())
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (session) => {
    setEditingSession(session)
    reset({ ...emptyFormValues(), ...session, date: new Date(session.date).toISOString().slice(0, 10) })
    setModalOpen(true)
  }

  const removeSession = async (session) => {
    if (!window.confirm(`¿Eliminar "${session.title}"? Esta acción no se puede deshacer.`)) return
    await deleteSportsAnalysisSession(session._id || session.id, selectedUserId)
    const refreshed = ownMode ? await getMySportsAnalysis() : await getSportsAnalysisSessions(selectedUserId)
    setSummary(refreshed)
  }

  const selectedUser = usuarios.find((user) => String(user.id || user._id) === String(selectedUserId))
  const average = summary.average || {}
  const chartData = summary.chartData || []
  const sessions = summary.sessions || []

  return (
    <div>
      <PageHeader
        eyebrow="Entrenamiento y rendimiento"
        title="Análisis deportivo"
        description={ownMode ? 'Tu evolución técnica y táctica por sesión y por tendencia temporal.' : 'Seguimiento técnico y táctico del progreso del alumno por sesión y por tendencia temporal.'}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {!ownMode && <Card>
          <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 flex-1">
              <Label htmlFor="userSelect">Alumno</Label>
              <Select id="userSelect" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Seleccionar alumno...</option>
                {usuarios.map((user) => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.nombre} {user.apellido}
                  </option>
                ))}
              </Select>
            </div>

            <Button onClick={() => setModalOpen(true)} disabled={!selectedUserId} className="w-full md:w-auto">
              <Plus className="h-4 w-4" />
              Registrar Nueva Sesión / Partido
            </Button>
          </CardContent>
        </Card>}

        {!selectedUserId ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Seleccioná un alumno para cargar la evolución de sus métricas y sesiones de entrenamiento.
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Cargando análisis...</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="1º saque" value={formatPercent(average.firstServeIn)} icon={Target} />
              <KpiCard label="2º saque" value={formatPercent(average.secondServeIn)} icon={CalendarDays} />
              <KpiCard label="Profundidad" value={formatPercent(average.deepGroundstrokes)} icon={Trophy} />
              <KpiCard label="Rating entrenador" value={`${average.coachRating || 0}/10`} icon={UserRound} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Evolución temporal</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="serveGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#5eead4" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#5eead4" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="firstServeRate" stroke="#5eead4" fill="url(#serveGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Detalle técnico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MetricBar label="Efectividad 1er servicio" value={average.firstServeIn || 0} color="bg-emerald-500" />
                  <MetricBar label="Efectividad 2do servicio" value={average.secondServeIn || 0} color="bg-cyan-500" />
                  <MetricBar label="Tasa de profundidad" value={average.deepGroundstrokes || 0} color="bg-violet-500" />
                  <MetricBar label="Win rate en red" value={average.netWinRate || 0} color="bg-amber-500" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Historial de sesiones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todavía no hay sesiones registradas para este alumno.</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session._id || session.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{session.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(session.date).toLocaleDateString('es-AR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{session.type === 'match' ? 'Partido' : 'Sesión'}</Badge>
                          <Button type="button" size="sm" variant="outline" onClick={() => setViewingSession(session)} title="Ver análisis">
                            <Eye className="h-3.5 w-3.5" />
                            Ver análisis
                          </Button>
                          {!ownMode && <>
                            <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(session)} title="Editar sesión">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeSession(session)} title="Eliminar sesión">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>}
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <div><strong>1º saque:</strong> {formatPercent((session.serving?.firstServeTotal ? ((session.serving.firstServeIn || 0) / session.serving.firstServeTotal) * 100 : 0))}</div>
                        <div><strong>Profundidad:</strong> {formatPercent((session.groundstrokes?.total ? ((session.groundstrokes.deep || 0) / session.groundstrokes.total) * 100 : 0))}</div>
                        <div><strong>Rating:</strong> {session.coachRating || 0}/10</div>
                      </div>
                      {session.notes && <p className="mt-3 text-sm text-muted-foreground">{session.notes}</p>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingSession(null) }} title={editingSession ? 'Editar sesión / partido' : 'Registrar nueva sesión / partido'} description="Carga los datos técnicos y tácticos del entrenamiento o partido." className="h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="sessionDate">Fecha</Label>
              <Input id="sessionDate" type="date" {...register('date', { required: true })} />
            </div>
            <div>
              <Label htmlFor="sessionTitle">Título</Label>
              <Input id="sessionTitle" placeholder="E.g. Entrenamiento de servicio y volea" {...register('title', { required: true })} />
            </div>
            <div>
              <Label htmlFor="sessionType">Tipo</Label>
              <Select id="sessionType" {...register('type')}>
                <option value="session">Sesión</option>
                <option value="match">Partido</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="sessionOpponent">Contrincante (opcional)</Label>
              <Input id="sessionOpponent" placeholder="Nombre del rival" {...register('opponent')} />
            </div>
            <div>
              <Label htmlFor="sessionRating">Rating del profesor</Label>
              <Select id="sessionRating" {...register('coachRating', { valueAsNumber: true })}>
                {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
                  <option key={rating} value={rating}>{rating}/10</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <MetricSection title="Rendimiento del saque" register={register} watch={watch} setValue={setValue} prefix="serving" fields={[
              ['firstServeTotal', 'Total 1º servicio'],
              ['firstServeIn', 'Aciertos 1º servicio'],
              ['secondServeTotal', 'Total 2º servicio'],
              ['secondServeIn', 'Aciertos 2º servicio'],
              ['doubleFaults', 'Dobles faltas'],
              ['net', 'Saques en red'],
              ['long', 'Saques largos'],
              ['t', 'Zona T'],
              ['body', 'Al cuerpo'],
              ['wide', 'Abiertos'],
            ]} />

            <MetricSection title="Golpes de fondo" register={register} watch={watch} setValue={setValue} prefix="groundstrokes" fields={[
              ['total', 'Total golpes'],
              ['deep', 'Profundidad'],
              ['short', 'Cortos'],
              ['winners', 'Ganadores'],
              ['errorsNet', 'Errores en red'],
              ['errorsLong', 'Errores largos'],
              ['forehandWinners', 'Ganadores de drive'],
              ['backhandWinners', 'Ganadores de revés'],
            ]} />

            <MetricSection title="Red y tácticas" register={register} watch={watch} setValue={setValue} prefix="netPlay" fields={[
              ['approaches', 'Subidas a red'],
              ['won', 'Ganadas en red'],
              ['smashes', 'Smashes'],
              ['smashesWon', 'Smashes ganados'],
              ['volleys', 'Voleas'],
              ['volleysWon', 'Voleas ganadas'],
              ['errors', 'Errores en red'],
            ]} />

            <MetricSection title="Rallies y presión" register={register} watch={watch} setValue={setValue} prefix="rally" fields={[
              ['totalRallies', 'Total rallies'],
              ['winners', 'Ganadores'],
              ['forcedErrors', 'Errores forzados'],
              ['unforcedErrors', 'Errores no forzados'],
              ['breakPointsWon', 'Break points ganados'],
              ['breakPointsLost', 'Break points perdidos'],
            ]} />
          </div>

          <div>
            <Label htmlFor="sessionNotes">Notas del profesor</Label>
            <textarea id="sessionNotes" rows="4" className="mt-1.5 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('notes')} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar sesión</Button>
          </div>
        </form>
      </Modal>

      <SessionAnalysisModal session={viewingSession} onClose={() => setViewingSession(null)} />
    </div>
  )
}

function KpiCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricBar({ label, value, color }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={`${color} h-full rounded-full`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}

function MetricSection({ title, register, watch, setValue, prefix, fields }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([name, label]) => (
          <div key={name}>
            <Label htmlFor={`${prefix}-${name}`}>{label}</Label>
            <NumericStepper
              id={`${prefix}-${name}`}
              name={`${prefix}.${name}`}
              value={watch(`${prefix}.${name}`)}
              setValue={setValue}
              registration={register(`${prefix}.${name}`, { valueAsNumber: true })}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function NumericStepper({ id, name, value, setValue, registration }) {
  const { onChange, ...inputProps } = registration

  const changeValue = (nextValue) => {
    const numericValue = Math.max(0, Math.floor(Number(nextValue) || 0))
    setValue(name, numericValue, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
  }

  return (
    <div className="flex h-9 w-full overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
      <button
        type="button"
        className="w-7 shrink-0 border-r border-input text-base font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        onClick={() => changeValue(Number(value || 0) - 1)}
        aria-label="Disminuir valor"
      >
        -
      </button>
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        value={value ?? 0}
        className="min-w-0 flex-1 bg-transparent px-0.5 text-center text-sm outline-none"
        {...inputProps}
        onChange={(event) => changeValue(event.target.value)}
      />
      <button
        type="button"
        className="w-7 shrink-0 border-l border-input text-base font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={() => changeValue(Number(value || 0) + 1)}
        aria-label="Aumentar valor"
      >
        +
      </button>
    </div>
  )
}

function SessionAnalysisModal({ session, onClose }) {
  if (!session) return null

  const serveRate = session.serving?.firstServeTotal
    ? (Number(session.serving.firstServeIn || 0) / Number(session.serving.firstServeTotal)) * 100
    : 0
  const depthRate = session.groundstrokes?.total
    ? (Number(session.groundstrokes.deep || 0) / Number(session.groundstrokes.total)) * 100
    : 0
  const netRate = session.netPlay?.approaches
    ? (Number(session.netPlay.won || 0) / Number(session.netPlay.approaches)) * 100
    : 0

  return (
    <Modal open={Boolean(session)} onClose={onClose} title={session.title} description={`${new Date(session.date).toLocaleDateString('es-AR')} · ${session.type === 'match' ? 'Partido' : 'Sesión'}`} className="max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="1º saque" value={formatPercent(serveRate)} icon={Target} />
        <KpiCard label="Profundidad" value={formatPercent(depthRate)} icon={BarChart3} />
        <KpiCard label="Win rate en red" value={formatPercent(netRate)} icon={Trophy} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <AnalysisBlock title="Servicio" values={[
          ['1º servicio total', session.serving?.firstServeTotal],
          ['1º servicio acertado', session.serving?.firstServeIn],
          ['2º servicio total', session.serving?.secondServeTotal],
          ['2º servicio acertado', session.serving?.secondServeIn],
          ['Dobles faltas', session.serving?.doubleFaults],
        ]} />
        <AnalysisBlock title="Golpes de fondo" values={[
          ['Total de golpes', session.groundstrokes?.total],
          ['Profundos', session.groundstrokes?.deep],
          ['Cortos', session.groundstrokes?.short],
          ['Ganadores', session.groundstrokes?.winners],
          ['Errores largos', session.groundstrokes?.errorsLong],
        ]} />
        <AnalysisBlock title="Juego de red" values={[
          ['Subidas', session.netPlay?.approaches],
          ['Ganadas', session.netPlay?.won],
          ['Voleas', session.netPlay?.volleys],
          ['Voleas ganadas', session.netPlay?.volleysWon],
          ['Smashes ganados', session.netPlay?.smashesWon],
        ]} />
        <AnalysisBlock title="Rallies y presión" values={[
          ['Total rallies', session.rally?.totalRallies],
          ['Ganadores', session.rally?.winners],
          ['Errores forzados', session.rally?.forcedErrors],
          ['Errores no forzados', session.rally?.unforcedErrors],
          ['Break points ganados', session.rally?.breakPointsWon],
        ]} />
      </div>
      {(session.opponent || session.notes) && (
        <div className="mt-6 space-y-2 rounded-lg border border-border bg-background p-4 text-sm">
          {session.opponent && <p><strong>Contrincante:</strong> {session.opponent}</p>}
          {session.notes && <p className="text-muted-foreground">{session.notes}</p>}
        </div>
      )}
    </Modal>
  )
}

function AnalysisBlock({ title, values }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <div className="space-y-2 text-sm">
        {values.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <strong>{value || 0}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
