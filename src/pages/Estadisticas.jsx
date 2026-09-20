import { useEffect, useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  Activity, BarChart3, CalendarDays, CircleDot,
  Swords, Target, Trophy, TrendingUp, TrendingDown, Minus,
  Award, Zap, Users
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getMisEstadisticas } from '../api/statistics.api'
import { H2HChart } from '../components/charts/H2HChart'

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ value, label, Icon, accent = 'primary', sublabel }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-500',
    amber: 'bg-amber-500/10 text-amber-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
  }
  return (
    <Card className="border-border/70 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="flex items-start gap-4 pt-6 pb-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-black tracking-tight text-foreground leading-none">{value ?? 0}</p>
          <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Donut Winrate ───────────────────────────────────────────── */
function WinRateDonut({ winRate }) {
  const data = [
    { value: winRate, color: 'hsl(142, 55%, 40%)' },
    { value: 100 - winRate, color: 'hsl(var(--border))' },
  ]
  return (
    <div className="relative flex items-center justify-center">
      <PieChart width={120} height={120}>
        <Pie
          data={data}
          cx={60} cy={60}
          innerRadius={44}
          outerRadius={56}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-foreground leading-none">{winRate}%</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">efectiv.</span>
      </div>
    </div>
  )
}

/* ── Stat Row ────────────────────────────────────────────────── */
function StatProgressRow({ label, won, lost, color = 'bg-primary' }) {
  const total = won + lost
  const percent = total ? Math.round((won / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-xs font-bold text-muted-foreground">{won}G — {lost}P</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className={`${color} rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-right text-[10px] text-muted-foreground">{percent}% de efectividad</p>
    </div>
  )
}

/* ── Custom Tooltip para AreaChart ───────────────────────────── */
const AreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl text-sm">
      <p className="font-bold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Partidos: <strong className="text-primary">{payload[0]?.value}</strong></p>
      {payload[1] && <p className="text-muted-foreground">Ganados: <strong className="text-emerald-500">{payload[1]?.value}</strong></p>}
    </div>
  )
}

