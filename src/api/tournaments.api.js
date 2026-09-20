import { apiClient } from './client'

export const FORMATOS_TORNEO = [
  'RoundRobin Single Masculino',
  'RoundRobin Dobles Masculino',
  'RoundRobin Single Femenino',
  'RoundRobin Dobles Femenino',
  'RoundRobin Dobles Mixto',
  'Playoffs Single Masculino',
  'Playoffs Dobles Masculino',
  'Playoffs Single Femenino',
  'Playoffs Dobles Femenino',
  'Playoffs Dobles Mixto',
]

export async function getTorneos() {
  const { data } = await apiClient.get('/admin/torneos')
  return Array.isArray(data) ? data : []
}

export async function crearTorneo(payload) {
  const { data } = await apiClient.post('/admin/torneos', payload)
  return data
}

export async function updateTorneo(id, payload) {
  const { data } = await apiClient.patch(`/admin/torneos/${id}`, payload)
  return data
}

export async function asignarJugadoresATorneo(id, jugadoresIds, modo, reemplazarId, nuevoId) {
  const { data } = await apiClient.patch(`/admin/torneos/${id}/jugadores`, {
    jugadores: jugadoresIds,
    ...(modo ? { modo } : {}),
    ...(reemplazarId ? { reemplazarId } : {}),
    ...(nuevoId ? { nuevoId } : {}),
  })
  return data
}

export async function asignarEquiposATorneo(id, equiposIds, modo, reemplazarId, nuevoId) {
  const { data } = await apiClient.patch(`/admin/torneos/${id}/equipos`, {
    equipos: equiposIds,
    ...(modo ? { modo } : {}),
    ...(reemplazarId ? { reemplazarId } : {}),
    ...(nuevoId ? { nuevoId } : {}),
  })
  return data
}

export async function eliminarTorneo(id) {
  await apiClient.delete(`/admin/torneos/${id}`)
  return true
}

export async function generarFechasTorneo(id) {
  const { data } = await apiClient.post(`/admin/torneos/${id}/fechas/generar`)
  return data
}

export async function updateFechaTorneo(tournamentId, fechaIdx, payload) {
  const { data } = await apiClient.patch(`/admin/torneos/${tournamentId}/fechas/${fechaIdx}`, payload)
  return data
}
