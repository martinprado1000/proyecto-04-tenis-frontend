import { apiClient } from './client'

const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN', 'OPERATOR']

function mapBackendUser(data) {
  const roles = Array.isArray(data.roles) ? data.roles : [data.roles].filter(Boolean)
  const isAdmin = roles.some((r) => ADMIN_ROLES.includes(String(r).toUpperCase()))

  return {
    id: data.id,
    nombre: data.name,
    apellido: data.lastname,
    email: data.email,
    sexo: data.sexo,
    birthdate: data.birthdate,
    fechaNacimiento: data.birthdate ? new Date(data.birthdate).toISOString().split('T')[0] : data.fechaNacimiento,
    dni: data.dni,
    rol: isAdmin ? 'admin' : 'user',
    roles,
    isSuperadmin: roles.some((r) => String(r).toUpperCase() === 'SUPERADMIN'),
    activo: data.isActive ?? true,
    isClient: data.isClient ?? false,
    token: data.token,
    organizationId: data.organizationId || null,
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password })
  return mapBackendUser(data)
}

/**
 * POST /api/auth/register
 * Body del backend: { name, lastname, email, password, confirmPassword, sexo, birthdate, dni }
 */
export async function registro({ nombre, apellido, email, password, confirmPassword, sexo, fechaNacimiento, birthdate, dni }) {
  const payload = {
    name: nombre,
    lastname: apellido,
    email,
    password,
    confirmPassword: confirmPassword ?? password,
  }
  if (sexo) payload.sexo = sexo.toUpperCase()
  if (birthdate || fechaNacimiento) payload.birthdate = birthdate || fechaNacimiento
  if (dni) payload.dni = Number(dni)

  const { data } = await apiClient.post('/auth/register', payload)
  return mapBackendUser(data)
}
