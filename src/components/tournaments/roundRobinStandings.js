import { getParticipantName } from './TournamentBracketModal'

function normalizeParticipant(participant) {
  if (!participant) return null
  if (typeof participant === 'string') return { id: participant }
  const id = String(participant.id ?? participant._id ?? participant.userId ?? '')
  return id ? { ...participant, id } : null
}

function getSetStats(match) {
  let p1Sets = 0
  let p2Sets = 0
  let totalSets = 0

  for (const set of match.sets || []) {
    const local = Number(set?.local)
    const visitor = Number(set?.visitante)
    if (!Number.isFinite(local) || !Number.isFinite(visitor) || local === visitor) continue
    totalSets += 1
    if (local > visitor) p1Sets += 1
    else p2Sets += 1
  }

  return { p1Sets, p2Sets, totalSets }
}

export function computeRoundRobinStandings(tournament) {
  if (!tournament || !Array.isArray(tournament.fechas)) return []

  const standings = new Map()
  const ensure = (participant) => {
    const normalized = normalizeParticipant(participant)
    if (!normalized) return normalized
    if (!standings.has(normalized.id)) {
      standings.set(normalized.id, {
        participant: normalized,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        setsWon: 0,
        setsTotal: 0,
        setPercentage: 0,
      })
    }
    return normalized
  }

  for (const participant of tournament.jugadores || tournament.equipos || []) ensure(participant)

  for (const fixture of tournament.fechas) {
    const participant1 = ensure(fixture.participante1 || fixture.jugador1 || fixture.equipo1)
    const participant2 = ensure(fixture.participante2 || fixture.jugador2 || fixture.equipo2)
    if (!participant1 || !participant2 || fixture.bye) continue

    const setStats = getSetStats(fixture)
    const isPlayed = fixture.jugado === true || Boolean(fixture.resultado)
    if (!isPlayed || setStats.p1Sets === setStats.p2Sets || setStats.totalSets === 0) continue

    const first = standings.get(participant1.id)
    const second = standings.get(participant2.id)
    first.played += 1
    second.played += 1
    first.setsWon += setStats.p1Sets
    second.setsWon += setStats.p2Sets
    first.setsTotal += setStats.totalSets
    second.setsTotal += setStats.totalSets

    if (setStats.p1Sets > setStats.p2Sets) {
      first.wins += 1
      first.points += 1
      second.losses += 1
    } else {
      second.wins += 1
      second.points += 1
      first.losses += 1
    }
  }

  for (const row of standings.values()) {
    row.setPercentage = row.setsTotal ? (row.setsWon / row.setsTotal) * 100 : 0
  }

  return [...standings.values()].sort((first, second) => {
    if (second.points !== first.points) return second.points - first.points
    if (second.setPercentage !== first.setPercentage) return second.setPercentage - first.setPercentage
    if (second.wins !== first.wins) return second.wins - first.wins
    return getParticipantName(first.participant).localeCompare(getParticipantName(second.participant))
  })
}

export function formatSetPercentage(value) {
  return `${Number(value || 0).toFixed(1)}%`
}
