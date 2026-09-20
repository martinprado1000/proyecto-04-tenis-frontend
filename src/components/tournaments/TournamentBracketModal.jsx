import { useState, useMemo, useRef } from 'react'
import { Trophy, Crown, Sparkles, X, ZoomIn, ZoomOut, RotateCcw, LayoutGrid, GitBranch, Medal, FileDown, Loader2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useGeneratePdf } from '../../hooks/useGeneratePdf'

/**
 * Helper to determine winner and loser of a match
 */
export function getMatchResult(match) {
  if (!match || (match.jugado !== true && !match.resultado) || !Array.isArray(match.sets) || match.sets.length === 0) {
    return { winner: null, loser: null, p1Wins: 0, p2Wins: 0, isPlayed: false }
  }

  let p1Wins = 0
  let p2Wins = 0

  for (const s of match.sets) {
    const l = Number(s?.local)
    const v = Number(s?.visitante)
    if (!Number.isFinite(l) || !Number.isFinite(v)) continue
    if (l > v) p1Wins++
    else if (v > l) p2Wins++
  }

  const isPlayed = Boolean((match.jugado === true || match.resultado) && (p1Wins > 0 || p2Wins > 0))
  let winner = null
  let loser = null

  if (p1Wins > p2Wins) {
    winner = match.participante1
    loser = match.participante2
  } else if (p2Wins > p1Wins) {
    winner = match.participante2
    loser = match.participante1
  }

  return { winner, loser, p1Wins, p2Wins, isPlayed }
}

/**
 * Format participant display name
 */
export function getParticipantName(p) {
  if (!p) return null
  if (p.nombre || p.apellido) {
    const fullName = `${p.nombre || ''} ${p.apellido || ''}`.trim()
    return fullName || 'Jugador'
  }
  if (p.name) return p.name
  if (p.integrante1 || p.integrante2) {
    const n1 = p.integrante1 ? (p.integrante1.nombre || p.integrante1.name || '') : ''
    const n2 = p.integrante2 ? (p.integrante2.nombre || p.integrante2.name || '') : ''
    if (n1 && n2) return `${n1} / ${n2}`
    return n1 || n2 || 'Equipo'
  }
  return 'Participante'
}

/**
 * Get participant avatar/initials
 */
function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/**
 * MatchCard Component
 */
