import { apiClient } from './client'

export async function getMisEstadisticas(filters = {}) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined))
  const { data } = await apiClient.get('/statistics/me', { params })
  return data
}

export async function getStatisticsPlayers() {
  const { data } = await apiClient.get('/statistics/players')
  return Array.isArray(data) ? data : []
}

export async function getH2H(rivalId) {
  const { data } = await apiClient.get('/statistics/compare', { params: { rivalId } })
  return data
}
