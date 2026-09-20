import { useState, useMemo, useRef, useEffect } from 'react'
import { Trophy, Crown, Sparkles, ZoomIn, ZoomOut, RotateCcw, LayoutGrid, GitBranch, Medal, FileDown, Loader2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useGeneratePdf } from '../../hooks/useGeneratePdf'
import { useTenant } from '../../hooks/useTenant'
import { getOrganizationBySlug } from '../../api/organizations.api'
import { getMatchResult, getParticipantName } from './TournamentBracketModal'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function MatchCard2({ match, isFinal = false, isThirdPlace = false }) {
  const p1Name = getParticipantName(match?.participante1)
  const p2Name = getParticipantName(match?.participante2)
  const hasP1 = Boolean(match?.participante1 && match?.participante1.id)
  const hasP2 = Boolean(match?.participante2 && match?.participante2.id)
  const isReadyToPlay = hasP1 && hasP2

  const { winner, p1Wins, p2Wins, isPlayed } = getMatchResult(match)

  const isP1Winner = isPlayed && winner && match.participante1 && (winner.id === match.participante1.id)
  const isP2Winner = isPlayed && winner && match.participante2 && (winner.id === match.participante2.id)

  const cardBorderClass = isFinal
    ? 'border-amber-400/60 bg-gradient-to-b from-amber-500/5 to-background shadow-lg shadow-amber-500/10'
    : isThirdPlace
    ? 'border-emerald-400/50 bg-gradient-to-b from-emerald-500/5 to-background'
    : 'border-border/60 bg-card hover:border-primary/50'

  return (
    <div
      className={`group relative w-48 rounded-xl border p-2 shadow-sm transition-all duration-200 ${cardBorderClass} ${
        isReadyToPlay ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : 'cursor-not-allowed opacity-80'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between text-[9px] font-semibold tracking-wide uppercase">
        <span className="flex items-center gap-1 text-muted-foreground">
          {isFinal ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-bold">
              <Crown className="h-3 w-3" /> FINAL
            </span>
          ) : isThirdPlace ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-bold">
              <Medal className="h-3 w-3" /> 3er PUESTO
            </span>
          ) : (
            `Match #${match?.order !== undefined ? match.order + 1 : ''}`
          )}
        </span>

        {isPlayed ? (
          <span className="text-emerald-600 dark:text-emerald-400">Jugado</span>
        ) : isReadyToPlay ? (
          <span className="text-amber-600 dark:text-amber-500">Pendiente</span>
        ) : (
          <span className="text-muted-foreground">Por definir</span>
        )}
      </div>

      <div className="space-y-1">
        <div
          className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
            isP1Winner
              ? 'bg-primary/10 font-bold text-primary border-l-2 border-primary'
              : hasP1
              ? 'bg-muted/50 text-foreground'
              : 'bg-muted/30 text-muted-foreground italic'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden pr-1">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
                isP1Winner ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
              }`}
            >
              {hasP1 ? getInitials(p1Name) : '?'}
            </span>
            <span className={`truncate text-[11px] ${match?.participante1?.cancelado ? 'line-through opacity-70' : ''}`}>{p1Name || 'Esperando...'}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {isPlayed && Array.isArray(match.sets) && match.sets.length > 0 ? (
              match.sets.map((s, idx) => (
                <span
                  key={idx}
                  className={`inline-block min-w-[12px] text-center text-[10px] font-mono ${
                    s.local > s.visitante ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {s.local}
                </span>
              ))
            ) : isP1Winner ? (
              <Crown className="h-3 w-3 text-primary" />
            ) : null}
          </div>
        </div>

        <div
          className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
            isP2Winner
              ? 'bg-primary/10 font-bold text-primary border-l-2 border-primary'
              : hasP2
              ? 'bg-muted/50 text-foreground'
              : 'bg-muted/30 text-muted-foreground italic'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden pr-1">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
                isP2Winner ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
              }`}
            >
              {hasP2 ? getInitials(p2Name) : '?'}
            </span>
            <span className={`truncate text-[11px] ${match?.participante2?.cancelado ? 'line-through opacity-70' : ''}`}>{p2Name || 'Esperando...'}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {isPlayed && Array.isArray(match.sets) && match.sets.length > 0 ? (
              match.sets.map((s, idx) => (
                <span
                  key={idx}
                  className={`inline-block min-w-[12px] text-center text-[10px] font-mono ${
                    s.visitante > s.local ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {s.visitante}
                </span>
              ))
            ) : isP2Winner ? (
              <Crown className="h-3 w-3 text-primary" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function getRoundTitle(roundNumber, maxRound) {
  if (roundNumber === maxRound) return 'Final'
  if (roundNumber === maxRound - 1) return 'Semifinales'
  if (roundNumber === maxRound - 2) return 'Cuartos'
  if (roundNumber === maxRound - 3) return 'Octavos'
  return `Ronda ${roundNumber}`
}

export function TournamentBracketModal2({ torneo, open, onClose }) {
  const [viewMode, setViewMode] = useState('bilateral')
  const [zoomLevel, setZoomLevel] = useState(1)
  const contentRef = useRef(null)
  const { generating, generatePdf } = useGeneratePdf()
  const { tenantSlug } = useTenant()
  const [organization, setOrganization] = useState(null)

  useEffect(() => {
    if (tenantSlug) {
      getOrganizationBySlug(tenantSlug).then(setOrganization).catch(() => {})
    }
  }, [tenantSlug])

  function handlePdf() {
    const name = torneo?.name?.replace(/\s+/g, '_') || 'torneo'
    generatePdf(contentRef, `llave_${name}.pdf`)
  }

  const bracketData = useMemo(() => {
    if (!torneo || !Array.isArray(torneo.fechas) || torneo.fechas.length === 0) return null

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

    for (let [r, matches] of roundsMap.entries()) {
      matches.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }

    const finalMatch = roundsMap.get(maxRound)?.[0] || null

    let champion = null
    if (finalMatch) {
      const { winner } = getMatchResult(finalMatch)
      if (winner) champion = winner
    }

    let thirdPlaceWinner = null
    if (thirdPlaceMatch) {
      const { winner } = getMatchResult(thirdPlaceMatch)
      if (winner) thirdPlaceWinner = winner
    }

    const bilateralRounds = []
    for (let r = 1; r < maxRound; r++) {
      const matches = roundsMap.get(r) || []
      const mid = Math.ceil(matches.length / 2)
      const leftMatches = matches.slice(0, mid)
      const rightMatches = matches.slice(mid)
      bilateralRounds.push({ round: r, title: getRoundTitle(r, maxRound), leftMatches, rightMatches })
    }

    const linearRounds = []
    for (let r = 1; r <= maxRound; r++) {
      linearRounds.push({ round: r, title: getRoundTitle(r, maxRound), matches: roundsMap.get(r) || [] })
    }

    return { maxRound, finalMatch, thirdPlaceMatch, champion, thirdPlaceWinner, bilateralRounds, linearRounds, fechas }
  }, [torneo])

  if (!open || !torneo) return null

  // Styles for connector lines using pseudo elements in the DOM
  const connectorStyles = `
    .connect-right { position: relative; }
    .connect-right::after {
      content: ""; position: absolute; right: -24px; top: 25%; bottom: 25%; width: 24px;
      border-right: 2px solid hsl(var(--primary) / 0.4);
      border-top: 2px solid hsl(var(--primary) / 0.4);
      border-bottom: 2px solid hsl(var(--primary) / 0.4);
      border-radius: 0 8px 8px 0;
      z-index: 0;
    }
    .connect-right > div { position: relative; z-index: 1; }
    
    .connect-left { position: relative; }
    .connect-left::after {
      content: ""; position: absolute; left: -24px; top: 25%; bottom: 25%; width: 24px;
      border-left: 2px solid hsl(var(--primary) / 0.4);
      border-top: 2px solid hsl(var(--primary) / 0.4);
      border-bottom: 2px solid hsl(var(--primary) / 0.4);
      border-radius: 8px 0 0 8px;
      z-index: 0;
    }
    .connect-left > div { position: relative; z-index: 1; }
    
    /* Horizontal lines pointing to the next round for odd matches */
    .connect-line-right { position: relative; }
    .connect-line-right::before {
      content: ""; position: absolute; right: -24px; top: 50%; width: 24px;
      border-top: 2px solid hsl(var(--primary) / 0.4);
      z-index: 0;
    }
    .connect-line-left { position: relative; }
    .connect-line-left::before {
      content: ""; position: absolute; left: -24px; top: 50%; width: 24px;
      border-top: 2px solid hsl(var(--primary) / 0.4);
      z-index: 0;
    }
  `;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      className="max-w-[95vw] w-[1300px] bg-background text-foreground border-border p-4 sm:p-5 rounded-2xl shadow-2xl"
    >
      <style>{connectorStyles}</style>
      
      <div className="flex flex-col gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-3">
          {organization?.logoUrl ? (
            <img src={organization.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-cover shadow-sm border border-border/50 bg-card" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Trophy className="h-6 w-6" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {torneo.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-2 py-0 text-[10px] uppercase font-bold">
                Playoffs
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {torneo.formato} · {torneo.jugadores?.length || torneo.equipos?.length || 0} Participantes
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-muted p-1 border border-border/60 shadow-sm">
            <button
              onClick={() => setViewMode('bilateral')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'bilateral'
                  ? 'bg-background text-foreground shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" /> Vista Copa
            </button>
            <button
              onClick={() => setViewMode('linear')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'linear'
                  ? 'bg-background text-foreground shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Vista Árbol
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-muted border border-border/60 shadow-sm">
            <button onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomOut className="h-4 w-4" /></button>
            <span className="px-1 text-[10px] font-mono font-medium text-muted-foreground w-9 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={() => setZoomLevel(1)} className="p-1.5 text-muted-foreground hover:text-foreground border-l border-border/60"><RotateCcw className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="relative min-h-[400px] overflow-x-auto rounded-xl bg-card/50 p-4 border border-border/40 scrollbar-thin">
        {!bracketData ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground text-sm font-medium">
            No se han generado partidos para este torneo aún.
          </div>
        ) : (
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 flex flex-col items-center min-w-max"
          >
            {bracketData.champion && (
              <div className="mb-4 animate-fade-in">
                <div className="relative flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/5 px-6 py-2.5 shadow-sm">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> CAMPEÓN
                    </span>
                    <h3 className="text-base font-bold text-foreground">{getParticipantName(bracketData.champion)}</h3>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'bilateral' && (
              <div className="flex items-stretch justify-center gap-12 py-2">
                {/* LEFT BRANCH */}
                <div className="flex items-stretch gap-12">
                  {bracketData.bilateralRounds.map(({ round, title, leftMatches }, rIdx) => (
                    <div key={`left-${round}`} className="flex flex-col items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                        {title}
                      </span>
                      <div className="flex flex-col justify-around gap-4 py-2 h-full">
                        {/* Group matches in pairs for drawing connecting lines */}
                        {Array.from({ length: Math.ceil(leftMatches.length / 2) }).map((_, pairIdx) => {
                          const m1 = leftMatches[pairIdx * 2];
                          const m2 = leftMatches[pairIdx * 2 + 1];
                          const isLastRound = rIdx === bracketData.bilateralRounds.length - 1;
                          
                          // If there's only one match in the pair, it just gets a straight line
                          if (!m2) {
                            return (
                              <div key={m1.id} className={`flex flex-col justify-center h-full ${!isLastRound ? 'connect-line-right' : ''}`}>
                                <MatchCard2 match={m1} />
                              </div>
                            );
                          }
                          
                          return (
                            <div key={`${m1.id}-${m2.id}`} className={`flex flex-col justify-between gap-6 h-full py-4 ${!isLastRound ? 'connect-right' : ''}`}>
                              <MatchCard2 match={m1} />
                              <MatchCard2 match={m2} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CENTER COLUMN (Finals) */}
                <div className="flex flex-col items-center justify-center gap-8 px-6 py-2">
                  {bracketData.finalMatch && (
                    <div className="flex flex-col items-center gap-2 relative connect-line-left connect-line-right">
                      {/* The final match has lines coming from both left and right */}
                      <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40">
                        GRAN FINAL
                      </span>
                      <MatchCard2 match={bracketData.finalMatch} isFinal={true} />
                    </div>
                  )}
                  {bracketData.thirdPlaceMatch && (
                    <div className="flex flex-col items-center gap-2 pt-6 border-t border-border/50">
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                        3° PUESTO
                      </span>
                      <MatchCard2 match={bracketData.thirdPlaceMatch} isThirdPlace={true} />
                    </div>
                  )}
                </div>

                {/* RIGHT BRANCH */}
                <div className="flex items-stretch gap-12">
                  {[...bracketData.bilateralRounds].reverse().map(({ round, title, rightMatches }, rIdx) => (
                    <div key={`right-${round}`} className="flex flex-col items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                        {title}
                      </span>
                      <div className="flex flex-col justify-around gap-4 py-2 h-full">
                        {Array.from({ length: Math.ceil(rightMatches.length / 2) }).map((_, pairIdx) => {
                          const m1 = rightMatches[pairIdx * 2];
                          const m2 = rightMatches[pairIdx * 2 + 1];
                          const isFirstDisplayedRound = rIdx === 0;
                          
                          if (!m2) {
                            return (
                              <div key={m1.id} className={`flex flex-col justify-center h-full ${!isFirstDisplayedRound ? 'connect-line-left' : ''}`}>
                                <MatchCard2 match={m1} />
                              </div>
                            );
                          }
                          
                          return (
                            <div key={`${m1.id}-${m2.id}`} className={`flex flex-col justify-between gap-6 h-full py-4 ${!isFirstDisplayedRound ? 'connect-left' : ''}`}>
                              <MatchCard2 match={m1} />
                              <MatchCard2 match={m2} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'linear' && (
              <div className="flex items-stretch gap-10 py-2">
                {bracketData.linearRounds.map(({ round, title, matches }, rIdx) => (
                  <div key={`linear-${round}`} className="flex flex-col items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                      {title}
                    </span>
                    <div className="flex flex-col justify-around gap-4 h-full">
                      {Array.from({ length: Math.ceil(matches.length / 2) }).map((_, pairIdx) => {
                         const m1 = matches[pairIdx * 2];
                         const m2 = matches[pairIdx * 2 + 1];
                         const isLastRound = rIdx === bracketData.linearRounds.length - 1;
                         
                         if (!m2 || isLastRound) {
                           return (
                             <div key={m1.id} className={`flex flex-col justify-center h-full ${!isLastRound ? 'connect-line-right' : ''}`}>
                               <MatchCard2 match={m1} isFinal={isLastRound && !m1.thirdPlace} />
                             </div>
                           );
                         }
                         
                         return (
                           <div key={`${m1.id}-${m2.id}`} className={`flex flex-col justify-between gap-6 h-full py-4 connect-right`}>
                             <MatchCard2 match={m1} />
                             <MatchCard2 match={m2} />
                           </div>
                         );
                      })}
                    </div>
                  </div>
                ))}
                {bracketData.thirdPlaceMatch && (
                  <div className="flex flex-col items-center gap-3 border-l border-border/60 pl-8 ml-2">
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                      3° PUESTO
                    </span>
                    <div className="flex items-center h-full">
                      <MatchCard2 match={bracketData.thirdPlaceMatch} isThirdPlace={true} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
        <Button variant="default" size="sm" onClick={handlePdf} disabled={generating} className="gap-2 font-semibold">
          {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</> : <><FileDown className="h-4 w-4" /> Generar PDF</>}
        </Button>
        <Button variant="outline" size="sm" onClick={onClose} className="font-semibold">
          Cerrar
        </Button>
      </div>
    </Modal>
  )
}
