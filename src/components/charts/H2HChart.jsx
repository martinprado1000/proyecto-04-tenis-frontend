import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Users, TrendingUp, Award, Loader2, Search, ChevronDown, Swords } from 'lucide-react'
import { getStatisticsPlayers, getH2H } from '../../api/statistics.api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'

// CSS variable-aware colors (Tailwind HSL vars)
const PLAYER_COLOR = 'hsl(142, 55%, 40%)'   // --primary green
const RIVAL_COLOR = 'hsl(220, 60%, 58%)'     // blue accent
const PLAYER_COLOR_MUTED = 'hsl(142, 55%, 40%, 0.15)'
const RIVAL_COLOR_MUTED = 'hsl(220, 60%, 58%, 0.15)'

function getInitials(name, lastname) {
  const a = (name || '').trim()[0] || ''
  const b = (lastname || '').trim()[0] || ''
  return (a + b).toUpperCase() || '?'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl text-sm space-y-1.5">
      <p className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full inline-block" style={{ background: entry.fill }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-bold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

const MiniChart = ({ title, data, playerLabel, rivalLabel, maxVal }) => (
  <div className="flex flex-col gap-2">
    <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barCategoryGap="30%" barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={[0, maxVal || 'auto']} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="player" name={playerLabel} fill={PLAYER_COLOR} radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="rival" name={rivalLabel} fill={RIVAL_COLOR} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

function PlayerAvatar({ name, lastname, color, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'
  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full font-bold shadow-inner border-2`}
      style={{ background: `${color}22`, borderColor: color, color }}
    >
      {getInitials(name, lastname)}
    </div>
  )
}

export function H2HChart() {
  const [players, setPlayers] = useState([])
  const [rivalId, setRivalId] = useState('')
  const [rivalSearch, setRivalSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [h2hData, setH2hData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoadingPlayers(true)
    getStatisticsPlayers()
      .then(setPlayers)
      .catch(() => setError('No se pudo cargar la lista de jugadores.'))
      .finally(() => setLoadingPlayers(false))
  }, [])

  const fetchH2H = useCallback(async (id) => {
    if (!id) return
    setLoading(true)
    setError('')
    setH2hData(null)
    try {
      const result = await getH2H(id)
      setH2hData(result)
    } catch {
      setError('No se pudo cargar la comparación. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectRival = (player) => {
    setRivalId(player.id)
    setRivalSearch(`${player.name} ${player.lastname}`.trim())
    setDropdownOpen(false)
    fetchH2H(player.id)
  }

  const filteredPlayers = players.filter(p =>
    `${p.name} ${p.lastname}`.toLowerCase().includes(rivalSearch.toLowerCase()) && p.id !== rivalId
  )

  const selectedRival = players.find(p => p.id === rivalId)

  // Build chart datasets when h2hData is available
  const chartData = h2hData ? {
    partidos: [{
      name: 'Ganados',
      player: h2hData.player.matchesWon,
      rival: h2hData.rival.matchesWon,
    }, {
      name: 'Perdidos',
      player: h2hData.player.matchesLost,
      rival: h2hData.rival.matchesLost,
    }],
    sets: [{
      name: 'Sets gan.',
      player: h2hData.player.setsWon,
      rival: h2hData.rival.setsWon,
    }, {
      name: 'Sets perd.',
      player: h2hData.player.setsLost,
      rival: h2hData.rival.setsLost,
    }],
    puntos: [{
      name: 'Puntos',
      player: h2hData.player.points,
      rival: h2hData.rival.points,
    }],
  } : null

  const playerLabel = h2hData?.player?.name || 'Vos'
  const rivalLabel = h2hData?.rival?.name || 'Rival'

  const totalMatches = h2hData
    ? h2hData.player.matchesWon + h2hData.player.matchesLost
    : 0

  return (
    <Card className="border-border/70 overflow-visible">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Swords className="h-4 w-4" />
          </div>
          Comparación cabeza a cabeza
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Seleccioná un rival para ver las estadísticas de tus enfrentamientos directos
        </p>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Rival selector */}
        <div className="relative max-w-md">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Elegir rival
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={rivalSearch}
              onChange={e => { setRivalSearch(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={loadingPlayers ? 'Cargando jugadores...' : 'Buscá un jugador...'}
              disabled={loadingPlayers}
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
            />
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {dropdownOpen && filteredPlayers.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-card shadow-2xl shadow-black/10">
              {filteredPlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSelectRival(player)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted/70 transition-colors"
                >
                  <PlayerAvatar name={player.name} lastname={player.lastname} color={RIVAL_COLOR} size="sm" />
                  <span className="font-medium">{player.name} {player.lastname}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium">Calculando enfrentamientos...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="text-sm text-destructive text-center py-6">{error}</p>
        )}

        {/* No rivalry data (rival selected but 0 matches) */}
        {h2hData && totalMatches === 0 && !loading && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Swords className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Sin enfrentamientos directos</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Vos y <strong>{h2hData.rival.name || selectedRival ? `${selectedRival?.name} ${selectedRival?.lastname}` : 'este rival'}</strong> no se han enfrentado directamente en ningún torneo todavía.
            </p>
          </div>
        )}

        {/* H2H results */}
        {h2hData && totalMatches > 0 && !loading && (
          <div className="space-y-6">
            {/* Player cards scoreboard */}
            <div className="relative flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-primary/5 via-card to-blue-500/5 p-5">
              {/* Player (you) */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <PlayerAvatar name={h2hData.player.name?.split(' ')[0]} lastname={h2hData.player.name?.split(' ')[1]} color={PLAYER_COLOR} size="lg" />
                <p className="text-sm font-bold text-foreground text-center leading-tight">{h2hData.player.name || 'Vos'}</p>
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-bold">Jugador</Badge>
              </div>

              {/* Score center */}
              <div className="flex flex-col items-center gap-1 px-4">
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-black tabular-nums ${h2hData.player.matchesWon > h2hData.rival.matchesWon ? 'text-primary' : 'text-foreground'}`}>
                    {h2hData.player.matchesWon}
                  </span>
                  <span className="text-xl text-muted-foreground font-light">—</span>
                  <span className={`text-4xl font-black tabular-nums ${h2hData.rival.matchesWon > h2hData.player.matchesWon ? 'text-blue-500' : 'text-foreground'}`}>
                    {h2hData.rival.matchesWon}
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Partidos ganados</span>
                <div className="mt-1 px-3 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {totalMatches} enfrentamiento{totalMatches !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Rival */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <PlayerAvatar name={h2hData.rival.name?.split(' ')[0]} lastname={h2hData.rival.name?.split(' ')[1]} color={RIVAL_COLOR} size="lg" />
                <p className="text-sm font-bold text-foreground text-center leading-tight">{h2hData.rival.name || rivalLabel}</p>
                <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/5 text-xs font-bold">Rival</Badge>
              </div>
            </div>

            {/* 3 mini grouped bar charts */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <MiniChart
                  title="Partidos"
                  data={chartData.partidos}
                  playerLabel={playerLabel}
                  rivalLabel={rivalLabel}
                />
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <MiniChart
                  title="Sets"
                  data={chartData.sets}
                  playerLabel={playerLabel}
                  rivalLabel={rivalLabel}
                />
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <MiniChart
                  title="Puntos"
                  data={chartData.puntos}
                  playerLabel={playerLabel}
                  rivalLabel={rivalLabel}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm inline-block" style={{ background: PLAYER_COLOR }} />
                {playerLabel}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm inline-block" style={{ background: RIVAL_COLOR }} />
                {rivalLabel}
              </span>
            </div>
          </div>
        )}

        {/* Empty state — no rival selected */}
        {!h2hData && !loading && !error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold text-foreground">Elegí un rival para comparar</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Seleccioná un jugador del campo de búsqueda para ver el historial de enfrentamientos directos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
