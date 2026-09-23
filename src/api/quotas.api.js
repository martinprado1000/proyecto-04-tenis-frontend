import { apiClient } from './client'

export async function getQuotasMatrix(year) {
  const { data } = await apiClient.get('/admin/gestion-cuotas', { params: { year } })
  return data
}

export async function createQuota(payload) {
  const { data } = await apiClient.post('/admin/gestion-cuotas', payload)
  return data
}

export async function updateQuota(id, payload) {
  const { data } = await apiClient.patch(`/admin/gestion-cuotas/${id}`, payload)
  return data
}

export async function deleteQuota(id) {
  await apiClient.delete(`/admin/gestion-cuotas/${id}`)
}
