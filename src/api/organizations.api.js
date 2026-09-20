import { apiClient } from './client'

/** GET /super-admin/organizations */
export async function getOrganizations() {
  const { data } = await apiClient.get('/super-admin/organizations')
  return Array.isArray(data) ? data : []
}

/** GET /organizations/:slug */
export async function getOrganizationBySlug(slug) {
  const { data } = await apiClient.get(`/super-admin/organizations/public/${encodeURIComponent(slug)}`)
  return data
}

/** POST /super-admin/organizations */
export async function createOrganization(payload) {
  const { data } = await apiClient.post('/super-admin/organizations', payload)
  return data
}

export async function updateOrganization(id, payload) {
  const { data } = await apiClient.patch(`/super-admin/organizations/${id}`, payload)
  return data
}

export async function deleteOrganization(id) {
  await apiClient.delete(`/super-admin/organizations/${id}`)
}

export async function getSystemBranding() {
  const { data } = await apiClient.get('/system-branding')
  return data
}

export async function updateSystemBranding(payload) {
  const { data } = await apiClient.patch('/system-branding', payload)
  return data
}
