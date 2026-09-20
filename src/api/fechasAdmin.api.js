import { apiClient } from './client'
import { MOCK_FECHAS_SINGLE, MOCK_FECHAS_DOBLES, MOCK_USUARIOS, MOCK_EQUIPOS } from '../mock/mockData'

const USE_MOCK = true
let mockSingleDb = [...MOCK_FECHAS_SINGLE]
let mockDoblesDb = [...MOCK_FECHAS_DOBLES]

// ---------------------------------------------------------------------------
// SINGLES — /api/admin/fechas/single
// ---------------------------------------------------------------------------

/** GET /api/admin/fechas/single */
export async function getFechasSingle() {
  if (USE_MOCK) {
    await delay(400)
    return mockSingleDb
  }
  const { data } = await apiClient.get('/admin/fechas/single')
  return data
}

/**
 * POST /api/admin/fechas/single/generar
 * Dispara la generación automática de fixture en el backend (round-robin,
 * eliminación directa, etc.) y devuelve el listado ya actualizado.
 */
export async function generarFechasSingleAuto() {
  if (USE_MOCK) {
    await delay(900)
    return mockSingleDb
  }
  const { data } = await apiClient.post('/admin/fechas/single/generar')
  return data
}

/** POST /api/admin/fechas/single */
export async function crearFechaSingle(payload) {
  if (USE_MOCK) {
    await delay(600)
    const nuevo = { id: `sg-${Date.now()}`, estado: 'Pendiente', resultado: '-', ...payload }
    mockSingleDb = [nuevo, ...mockSingleDb]
    return nuevo
  }
  const { data } = await apiClient.post('/admin/fechas/single', payload)
  return data
}

/** PUT /api/admin/fechas/single/:id */
export async function updateFechaSingle(id, payload) {
  if (USE_MOCK) {
    await delay(600)
    mockSingleDb = mockSingleDb.map((p) => (p.id === id ? { ...p, ...payload, id } : p))
    return { id, ...payload }
  }
  const { data } = await apiClient.put(`/admin/fechas/single/${id}`, payload)
  return data
}

// ---------------------------------------------------------------------------
// DOBLES — /api/admin/fechas/dobles
// ---------------------------------------------------------------------------

/** GET /api/admin/fechas/dobles */
export async function getFechasDobles() {
  if (USE_MOCK) {
    await delay(400)
    return mockDoblesDb
  }
  const { data } = await apiClient.get('/admin/fechas/dobles')
  return data
}

/** POST /api/admin/fechas/dobles/generar */
export async function generarFechasDoblesAuto() {
  if (USE_MOCK) {
    await delay(900)
    return mockDoblesDb
  }
  const { data } = await apiClient.post('/admin/fechas/dobles/generar')
  return data
}

/** POST /api/admin/fechas/dobles */
export async function crearFechaDobles(payload) {
  if (USE_MOCK) {
    await delay(600)
    const nuevo = { id: `db-${Date.now()}`, estado: 'Pendiente', resultado: '-', ...payload }
    mockDoblesDb = [nuevo, ...mockDoblesDb]
    return nuevo
  }
  const { data } = await apiClient.post('/admin/fechas/dobles', payload)
  return data
}

/** PUT /api/admin/fechas/dobles/:id */
export async function updateFechaDobles(id, payload) {
  if (USE_MOCK) {
    await delay(600)
    mockDoblesDb = mockDoblesDb.map((p) => (p.id === id ? { ...p, ...payload, id } : p))
    return { id, ...payload }
  }
  const { data } = await apiClient.put(`/admin/fechas/dobles/${id}`, payload)
  return data
}

// Helpers para poblar los <select> de jugadores/equipos en los formularios.
export async function getJugadoresDisponibles() {
  await delay(200)
  return MOCK_USUARIOS.filter(u => u.activo !== false).map((u) => ({ id: u.id, nombre: `${u.nombre} ${u.apellido}` }))
}

export async function getEquiposDisponibles() {
  await delay(200)
  return MOCK_EQUIPOS
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
