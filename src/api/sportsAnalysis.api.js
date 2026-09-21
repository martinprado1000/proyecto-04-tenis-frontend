import { apiClient } from './client'

export async function getSportsAnalysisSessions(userId) {
  if (!userId) return { average: {}, overview: {}, sessions: [], chartData: [] }
  const { data } = await apiClient.get('/admin/analisis-deportivo', {
    params: { userId },
  })
  return data
}

export async function createSportsAnalysisSession(payload) {
  const { data } = await apiClient.post('/admin/analisis-deportivo', payload)
  return data
}

export async function updateSportsAnalysisSession(id, payload) {
  const { data } = await apiClient.patch(`/admin/analisis-deportivo/${id}`, payload)
  return data
}

export async function deleteSportsAnalysisSession(id, userId) {
  const { data } = await apiClient.delete(`/admin/analisis-deportivo/${id}`, { params: { userId } })
  return data
}

export async function getMySportsAnalysis() {
  const { data } = await apiClient.get('/analisis-deportivo/mio')
  return data
}
