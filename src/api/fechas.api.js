import { apiClient } from './client'

/**
 * GET /api/fechas
 * Devuelve los próximos partidos del jugador logueado, separados por
 * torneo: { singles: [...], dobles: [...] }
 */
export async function getFechas() {
  const { data } = await apiClient.get('/fechas')
  return { singles: data?.singles || [], dobles: data?.dobles || [] }
}
