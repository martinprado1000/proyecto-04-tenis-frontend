import { apiClient } from './client'

/** GET /api/resultados - resultados del jugador autenticado, agrupados por torneo */
export async function getResultados() {
  const { data } = await apiClient.get('/resultados')
  return Array.isArray(data) ? data : []
}

export async function getResultadoTorneo(tournamentId) {
  const { data } = await apiClient.get(`/resultados-torneo/${tournamentId}`)
  return data
}
