import { useLocation, useParams } from 'react-router-dom'

export const RESERVED_SLUGS = new Set(['login', 'perfil', 'mis-fechas', 'resultados', 'estadisticas', 'dashboard', 'admin'])

export function isSystemPath(pathname = '') {
  return pathname.split('/').filter(Boolean)[0]?.toLowerCase() === 'systemmp'
}

export function useTenant() {
  const { tenantSlug } = useParams()
  const { pathname } = useLocation()
  const isSystem = isSystemPath(pathname)

  const tenantPath = (path) => {
    if (tenantSlug && !RESERVED_SLUGS.has(tenantSlug.toLowerCase()) && !isSystem) return `/${tenantSlug}${path}`
    if (isSystem) return `/SystemMP${path}`
    return path
  }

  const loginPath = () => {
    if (isSystem) return '/SystemMP/login'
    if (tenantSlug && !RESERVED_SLUGS.has(tenantSlug.toLowerCase())) return `/${tenantSlug}/login`
    return null
  }

  return { tenantSlug, isSystem, tenantPath, loginPath }
}
