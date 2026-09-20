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

export function RoundRobinStandingsModal({ torneo, open, onClose }) {
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
      className="max-w-[95vw] w-[660px] bg-slate-950 text-slate-100 border-slate-800 p-4 sm:p-5"
    >
      {/* ── Capture area ── */}
      <div ref={contentRef} className="bg-slate-950 p-1">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {torneo.name}
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                Round Robin
              </Badge>
            </h2>
            <p className="text-xs text-slate-400">
              {torneo.formato} · {torneo.jugadores?.length || torneo.equipos?.length || 0} participantes
            </p>
          </div>
        </div>

        {/* Table */}

        <div className="rounded-xl overflow-hidden border border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-950">
          {standings.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-slate-400 text-sm">
              No se han registrado resultados aún.
            </div>
          ) : (
            <table className="w-full table-fixed text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800/60 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="w-[38px] py-2.5 text-center">#</th>
                  <th className="w-auto py-2.5 pl-3 text-left">Participante</th>
                  <th className="w-[48px] py-2.5 text-center">PJ</th>
                  <th className="w-[48px] py-2.5 text-center text-emerald-500">G</th>
                  <th className="w-[48px] py-2.5 text-center text-rose-500">P</th>
                  <th className="w-[58px] py-2.5 text-center text-emerald-400">Pts</th>
                  <th className="w-[130px] py-2.5 pr-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, idx) => {
                  const pos = idx + 1
                  const name = getParticipantName(row.participant)
                  const isAscenso = pos <= 2 && total >= 4
                  const isDescenso = pos > total - 2 && total >= 4

                  const rowBg = isAscenso
                    ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                    : isDescenso
                    ? 'bg-rose-500/10 border-l-2 border-rose-500'
                    : 'border-l-2 border-transparent'

                  const avatarClass = isAscenso
                    ? 'bg-emerald-400 text-slate-950'
                    : isDescenso
                    ? 'bg-rose-400 text-slate-950'
                    : 'bg-slate-700 text-slate-300'

                  return (
                    <tr
                      key={row.participant.id}
                      className={`border-b border-slate-800/40 last:border-0 hover:bg-white/[0.03] transition-colors ${rowBg}`}
                    >
                      {/* Pos */}
                      <td className="py-3 text-center">
                        {pos === 1 ? (
                          <Trophy className="mx-auto h-4 w-4 text-amber-400" />
                        ) : (
                          <span className={`text-xs font-bold ${isAscenso ? 'text-emerald-400' : isDescenso ? 'text-rose-400' : 'text-slate-500'}`}>
                            {pos}
                          </span>
                        )}
                      </td>

                      {/* Participant */}
                      <td className="py-3 pl-3 pr-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarClass}`}>
                            {getInitials(name)}
                          </span>
                          <span className={`font-medium truncate ${row.participant.cancelado ? 'line-through text-slate-500' : 'text-slate-100'}`}>{name}</span>
                          {row.participant.cancelado && <span className="text-[9px] text-rose-400">Fecha cancelada</span>}
                        </div>
                      </td>

                      <td className="py-3 text-center text-xs text-slate-400">{row.played}</td>
                      <td className="py-3 text-center text-xs font-semibold text-emerald-400">{row.wins}</td>
                      <td className="py-3 text-center text-xs font-semibold text-rose-400">{row.losses}</td>

                      {/* Pts */}
                      <td className="py-3 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-sm mx-auto">
                          {row.points}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 pr-3 text-center">
                        {isAscenso ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 whitespace-nowrap">
                            <TrendingUp className="h-3 w-3" /> Posible ascenso
                          </span>
                        ) : isDescenso ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-[10px] font-semibold text-rose-400 whitespace-nowrap">
                            <TrendingDown className="h-3 w-3" /> Posible descenso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                            <Minus className="h-3 w-3" /> Zona media
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
              Posible ascenso (Top 2)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />
              Posible descenso (Últimos 2)
            </span>
          </div>
          <span>PJ · G · P · Pts</span>
        </div>

      </div>{/* end capture area */}

      {/* Footer buttons */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePdf}
          disabled={generating}
          className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white gap-1.5"
        >
          {generating
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generando...</>
            : <><FileDown className="h-3.5 w-3.5" /> Generar PDF</>
          }
        </Button>
        <Button variant="outline" size="sm" onClick={onClose} className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white">
          Cerrar
        </Button>
      </div>
    </Modal>
  )
}
