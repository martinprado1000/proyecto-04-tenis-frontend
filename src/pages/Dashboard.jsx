import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Trophy,
  Medal,
  Crown,
  Swords,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  LogIn,
  Sun,
  Moon,
  BarChart2,
  GitBranch,
  Activity,
  Flame,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { OrganizationBrand } from '../components/layout/Brand'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useTenant } from '../hooks/useTenant'
import { getOrganizationBySlug } from '../api/organizations.api'
import { getPublicTorneos, getTorneos } from '../api/tournaments.api'
import { computeRoundRobinStandings } from '../components/tournaments/roundRobinStandings'
import { getMatchResult, getParticipantName } from '../components/tournaments/TournamentBracketModal'
import { RoundRobinStandingsModal2 } from '../components/tournaments/RoundRobinStandingsModal2'
import { TournamentBracketModal2 } from '../components/tournaments/TournamentBracketModal2'

function formatDate(date) {
  if (!date) return 'A definir'
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  })
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export default function Dashboard({ publicMode = false }) {
  const { tenantSlug: paramSlug } = useParams()
  const { tenantSlug: hookSlug, isSystem } = useTenant()
  const tenantSlug = paramSlug || hookSlug
  const { user, isSuperadmin } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [organization, setOrganization] = useState(null)
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTorneoId, setSelectedTorneoId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modales de detalle
  const [modalTorneo, setModalTorneo] = useState(null)
  const [modalTipo, setModalTipo] = useState(null)

  // Carga de organización y torneos
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    async function loadData() {
      try {
        if (tenantSlug && !isSystem) {
          const orgData = await getOrganizationBySlug(tenantSlug)
          if (!cancelled) setOrganization(orgData)

          // Torneos públicos de la organización
          const torneosData = await getPublicTorneos(tenantSlug)
          if (!cancelled) {
            setTorneos(torneosData)
            if (torneosData.length > 0) {
              setSelectedTorneoId(torneosData[0].id)
            }
          }
        } else if (isSystem || isSuperadmin) {
          // Si estamos en SystemMP
          const adminTorneos = await getTorneos().catch(() => [])
          if (!cancelled) {
            setTorneos(adminTorneos)
            if (adminTorneos.length > 0) {
              setSelectedTorneoId(adminTorneos[0].id)
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('No se pudo cargar la información de torneos.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [tenantSlug, isSystem, isSuperadmin])

  // Torneo actualmente enfocado
  const currentTorneo = useMemo(() => {
    if (!torneos.length) return null
    return torneos.find((t) => t.id === selectedTorneoId) || torneos[0]
  }, [torneos, selectedTorneoId])

  // Posiciones calculadas para torneo round robin
  const standings = useMemo(() => {
    if (!currentTorneo) return []
    return computeRoundRobinStandings(currentTorneo)
  }, [currentTorneo])

  // Métricas globales calculadas
  const globalMetrics = useMemo(() => {
    const totalTorneos = torneos.length
    let totalJugadores = 0
    let partidosJugados = 0
    let partidosTotales = 0
    let totalSets = 0

    torneos.forEach((t) => {
      const pCount = (t.jugadores?.length || 0) + (t.equipos?.length || 0)
      totalJugadores += pCount

      ;(t.fechas || []).forEach((f) => {
        if (!f.bye) {
          partidosTotales += 1
          if (f.jugado || f.resultado) {
            partidosJugados += 1
            if (Array.isArray(f.sets)) {
              totalSets += f.sets.length
            }
          }
        }
      })
    })

    return { totalTorneos, totalJugadores, partidosJugados, partidosTotales, totalSets }
  }, [torneos])

  // Partidos del torneo actual ordenados por estado
  const { partidosRecientes, proximosPartidos } = useMemo(() => {
    if (!currentTorneo || !Array.isArray(currentTorneo.fechas)) {
      return { partidosRecientes: [], proximosPartidos: [] }
    }

    const validMatches = currentTorneo.fechas.filter(
      (f) => !f.bye && f.participante1 && f.participante2
    )

    const jugados = validMatches
      .filter((f) => f.jugado || f.resultado)
      .slice(-6)
      .reverse()

    const pendientes = validMatches
      .filter((f) => !f.jugado && !f.resultado)
      .slice(0, 6)

    return { partidosRecientes: jugados, proximosPartidos: pendientes }
  }, [currentTorneo])

  // Filtrado de posiciones por búsqueda de jugador
  const filteredStandings = useMemo(() => {
    if (!searchQuery.trim()) return standings
    const q = searchQuery.toLowerCase()
    return standings.filter((row) => {
      const name = getParticipantName(row.participant)?.toLowerCase() || ''
      return name.includes(q)
    })
  }, [standings, searchQuery])

  // Top 3 del podio
  const topThree = useMemo(() => {
    return standings.slice(0, 3)
  }, [standings])

  const loginUri = tenantSlug ? `/${tenantSlug}/login` : '/SystemMP/login'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Header exclusivo para modo público */}
      {publicMode && (
        <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <OrganizationBrand organization={organization} />
              <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary sm:inline-flex">
                <Flame className="mr-1 h-3.5 w-3.5 text-ball" /> En Vivo
              </Badge>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4">
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                aria-label="Cambiar tema"
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <Link to={loginUri}>
                <Button className="group flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90">
                  <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  <span>Iniciar sesión</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* 2. Hero y Bienvenida */}
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background py-8 sm:py-12">
        <div className="court-lines pointer-events-none absolute inset-0 opacity-25" />
        <div className="pointer-events-none absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-ball/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Activity className="h-4 w-4" />
                <span>Centro Oficial de Competencias</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                {organization?.name ? `${organization.name} · Torneos` : 'Dashboard de Torneos'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Seguí en vivo los torneos en curso, líderes del certamen, tablas provisorias y fixtures actualizados minuto a minuto.
              </p>
            </div>

            {!publicMode && user && (
              <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                  {getInitials(`${user.nombre || ''} ${user.apellido || ''}`)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sesión iniciada</p>
                  <p className="text-sm font-semibold">{user.nombre} {user.apellido}</p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Tarjetas de Métricas Globales */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Card className="border-border/70 bg-card/60 backdrop-blur-md transition hover:border-primary/40">
              <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">{globalMetrics.totalTorneos}</p>
                  <p className="text-xs font-medium text-muted-foreground">Torneos Activos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/60 backdrop-blur-md transition hover:border-primary/40">
              <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ball/20 text-ball dark:text-ball">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">{globalMetrics.totalJugadores}</p>
                  <p className="text-xs font-medium text-muted-foreground">Participantes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/60 backdrop-blur-md transition hover:border-primary/40">
              <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Swords className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">
                    {globalMetrics.partidosJugados}
                    <span className="text-xs font-normal text-muted-foreground"> / {globalMetrics.partidosTotales}</span>
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">Partidos Jugados</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/60 backdrop-blur-md transition hover:border-primary/40">
              <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">{globalMetrics.totalSets}</p>
                  <p className="text-xs font-medium text-muted-foreground">Sets Disputados</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Cargando torneos y resultados...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        ) : torneos.length === 0 ? (
          <Card className="p-10 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-bold">No hay torneos en curso</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              La organización aún no tiene torneos activos registrados.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Torneos en Curso — layout v2 (rollback: src/pages/_rollback/Dashboard-torneos-en-curso.v1.md) */}
            <section aria-labelledby="torneos-en-curso-heading">
              <div className="mb-4">
                <h2 id="torneos-en-curso-heading" className="text-lg font-bold tracking-tight">
                  Torneos en Curso
                </h2>
                <p className="text-xs text-muted-foreground">
                  Elegí un torneo; todo lo que aparece en el recuadro verde corresponde a esa competencia.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {torneos.map((t) => {
                  const isSelected = t.id === currentTorneo?.id
                  const isRoundRobin = t.formato?.toLowerCase().includes('roundrobin')
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTorneoId(t.id)
                        setSearchQuery('')
                      }}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md shadow-primary/10 ring-2 ring-primary/60'
                          : 'border-border bg-card/60 hover:border-primary/40 hover:bg-accent/40'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isRoundRobin ? <BarChart2 className="h-5 w-5" /> : <GitBranch className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {t.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {t.formato} · {t.jugadores?.length || t.equipos?.length || 0} part.
                        </p>
                      </div>
                      {isSelected && (
                        <Badge variant="outline" className="hidden shrink-0 border-primary/40 bg-primary/15 text-[10px] text-primary sm:inline-flex">
                          Activo
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {currentTorneo && (
              <section
                className="overflow-hidden rounded-3xl border-2 border-primary/45 bg-gradient-to-b from-primary/[0.08] via-card/40 to-card/80 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                aria-labelledby="torneo-seleccionado-heading"
              >
                <div className="border-b border-primary/25 bg-primary/10 px-4 py-3 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          Datos del torneo seleccionado
                        </p>
                        <h2 id="torneo-seleccionado-heading" className="truncate text-lg font-extrabold sm:text-xl">
                          {currentTorneo.name}
                        </h2>
                      </div>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar participante en este torneo..."
                        className="w-full rounded-xl border border-primary/25 bg-background/80 py-2 pl-9 pr-4 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8 p-4 sm:p-6">
                {/* Cabecera del Torneo Seleccionado */}
                <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                        {currentTorneo.formato}
                      </Badge>
                      <Badge variant="secondary">
                        {currentTorneo.setsCount ? `${currentTorneo.setsCount} Sets` : 'Al mejor de 3'}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Inicio: {formatDate(currentTorneo.fechaInicio)} · Fin estimado: {formatDate(currentTorneo.fechaFin)}
                      </span>
                    </p>
                  </div>

                  {/* Botones de acción modal */}
                  <div className="flex items-center gap-2 shrink-0">
                    {currentTorneo.formato?.toLowerCase().includes('roundrobin') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModalTorneo(currentTorneo)
                          setModalTipo('posiciones')
                        }}
                        className="flex items-center gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <BarChart2 className="h-4 w-4" />
                        <span>Ver tabla y PDF</span>
                      </Button>
                    )}
                    {currentTorneo.formato?.toLowerCase().includes('playoffs') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModalTorneo(currentTorneo)
                          setModalTipo('llave')
                        }}
                        className="flex items-center gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <GitBranch className="h-4 w-4" />
                        <span>Ver llave completa</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* 6. Podio y Resultados Provisorios (Formato Round Robin) */}
                {currentTorneo.formato?.toLowerCase().includes('roundrobin') ? (
                  <div className="space-y-6">
                    {/* Podio Top 3 */}
                    {topThree.length > 0 && !searchQuery && (
                      <div>
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span>Podio Provisorio</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          {topThree.map((item, idx) => {
                            const name = getParticipantName(item.participant)
                            const pos = idx + 1
                            const isFirst = pos === 1
                            const isSecond = pos === 2
                            const isThird = pos === 3

                            const borderClass = isFirst
                              ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-card to-card shadow-lg shadow-amber-500/10'
                              : isSecond
                              ? 'border-slate-300 dark:border-slate-600 bg-gradient-to-b from-slate-400/10 via-card to-card'
                              : 'border-amber-700/60 bg-gradient-to-b from-amber-700/10 via-card to-card'

                            return (
                              <Card key={item.participant?.id || idx} className={`relative overflow-hidden ${borderClass}`}>
                                <div className="p-5">
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-sm ${
                                        isFirst
                                          ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30'
                                          : isSecond
                                          ? 'bg-slate-300 text-slate-900 dark:bg-slate-600 dark:text-slate-100'
                                          : 'bg-amber-700 text-amber-100'
                                      }`}
                                    >
                                      #{pos}
                                    </span>
                                    {isFirst ? (
                                      <Crown className="h-6 w-6 text-amber-500" />
                                    ) : (
                                      <Medal className={`h-6 w-6 ${isSecond ? 'text-slate-400' : 'text-amber-700'}`} />
                                    )}
                                  </div>

                                  <div className="mt-4 flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base">
                                      {getInitials(name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="truncate font-bold text-base">{name}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        {item.participant?.categoria ? `Cat. ${item.participant.categoria}` : 'Participante'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/50 pt-4 text-center">
                                    <div className="rounded-xl bg-card/80 p-2">
                                      <p className="text-lg font-black text-primary">{item.points}</p>
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Puntos</p>
                                    </div>
                                    <div className="rounded-xl bg-card/80 p-2">
                                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                        {item.wins}
                                        <span className="text-xs font-normal text-muted-foreground">-{item.losses}</span>
                                      </p>
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground">G - P</p>
                                    </div>
                                    <div className="rounded-xl bg-card/80 p-2">
                                      <p className="text-lg font-black">{Number(item.setPercentage || 0).toFixed(0)}%</p>
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Sets %</p>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Leaderboard completo en Tarjetas Visuales (No tabla aburrida) */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          <BarChart2 className="h-4 w-4 text-primary" />
                          <span>Clasificación Provisoria Completa</span>
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {filteredStandings.length} participantes
                        </span>
                      </div>

                      {filteredStandings.length === 0 ? (
                        <Card className="p-8 text-center text-sm text-muted-foreground">
                          No se encontraron participantes que coincidan con la búsqueda.
                        </Card>
                      ) : (
                        <div className="space-y-2.5">
                          {filteredStandings.map((row, idx) => {
                            const pos = idx + 1
                            const name = getParticipantName(row.participant)
                            const isAscenso = pos <= 2 && filteredStandings.length >= 4
                            const isDescenso = pos > filteredStandings.length - 2 && filteredStandings.length >= 4

                            return (
                              <div
                                key={row.participant?.id || idx}
                                className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm transition hover:border-primary/50 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-4"
                              >
                                <div className="flex items-center gap-3.5">
                                  {/* Badge Posición */}
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                                      pos === 1
                                        ? 'bg-amber-400 text-amber-950'
                                        : pos === 2
                                        ? 'bg-slate-300 text-slate-900 dark:bg-slate-600 dark:text-slate-100'
                                        : pos === 3
                                        ? 'bg-amber-700 text-amber-100'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    #{pos}
                                  </div>

                                  {/* Avatar e Identidad */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                                      {getInitials(name)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-foreground">{name}</p>
                                        {isAscenso && (
                                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            Ascenso
                                          </span>
                                        )}
                                        {isDescenso && (
                                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                            Zona riesgo
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {row.participant?.categoria ? `Categoría ${row.participant.categoria}` : 'Jugador oficial'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Estadísticas en Chips y Barras */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                  {/* Partidos Jugados */}
                                  <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-2.5 py-1 text-xs">
                                    <span className="text-muted-foreground">PJ:</span>
                                    <span className="font-bold">{row.played}</span>
                                  </div>

                                  {/* Ganados / Perdidos */}
                                  <div className="flex items-center gap-1 rounded-xl bg-muted/50 px-2.5 py-1 text-xs">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{row.wins}G</span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400">{row.losses}P</span>
                                  </div>

                                  {/* Barra de Sets Ganados % */}
                                  <div className="hidden items-center gap-2 md:flex">
                                    <div className="w-20 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-2 rounded-full bg-primary"
                                        style={{ width: `${Math.min(100, Math.max(0, row.setPercentage || 0))}%` }}
                                      />
                                    </div>
                                    <span className="w-10 text-right text-xs font-semibold text-muted-foreground">
                                      {Number(row.setPercentage || 0).toFixed(0)}%
                                    </span>
                                  </div>

                                  {/* Puntos Destacados */}
                                  <div className="flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                                    <span>{row.points}</span>
                                    <span className="text-[10px] font-medium uppercase">PTS</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Formato Playoffs: Cuadro Resumido de Llaves */
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      <GitBranch className="h-4 w-4 text-primary" />
                      <span>Llave de Eliminación Directa</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(currentTorneo.fechas || [])
                        .filter((f) => !f.bye && f.participante1 && f.participante2)
                        .slice(0, 6)
                        .map((partido, idx) => {
                          const p1Name = getParticipantName(partido.participante1)
                          const p2Name = getParticipantName(partido.participante2)
                          const { isPlayed, winner } = getMatchResult(partido)

                          return (
                            <Card key={partido.id || idx} className="border-border/70 p-4 transition hover:border-primary/50">
                              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                <span>Ronda {partido.round || 'Playoff'}</span>
                                <Badge variant={isPlayed ? 'success' : 'warning'} className="text-[10px]">
                                  {isPlayed ? 'Finalizado' : 'Pendiente'}
                                </Badge>
                              </div>

                              <div className="space-y-2">
                                <div className={`flex items-center justify-between rounded-lg p-2 ${
                                  winner?.id === partido.participante1?.id ? 'bg-primary/10 font-bold text-primary' : 'bg-muted/40'
                                }`}>
                                  <span className="truncate text-xs">{p1Name}</span>
                                  {isPlayed && (
                                    <span className="text-xs font-mono">
                                      {partido.sets?.map((s) => s.local).join(' ')}
                                    </span>
                                  )}
                                </div>

                                <div className={`flex items-center justify-between rounded-lg p-2 ${
                                  winner?.id === partido.participante2?.id ? 'bg-primary/10 font-bold text-primary' : 'bg-muted/40'
                                }`}>
                                  <span className="truncate text-xs">{p2Name}</span>
                                  {isPlayed && (
                                    <span className="text-xs font-mono">
                                      {partido.sets?.map((s) => s.visitante).join(' ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* 7. Fixtures: Próximos Encuentros y Últimos Resultados */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Próximos Encuentros */}
                  <Card className="border-border/70">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-base">Próximos Partidos Programados</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {proximosPartidos.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          No hay partidos pendientes programados en este torneo.
                        </p>
                      ) : (
                        proximosPartidos.map((partido, idx) => {
                          const p1 = getParticipantName(partido.participante1)
                          const p2 = getParticipantName(partido.participante2)

                          return (
                            <div
                              key={partido.id || idx}
                              className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3 transition hover:border-primary/40"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                  <span className="truncate">{p1}</span>
                                  <span className="text-muted-foreground font-normal">vs</span>
                                  <span className="truncate">{p2}</span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  Ronda {partido.round || 1} · {formatDate(partido.fecha)}
                                </p>
                              </div>
                              <Badge variant="warning" className="shrink-0 text-[10px]">
                                Por jugar
                              </Badge>
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>

                  {/* Últimos Resultados Disputados */}
                  <Card className="border-border/70">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Últimos Resultados Registrados</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {partidosRecientes.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          Aún no se registraron resultados de partidos disputados.
                        </p>
                      ) : (
                        partidosRecientes.map((partido, idx) => {
                          const p1 = getParticipantName(partido.participante1)
                          const p2 = getParticipantName(partido.participante2)
                          const { winner } = getMatchResult(partido)

                          return (
                            <div
                              key={partido.id || idx}
                              className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3 transition hover:border-primary/40"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className={`truncate ${winner?.id === partido.participante1?.id ? 'font-bold text-primary' : 'font-medium'}`}>
                                    {p1}
                                  </span>
                                  <span className="text-muted-foreground">vs</span>
                                  <span className={`truncate ${winner?.id === partido.participante2?.id ? 'font-bold text-primary' : 'font-medium'}`}>
                                    {p2}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  {formatDate(partido.fecha)}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {Array.isArray(partido.sets) && partido.sets.length > 0 ? (
                                  <div className="flex gap-1 rounded-xl bg-card px-2.5 py-1 text-xs font-mono font-bold shadow-sm">
                                    {partido.sets.map((s, sIdx) => (
                                      <span key={sIdx} className="text-foreground">
                                        {s.local}-{s.visitante}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <Badge variant="success" className="text-[10px]">Jugado</Badge>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>
                </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* 8. Banner CTA para Modo Público */}
        {publicMode && (
          <div className="mt-14 relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-background to-primary/10 p-6 sm:p-10 text-center">
            <div className="court-lines pointer-events-none absolute inset-0 opacity-20" />
            <div className="relative z-10 mx-auto max-w-xl">
              <Trophy className="mx-auto h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-extrabold sm:text-2xl">
                ¿Sos jugador o socio de {organization?.name || 'este club'}?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Iniciá sesión para consultar tus fechas de juego personalizadas, registrar tus resultados y analizar tus estadísticas individuales.
              </p>
              <div className="mt-6 flex justify-center">
                <Link to={loginUri}>
                  <Button size="lg" className="rounded-2xl px-6 font-bold shadow-xl shadow-primary/20">
                    <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión ahora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales de detalle */}
      {modalTipo === 'posiciones' && modalTorneo && (
        <RoundRobinStandingsModal2
          torneo={modalTorneo}
          open={Boolean(modalTorneo)}
          onClose={() => {
            setModalTorneo(null)
            setModalTipo(null)
          }}
        />
      )}
      {modalTipo === 'llave' && modalTorneo && (
        <TournamentBracketModal2
          torneo={modalTorneo}
          open={Boolean(modalTorneo)}
          onClose={() => {
            setModalTorneo(null)
            setModalTipo(null)
          }}
        />
      )}
    </div>
  )
}