function MatchCard({ match, isFinal = false, isThirdPlace = false }) {
  const p1Name = getParticipantName(match?.participante1)
  const p2Name = getParticipantName(match?.participante2)
  const hasP1 = Boolean(match?.participante1 && match?.participante1.id)
  const hasP2 = Boolean(match?.participante2 && match?.participante2.id)
  const isReadyToPlay = hasP1 && hasP2

  const { winner, p1Wins, p2Wins, isPlayed } = getMatchResult(match)

  const isP1Winner = isPlayed && winner && match.participante1 && (winner.id === match.participante1.id)
  const isP2Winner = isPlayed && winner && match.participante2 && (winner.id === match.participante2.id)

  const cardBorderClass = isFinal
    ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-950 shadow-amber-950/20 shadow-lg'
    : isThirdPlace
    ? 'border-emerald-500/40 bg-slate-900/90'
    : 'border-border/80 bg-slate-900/80 hover:border-emerald-500/50'

  return (
    <div
      className={`group relative w-64 rounded-xl border p-3 shadow-md backdrop-blur-md transition-all duration-200 ${cardBorderClass} ${
        isReadyToPlay ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-emerald-950/30 hover:shadow-xl' : 'cursor-not-allowed opacity-80'
      }`}
    >
      {/* Header Badge */}
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span className="flex items-center gap-1">
          {isFinal ? (
            <span className="flex items-center gap-1 font-semibold text-amber-400">
              <Crown className="h-3.5 w-3.5 text-amber-400" /> FINAL
            </span>
          ) : isThirdPlace ? (
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <Medal className="h-3.5 w-3.5 text-emerald-400" /> 3er PUESTO
            </span>
          ) : (
            <span className="text-slate-400">Match #{match?.order !== undefined ? match.order + 1 : ''}</span>
          )}
        </span>

        {isPlayed ? (
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
            Jugado
          </span>
        ) : isReadyToPlay ? (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
            Pendiente
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Por definir
          </span>
        )}
      </div>

      {/* Participants Container */}
      <div className="space-y-1.5">
        {/* Participant 1 */}
        <div
          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
            isP1Winner
              ? 'bg-emerald-500/20 font-bold text-emerald-200 border-l-4 border-emerald-400'
              : hasP1
              ? 'bg-slate-800/60 text-slate-200'
              : 'bg-slate-800/20 text-slate-500 italic'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isP1Winner ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {hasP1 ? getInitials(p1Name) : '?'}
            </span>
            <span className={`truncate text-xs ${match?.participante1?.cancelado ? 'line-through text-slate-500' : ''}`}>{p1Name || 'Esperando rival...'}</span>
            {match?.participante1?.cancelado && <span className="ml-1 shrink-0 text-[9px] text-rose-400">Fecha cancelada</span>}
          </div>

          {/* Sets display */}
          <div className="flex items-center gap-1 shrink-0">
            {isPlayed && Array.isArray(match.sets) && match.sets.length > 0 ? (
              match.sets.map((s, idx) => (
                <span
                  key={idx}
                  className={`inline-block min-w-[16px] text-center text-xs font-mono font-bold ${
                    s.local > s.visitante ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {s.local}
                </span>
              ))
            ) : isP1Winner ? (
              <Crown className="h-3.5 w-3.5 text-emerald-400" />
            ) : null}
          </div>
        </div>

        {/* Participant 2 */}
        <div
          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
            isP2Winner
              ? 'bg-emerald-500/20 font-bold text-emerald-200 border-l-4 border-emerald-400'
              : hasP2
              ? 'bg-slate-800/60 text-slate-200'
              : 'bg-slate-800/20 text-slate-500 italic'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isP2Winner ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {hasP2 ? getInitials(p2Name) : '?'}
            </span>
            <span className={`truncate text-xs ${match?.participante2?.cancelado ? 'line-through text-slate-500' : ''}`}>{p2Name || 'Esperando rival...'}</span>
            {match?.participante2?.cancelado && <span className="ml-1 shrink-0 text-[9px] text-rose-400">Fecha cancelada</span>}
          </div>

          {/* Sets display */}
          <div className="flex items-center gap-1 shrink-0">
            {isPlayed && Array.isArray(match.sets) && match.sets.length > 0 ? (
              match.sets.map((s, idx) => (
                <span
                  key={idx}
                  className={`inline-block min-w-[16px] text-center text-xs font-mono font-bold ${
                    s.visitante > s.local ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {s.visitante}
                </span>
              ))
            ) : isP2Winner ? (
              <Crown className="h-3.5 w-3.5 text-emerald-400" />
            ) : null}
          </div>
        </div>
      </div>


    </div>
  )
}

/**
 * Round title renderer
 */
function getRoundTitle(roundNumber, maxRound) {
  if (roundNumber === maxRound) return 'Final'
  if (roundNumber === maxRound - 1) return 'Semifinales'
  if (roundNumber === maxRound - 2) return 'Cuartos de final'
  if (roundNumber === maxRound - 3) return 'Octavos de final'
  return `Ronda ${roundNumber}`
}

export function TournamentBracketModal({ torneo, open, onClose }) {
  const [viewMode, setViewMode] = useState('bilateral')
  const [zoomLevel, setZoomLevel] = useState(1)
  const contentRef = useRef(null)
  const { generating, generatePdf } = useGeneratePdf()

  function handlePdf() {
    const name = torneo?.name?.replace(/\s+/g, '_') || 'torneo'
    generatePdf(contentRef, `llave_${name}.pdf`)
  }

  // Compute bracket layout structure
  const bracketData = useMemo(() => {
    if (!torneo || !Array.isArray(torneo.fechas) || torneo.fechas.length === 0) {
      return null
    }

    const fechas = torneo.fechas
    let maxRound = 1
    const roundsMap = new Map()
    let thirdPlaceMatch = null

    fechas.forEach((f) => {
      if (f.thirdPlace) {
        thirdPlaceMatch = f
        return
      }
      const r = f.round || 1
      maxRound = Math.max(maxRound, r)
      if (!roundsMap.has(r)) roundsMap.set(r, [])
      roundsMap.get(r).push(f)
    })

    // Sort matches in each round by order
    for (let [r, matches] of roundsMap.entries()) {
      matches.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }

    const finalMatch = roundsMap.get(maxRound)?.[0] || null

    // Determine Champion if final is played
    let champion = null
    if (finalMatch) {
      const { winner } = getMatchResult(finalMatch)
      if (winner) champion = winner
    }

    // Determine 3rd place winner if played
    let thirdPlaceWinner = null
    if (thirdPlaceMatch) {
      const { winner } = getMatchResult(thirdPlaceMatch)
      if (winner) thirdPlaceWinner = winner
    }

    // Prepare Bilateral branches (Rounds 1 to maxRound - 1)
    const bilateralRounds = []
    for (let r = 1; r < maxRound; r++) {
      const matches = roundsMap.get(r) || []
      const mid = Math.ceil(matches.length / 2)
      const leftMatches = matches.slice(0, mid)
      const rightMatches = matches.slice(mid)
      bilateralRounds.push({
        round: r,
        title: getRoundTitle(r, maxRound),
        leftMatches,
        rightMatches,
      })
    }

    // Linear rounds (All rounds 1 to maxRound)
    const linearRounds = []
    for (let r = 1; r <= maxRound; r++) {
      linearRounds.push({
        round: r,
        title: getRoundTitle(r, maxRound),
        matches: roundsMap.get(r) || [],
      })
    }

    return {
      maxRound,
      finalMatch,
      thirdPlaceMatch,
      champion,
      thirdPlaceWinner,
      bilateralRounds,
      linearRounds,
      fechas,
    }
  }, [torneo])

  if (!open || !torneo) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      className="max-w-[95vw] w-[1400px] bg-slate-950 text-slate-100 border-slate-800 p-4 sm:p-6"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {torneo.name}
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                Playoffs
              </Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Formato: {torneo.formato} · {torneo.jugadores?.length || torneo.equipos?.length || 0} Participantes
            </p>
          </div>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('bilateral')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'bilateral'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" /> Vista Copa (Simétrica)
            </button>
            <button
              onClick={() => setViewMode('linear')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'linear'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Vista Árbol (Lineal)
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-white border-l border-slate-800"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Bracket Canvas Container */}
      <div ref={contentRef} className="relative mt-4 min-h-[500px] overflow-x-auto rounded-2xl bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 p-6 court-lines border border-slate-800/60 scrollbar-thin">
        {!bracketData ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            No se han generado partidos para este torneo de Playoffs aún.
          </div>
        ) : (
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 flex flex-col items-center"
          >
            {/* Champion Celebration Banner if match complete */}
            {bracketData.champion && (
              <div className="mb-6 flex flex-col items-center justify-center animate-fade-in">
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 blur-xl animate-pulse" />
                  <div className="relative flex items-center gap-3 rounded-2xl border border-amber-500/50 bg-slate-900/90 px-6 py-3 shadow-2xl backdrop-blur-xl">
                    <Trophy className="h-8 w-8 text-amber-400 animate-bounce" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> CAMPEÓN DEL TORNEO
                      </span>
                      <h3 className="text-lg font-black text-white">{getParticipantName(bracketData.champion)}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BILATERAL VIEW (SYMMETRIC CUP STYLE) */}
            {viewMode === 'bilateral' && (
              <div className="flex items-center justify-center gap-8 py-4">
                {/* LEFT BRANCH (Rounds 1 -> Semis) */}
                <div className="flex items-center gap-8">
                  {bracketData.bilateralRounds.map(({ round, title, leftMatches }) => (
                    <div key={`left-${round}`} className="flex flex-col items-center gap-3">
                      <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                        {title}
                      </span>
                      <div className="flex flex-col justify-around gap-6 py-2">
                        {leftMatches.map((m) => (
                          <MatchCard
                            key={m.id}
                            match={m}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CENTER COLUMN (Trophy + Final + 3rd Place) */}
                <div className="flex flex-col items-center justify-center gap-6 px-4 py-2 border-x border-slate-800/80">
                  {/* Winner Trophy Header Icon */}
                  <div className="flex flex-col items-center gap-1 text-amber-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-700/10 border border-amber-500/40 shadow-lg shadow-amber-950/40">
                      <Crown className="h-9 w-9 text-amber-400" />
                    </div>
                    <span className="text-xs font-black tracking-widest text-amber-400 uppercase">WINNER</span>
                  </div>

                  {/* FINAL Match Card */}
                  {bracketData.finalMatch && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="rounded-full bg-amber-500/20 px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 shadow-sm">
                        GRAN FINAL
                      </span>
                      <MatchCard
                        match={bracketData.finalMatch}
                        isFinal={true}
                      />
                    </div>
                  )}

                  {/* 3rd Place Match Card */}
                  {bracketData.thirdPlaceMatch && (
                    <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-800/60">
                      <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                        DEFINICIÓN 3° PUESTO
                      </span>
                      <MatchCard
                        match={bracketData.thirdPlaceMatch}
                        isThirdPlace={true}
                      />
                    </div>
                  )}
                </div>

                {/* RIGHT BRANCH (Semis <- Rounds 1 reversed for symmetry) */}
                <div className="flex items-center gap-8">
                  {[...bracketData.bilateralRounds].reverse().map(({ round, title, rightMatches }) => (
                    <div key={`right-${round}`} className="flex flex-col items-center gap-3">
                      <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                        {title}
                      </span>
                      <div className="flex flex-col justify-around gap-6 py-2">
                        {rightMatches.map((m) => (
                          <MatchCard
                            key={m.id}
                            match={m}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LINEAR VIEW (HORIZONTAL TREE) */}
            {viewMode === 'linear' && (
              <div className="flex items-start gap-8 py-4 overflow-x-auto">
                {bracketData.linearRounds.map(({ round, title, matches }) => (
                  <div key={`linear-${round}`} className="flex flex-col items-center gap-4">
                    <span className="rounded-full bg-slate-900/90 px-4 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                      {title}
                    </span>
                    <div className="flex flex-col gap-6">
                      {matches.map((m) => {
                        const idx = torneo.fechas.findIndex((x) => x.id === m.id)
                        return (
                          <MatchCard
                            key={m.id}
                            match={m}
                            isFinal={round === bracketData.maxRound && !m.thirdPlace}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Third Place Match Column in Linear View if present */}
                {bracketData.thirdPlaceMatch && (
                  <div className="flex flex-col items-center gap-4 border-l border-slate-800 pl-6">
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                      3° Puesto
                    </span>
                    <MatchCard
                      match={bracketData.thirdPlaceMatch}
                      isThirdPlace={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="text-slate-500">Los resultados se cargan desde la tabla de fechas.</span>
        <div className="flex items-center gap-2">
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
      </div>
    </Modal>
  )
}
