import { apiClient } from './client'

export async function getEquipos() {
  const { data } = await apiClient.get('/admin/equipos')
  return Array.isArray(data) ? data : []
}

export async function crearEquipo(payload) {
  const { data } = await apiClient.post('/admin/equipos', payload)
  return data
}

export async function updateEquipo(id, payload) {
  const { data } = await apiClient.patch(`/admin/equipos/${id}`, payload)
  return data
}

export async function eliminarEquipo(id) {
  await apiClient.delete(`/admin/equipos/${id}`)
  return true
}
