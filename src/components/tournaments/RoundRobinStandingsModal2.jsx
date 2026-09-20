import { useMemo, useRef } from 'react'
import { Trophy, BarChart2, TrendingUp, TrendingDown, Minus, FileDown, Loader2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { getMatchResult, getParticipantName } from './TournamentBracketModal'
import { useGeneratePdf } from '../../hooks/useGeneratePdf'

function computeStandings(torneo) {
  if (!torneo || !Array.isArray(torneo.fechas)) return []
  const map = new Map()

  function normalizeParticipant(p) {
    if (!p) return null
    if (typeof p === 'string') return { id: p }
    const id = String(p.id ?? p._id ?? p.userId ?? '')
    if (!id) return null
    return { ...p, id }
  }

  function ensure(p) {
    const normalized = normalizeParticipant(p)
    if (!normalized) return
    if (!map.has(normalized.id)) map.set(normalized.id, { participant: normalized, played: 0, wins: 0, losses: 0, points: 0 })
  }

  const participantes = torneo.jugadores || torneo.equipos || []
  for (const participante of participantes) ensure(participante)

  for (const fecha of torneo.fechas) {
    const p1 = normalizeParticipant(fecha.participante1 || fecha.jugador1 || fecha.equipo1)
    const p2 = normalizeParticipant(fecha.participante2 || fecha.jugador2 || fecha.equipo2)
    ensure(p1)
    ensure(p2)
    const normalizedFecha = { ...fecha, participante1: p1, participante2: p2, jugado: fecha.jugado === true || Boolean(fecha.resultado) }
    const { winner, loser, isPlayed } = getMatchResult(normalizedFecha)
    if (!isPlayed || !winner || !loser) continue
    const winnerId = String(winner.id ?? winner._id ?? '')
    const loserId = String(loser.id ?? loser._id ?? '')
    const w = map.get(winnerId)
    const l = map.get(loserId)
    if (w) { w.played++; w.wins++; w.points++ }
    if (l) { l.played++; l.losses++ }
  }

  return [...map.values()].sort((a, b) =>
    b.points !== a.points ? b.points - a.points : b.wins - a.wins
  )
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export function RoundRobinStandingsModal2({ torneo, open, onClose }) {
  const standings = useMemo(() => computeStandings(torneo), [torneo])
  const contentRef = useRef(null)
  const { generating, generatePdf } = useGeneratePdf()

  if (!open || !torneo) return null
  const total = standings.length

  function handlePdf() {
    const name = torneo.name?.replace(/\s+/g, '_') || 'torneo'
    generatePdf(contentRef, `posiciones_${name}.pdf`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      className="max-w-[95vw] w-[660px] bg-background text-foreground border-border p-4 sm:p-5 rounded-2xl shadow-2xl"
    >
      <div ref={contentRef} className="bg-background p-1.5 rounded-xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                {torneo.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-2 py-0.5 text-xs font-semibold">
                  Round Robin
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  {torneo.formato} · {torneo.jugadores?.length || torneo.equipos?.length || 0} participantes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Standings Table */}
        <div className="rounded-2xl overflow-hidden border border-border/60 bg-card shadow-soft">
          {standings.length === 0 ? (
            <div className="flex flex-col h-48 items-center justify-center text-muted-foreground gap-3">
              <BarChart2 className="h-8 w-8 opacity-20" />
              <p className="text-sm font-medium">No se han registrado resultados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                    <th className="w-[44px] py-3 text-center">Pos</th>
                    <th className="w-auto py-3 pl-3 text-left">Participante</th>
                    <th className="w-[50px] py-3 text-center" title="Partidos Jugados">PJ</th>
                    <th className="w-[50px] py-3 text-center text-emerald-600 dark:text-emerald-500" title="Partidos Ganados">G</th>
                    <th className="w-[50px] py-3 text-center text-rose-600 dark:text-rose-500" title="Partidos Perdidos">P</th>
                    <th className="w-[65px] py-3 text-center text-primary font-extrabold" title="Puntos">Pts</th>
                    <th className="w-[130px] py-3 pr-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {standings.map((row, idx) => {
                    const pos = idx + 1
                    const name = getParticipantName(row.participant)
                    const isAscenso = pos <= 2 && total >= 4
                    const isDescenso = pos > total - 2 && total >= 4

                    const rowBgClass = isAscenso
                      ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                      : isDescenso
                      ? 'bg-rose-500/5 hover:bg-rose-500/10'
                      : 'hover:bg-muted/30'

                    const borderLeftClass = isAscenso
                      ? 'border-l-4 border-l-emerald-500'
                      : isDescenso
                      ? 'border-l-4 border-l-rose-500'
                      : 'border-l-4 border-l-transparent'

                    const avatarBg = isAscenso
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : isDescenso
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                      : 'bg-primary/10 text-primary'

                    return (
                      <tr
                        key={row.participant.id}
                        className={`transition-colors duration-150 ${rowBgClass} ${borderLeftClass}`}
                      >
                        {/* Pos */}
                        <td className="py-3 text-center">
                          {pos === 1 ? (
                            <div className="flex justify-center">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                                <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                              </div>
                            </div>
                          ) : (
                            <span className={`text-xs font-bold ${isAscenso ? 'text-emerald-600 dark:text-emerald-500' : isDescenso ? 'text-rose-600 dark:text-rose-500' : 'text-muted-foreground'}`}>
                              {pos}
                            </span>
                          )}
                        </td>

                        {/* Participant */}
                        <td className="py-3 pl-3 pr-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${avatarBg}`}>
                              {getInitials(name)}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className={`font-semibold text-sm truncate ${row.participant.cancelado ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                                {name}
                              </span>
                              {row.participant.cancelado && <span className="text-[10px] font-medium text-destructive">Cancelado</span>}
                            </div>
                          </div>
                        </td>

                        {/* Stats */}
                        <td className="py-3.5 text-center text-sm text-muted-foreground font-medium">{row.played}</td>
                        <td className="py-3.5 text-center text-sm font-bold text-emerald-600 dark:text-emerald-500">{row.wins}</td>
                        <td className="py-3.5 text-center text-sm font-bold text-rose-600 dark:text-rose-500">{row.losses}</td>

                        {/* Pts */}
                        <td className="py-3.5 text-center">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-base shadow-sm mx-auto">
                            {row.points}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 pr-4 text-center">
                          {isAscenso ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shadow-sm">
                              <TrendingUp className="h-3.5 w-3.5" /> Posible ascenso
                            </div>
                          ) : isDescenso ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap shadow-sm">
                              <TrendingDown className="h-3.5 w-3.5" /> Posible descenso
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                              <Minus className="h-3 w-3" /> Zona media
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        {standings.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-muted/40 p-3.5 border border-border/50 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
                Posible ascenso (Top 2)
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
                Posible descenso (Últimos 2)
              </span>
            </div>
            <span className="tracking-wide">PJ = Jugados · G = Ganados · P = Perdidos · Pts = Puntos</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border/50">
        <Button
          variant="default"
          onClick={handlePdf}
          disabled={generating}
          className="gap-2 font-semibold shadow-md"
        >
          {generating
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
            : <><FileDown className="h-4 w-4" /> Generar PDF</>
          }
        </Button>
        <Button variant="outline" onClick={onClose} className="font-semibold">
          Cerrar
        </Button>
      </div>
    </Modal>
  )
}
