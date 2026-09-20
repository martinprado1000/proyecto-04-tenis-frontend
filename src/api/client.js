import axios from 'axios'

/**
 * Cliente HTTP centralizado. Reemplazá `baseURL` por la URL real de tu backend
 * (por ejemplo mediante una variable de entorno VITE_API_URL en un archivo .env).
 *
 *   VITE_API_URL=https://tu-api.com/api
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de request: adjunta el token guardado tras el login real.
apiClient.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem('mp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const firstPathSegment = window.location.pathname.split('/').filter(Boolean)[0]
  const reservedPaths = ['SystemMP', 'admin', 'login', 'perfil', 'mis-fechas', 'resultados', 'estadisticas']
  if (firstPathSegment && !reservedPaths.includes(firstPathSegment)) {
    config.headers['X-Tenant-Slug'] = firstPathSegment
  } else if (firstPathSegment === 'SystemMP') {
    delete config.headers['X-Tenant-Slug']
  }
  return config
})

// Interceptor de response: centralizá acá el manejo de errores 401/403, etc.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const saved = window.sessionStorage.getItem('mp_user')
      const orgSlug = saved ? JSON.parse(saved)?.organizationSlug : null
      window.sessionStorage.removeItem('mp_token')
      window.sessionStorage.removeItem('mp_user')
      const path = window.location.pathname
      if (!path.endsWith('/login')) {
        if (path.startsWith('/SystemMP')) {
          window.location.assign('/SystemMP/login')
        } else if (orgSlug) {
          window.location.assign(`/${orgSlug}/login`)
        }
      }
    }
    return Promise.reject(error)
  }
)