/* ── Trend icon ──────────────────────────────────────────────── */
function TrendIcon({ value }) {
  if (value > 0) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (value < 0) return <TrendingDown className="h-3.5 w-3.5 text-destructive" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

/* ══════════════════════════════════════════════════════════════ */
export default function Estadisticas() {
  const [data, setData] = useState({ summary: {}, byTournament: [], byMonth: [] })
  const [filters, setFilters] = useState({ year: '', month: '', tipo: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [availableYears, setAvailableYears] = useState([])

  useEffect(() => {
    setLoading(true)
    getMisEstadisticas(filters)
      .then((res) => {
        setData(res || {})
        if (Array.isArray(res?.availableYears) && res.availableYears.length > 0) {
          setAvailableYears(res.availableYears)
        } else if (res?.byMonth && res.byMonth.length > 0) {
          setAvailableYears((prev) => {
            const set = new Set([...prev, ...res.byMonth.map((item) => Number(item.year)).filter(Boolean)])
            return [...set].sort((a, b) => b - a)
          })
        }
      })
      .catch(() => setError('No se pudieron cargar tus estadísticas.'))
      .finally(() => setLoading(false))
  }, [filters])

  const summary = data.summary || {}

  // Monthly area chart data
  const monthlyData = useMemo(() => {
    return (data.byMonth || []).map((item) => ({
      name: `${MONTH_NAMES[(item.month || 1) - 1]} ${String(item.year).slice(-2)}`,
      partidos: item.matchesPlayed || 0,
      ganados: item.matchesWon || 0,
    }))
  }, [data.byMonth])

  return (
    <div>
      <PageHeader
        eyebrow="Mi actividad"
        title="Mis Estadísticas"
        description="Conocé tu evolución y rendimiento en torneos de singles y dobles."
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Filters ─────────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Filtros de análisis</p>
              <p className="text-xs text-muted-foreground mt-0.5">Filtrá por período y modalidad para ajustar las métricas.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:flex sm:items-end">
              {[
                {
                  label: 'Año',
                  value: filters.year,
                  onChange: (v) => setFilters({ ...filters, year: v }),
                  options: [{ value: '', label: 'Todos' }, ...availableYears.map(y => ({ value: String(y), label: String(y) }))],
                },
                {
                  label: 'Mes',
                  value: filters.month,
                  onChange: (v) => setFilters({ ...filters, month: v }),
                  options: [
                    { value: '', label: 'Todos' },
                    ...MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m })),
                  ],
                },
                {
                  label: 'Modalidad',
                  value: filters.tipo,
                  onChange: (v) => setFilters({ ...filters, tipo: v }),
                  options: [
                    { value: '', label: 'Singles y Dobles' },
                    { value: 'singles', label: 'Singles' },
                    { value: 'dobles', label: 'Dobles' },
                  ],
                },
              ].map(({ label, value, onChange, options }) => (
                <label key={label} className="text-xs text-muted-foreground font-medium">
                  {label}
                  <select
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                  >
                    {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm font-medium">Calculando estadísticas...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center py-10">{error}</p>
        ) : (
          <>
            {/* ── KPI Row ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <KpiCard value={summary.matchesPlayed} label="Partidos jugados" Icon={Swords} accent="primary" sublabel={`${summary.tournamentsPlayed || 0} torneo${summary.tournamentsPlayed !== 1 ? 's' : ''}`} />
              <KpiCard value={summary.matchesWon} label="Partidos ganados" Icon={Trophy} accent="amber" sublabel={`Tasa: ${summary.winRate || 0}%`} />
              <KpiCard value={summary.setsWon} label="Sets ganados" Icon={Target} accent="emerald" sublabel={`Perdidos: ${summary.setsLost || 0}`} />
              <KpiCard value={summary.gamesWon} label="Juegos ganados" Icon={CircleDot} accent="blue" sublabel={`Perdidos: ${summary.gamesLost || 0}`} />
            </div>

            {/* ── Performance + Monthly Chart ─────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Rendimiento general */}
              <Card className="border-border/70">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-primary" />
                    Rendimiento general
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-6">
                    <WinRateDonut winRate={summary.winRate || 0} />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-black text-foreground leading-none">{summary.winRate || 0}%</span>
                        <TrendIcon value={summary.winRate - 50} />
                      </div>
                      <p className="text-sm text-muted-foreground">de efectividad global</p>
                      <div className="flex gap-3 mt-2">
                        <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-center">
                          <p className="text-lg font-black text-primary leading-none">{summary.matchesWon || 0}</p>
                          <p className="text-[10px] text-primary/70 font-medium">Ganados</p>
                        </div>
                        <div className="rounded-lg bg-destructive/10 px-3 py-1.5 text-center">
                          <p className="text-lg font-black text-destructive leading-none">{summary.matchesLost || 0}</p>
                          <p className="text-[10px] text-destructive/70 font-medium">Perdidos</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-border/50">
                    <StatProgressRow label="Partidos" won={summary.matchesWon || 0} lost={summary.matchesLost || 0} color="bg-primary" />
                    <StatProgressRow label="Sets" won={summary.setsWon || 0} lost={summary.setsLost || 0} color="bg-emerald-500" />
                    <StatProgressRow label="Juegos" won={summary.gamesWon || 0} lost={summary.gamesLost || 0} color="bg-blue-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Evolución mensual */}
              <Card className="border-border/70">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Evolución mensual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradPlayed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 55%, 40%)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(142, 55%, 40%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradWon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(160, 70%, 40%)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="hsl(160, 70%, 40%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<AreaTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="partidos" stroke="hsl(142, 55%, 40%)" strokeWidth={2} fill="url(#gradPlayed)" dot={false} activeDot={{ r: 4 }} />
                        <Area type="monotone" dataKey="ganados" stroke="hsl(160, 70%, 40%)" strokeWidth={2} fill="url(#gradWon)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Todavía no hay partidos con fecha registrada.</p>
                    </div>
                  )}
                  {monthlyData.length > 0 && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Jugados</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Ganados</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── By Tournament ───────────────────────────────── */}
            <Card className="border-border/70">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Rendimiento por torneo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {data.byTournament?.length ? (
                  <div className="space-y-3">
                    {data.byTournament.map((item) => {
                      const winPct = item.matchesPlayed
                        ? Math.round((item.matchesWon / item.matchesPlayed) * 100)
                        : 0
                      const isWinning = item.matchesWon >= item.matchesLost

                      return (
                        <div
                          key={String(item.tournamentId)}
                          className="group rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isWinning ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <Award className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{item.tournamentName}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.tipo === 'singles' ? 'Singles' : 'Dobles'} · {item.formato}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 flex-wrap">
                              <Badge
                                variant={isWinning ? 'success' : 'secondary'}
                                className="font-bold text-xs"
                              >
                                {item.matchesWon}G — {item.matchesLost}P
                              </Badge>
                              <span className={`text-sm font-black ${winPct >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                                {winPct}%
                              </span>
                            </div>
                          </div>

                          {/* Mini progress bar */}
                          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="bg-primary rounded-full transition-all duration-700" style={{ width: `${winPct}%` }} />
                          </div>

                          {/* Stats grid */}
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                            {[
                              { label: 'Partidos', value: item.matchesPlayed },
                              { label: 'Sets', value: `${item.setsWon}—${item.setsLost}` },
                              { label: 'Juegos', value: `${item.gamesWon}—${item.gamesLost}` },
                              { label: 'Puntos', value: item.points },
                            ].map(({ label, value }) => (
                              <div key={label} className="rounded-lg bg-muted/50 px-2.5 py-1.5">
                                <p className="text-muted-foreground">{label}</p>
                                <p className="font-bold text-foreground text-sm">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-14 text-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Tus torneos aparecerán cuando registres resultados.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── H2H Comparison ──────────────────────────────── */}
            <H2HChart />
          </>
        )}
      </div>
    </div>
  )
}
