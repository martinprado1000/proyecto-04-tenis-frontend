import { apiClient } from './client'

/** Obtiene el perfil real del usuario autenticado. */
export async function getPerfil(user) {
  const id = user?.id || user?._id
  if (!id) return user || {}
  const { data } = await apiClient.get(`/users/${id}`)
  return {
    ...data,
    id: data.id || data._id || id,
    nombre: data.name || data.nombre || '',
    apellido: data.lastname || data.apellido || '',
    fechaNacimiento: data.birthdate ? new Date(data.birthdate).toISOString().split('T')[0] : data.fechaNacimiento || '',
    dni: data.dni === undefined || data.dni === null ? '' : String(data.dni),
    sexo: data.sexo || '',
    telefono: data.telefono || '',
  }
}

/** Actualiza el perfil real del usuario autenticado. */
export async function updatePerfil(payload) {
  const id = payload?.id || payload?._id
  if (!id) throw new Error('No se encontró el identificador del usuario.')

  const body = {
    name: payload.nombre,
    lastname: payload.apellido,
    email: payload.email,
    telefono: payload.telefono?.trim() || '',
    sexo: payload.sexo?.toUpperCase(),
  }

  if (payload.dni !== undefined && payload.dni !== '') body.dni = Number(payload.dni)
  if (payload.fechaNacimiento) body.birthdate = payload.fechaNacimiento
  if (payload.password) {
    body.password = payload.password
    body.confirmPassword = payload.confirmPassword
  }

  const { data } = await apiClient.patch(`/users/${id}`, body)
  return data
}
