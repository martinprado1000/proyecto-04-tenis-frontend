import { apiClient } from './client'
import { MOCK_USUARIOS } from '../mock/mockData'

const USE_MOCK = false
let mockUsuariosDb = [...MOCK_USUARIOS]

const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN', 'OPERATOR']

function mapBackendUser(data) {
  const roles = Array.isArray(data.roles) ? data.roles : [data.roles].filter(Boolean)
  const isAdmin = roles.some((r) => ADMIN_ROLES.includes(String(r).toUpperCase()))

  const formattedSexo = data.sexo
    ? data.sexo.charAt(0).toUpperCase() + data.sexo.slice(1).toLowerCase()
    : ''

  let fechaNac = ''
  if (data.birthdate) {
    try {
      fechaNac = new Date(data.birthdate).toISOString().split('T')[0]
    } catch {
      fechaNac = ''
    }
  }

  return {
    id: data.id || data._id,
    nombre: data.name || data.nombre || '',
    apellido: data.lastname || data.apellido || '',
    email: data.email || '',
    telefono: data.telefono || '',
    dni: data.dni ? String(data.dni) : (data.dni === 0 ? '0' : ''),
    sexo: formattedSexo,
    fechaNacimiento: fechaNac,
    birthdate: data.birthdate,
    club: data.club || '',
    torneo: data.torneo || 'Ninguno',
    categoria: data.categoria || data.categoriaSingle || '',
    categoriaSingle: data.categoriaSingle || data.categoria || '',
    categoriaDobles: data.categoriaDobles || '',
    nombreEquipo: data.nombreEquipo || '',
    enJuegoSingle: data.enJuegoSingle ?? data.enJuego ?? false,
    enJuegoDobles: data.enJuegoDobles ?? false,
    activo: data.isActive ?? data.activo ?? true,
    isClient: data.isClient ?? false,
    rol: isAdmin ? 'admin' : 'user',
    organizationId: data.organizationId || null,
  }
}

/** GET /api/users/allUsers */
export async function getUsuarios() {
  if (USE_MOCK) {
    await delay(400)
    return mockUsuariosDb
  }
  const { data } = await apiClient.get('/users/allUsers')
  if (Array.isArray(data)) {
    return data.map(mapBackendUser)
  }
  return []
}

/** PATCH /api/users/:id */
export async function updateUsuario(id, payload) {
  if (USE_MOCK) {
    await delay(600)
    mockUsuariosDb = mockUsuariosDb.map((u) => (u.id === id ? { ...u, ...payload, id } : u))
    return { id, ...payload }
  }

  const body = {
    name: payload.nombre,
    lastname: payload.apellido,
    email: payload.email,
    telefono: payload.telefono?.trim() || '',
    roles: payload.rol === 'admin' ? ['ADMIN'] : ['USER'],
    isActive: String(payload.activo) === 'true',
    isClient: payload.isClient === true || payload.isClient === 'true',
  }

  if (payload.categoria) {
    body.categoria = payload.categoria
  }
  if (payload.sexo) {
    body.sexo = payload.sexo.toUpperCase()
  }
  if (payload.club) {
    body.club = payload.club
  }
  if (payload.fechaNacimiento || payload.birthdate) {
    body.birthdate = payload.fechaNacimiento || payload.birthdate
  }
  if (payload.dni !== undefined && payload.dni !== null && payload.dni !== '') {
    body.dni = Number(payload.dni)
  }
  if (payload.password) {
    body.password = payload.password
    body.confirmPassword = payload.confirmPassword || payload.password
  }
  if (payload.organizationId) {
    body.organizationId = payload.organizationId
  }

  const { data } = await apiClient.patch(`/users/${id}`, body)
  return mapBackendUser(data)
}

/** POST /api/users */
export async function crearUsuario(payload) {
  if (USE_MOCK) {
    await delay(600)
    const nuevo = { id: Date.now(), ...payload }
    mockUsuariosDb = [nuevo, ...mockUsuariosDb]
    return nuevo
  }

  const defaultPassword = payload.password || 'Usuario123*'

  const body = {
    name: payload.nombre,
    lastname: payload.apellido,
    email: payload.email,
    password: defaultPassword,
    confirmPassword: payload.confirmPassword || defaultPassword,
    roles: payload.rol === 'admin' ? ['ADMIN'] : ['USER'],
    isActive: String(payload.activo) === 'true',
    isClient: payload.isClient === true || payload.isClient === 'true',
  }

  if (payload.categoria) {
    body.categoria = payload.categoria
  }
  if (payload.sexo) {
    body.sexo = payload.sexo.toUpperCase()
  }
  if (payload.club) {
    body.club = payload.club
  }
  if (payload.fechaNacimiento || payload.birthdate) {
    body.birthdate = payload.fechaNacimiento || payload.birthdate
  }
  if (payload.dni !== undefined && payload.dni !== null && payload.dni !== '') {
    body.dni = Number(payload.dni)
  }
  if (payload.organizationId) {
    body.organizationId = payload.organizationId
  }

  const { data } = await apiClient.post('/users', body)
  return mapBackendUser(data)
}

/** DELETE /api/users/:id */
export async function eliminarUsuario(id) {
  if (USE_MOCK) {
    await delay(400)
    mockUsuariosDb = mockUsuariosDb.filter((u) => u.id !== id)
    return true
  }
  await apiClient.delete(`/users/${id}`)
  return true
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
