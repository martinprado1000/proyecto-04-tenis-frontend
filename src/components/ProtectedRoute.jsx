import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RESERVED_SLUGS, isSystemPath, useTenant } from '../hooks/useTenant'
import NotFound from '../pages/NotFound'

function resolveLoginPath(tenantSlug, isSystem) {
  if (isSystem) return '/SystemMP/login'
  if (tenantSlug && !RESERVED_SLUGS.has(tenantSlug)) return `/${tenantSlug}/login`
  return null
}

export function SuperRoute({ children }) {
  const { isAuthenticated, isSuperadmin, user } = useAuth()
  const isSystem = isSystemPath(useLocation().pathname)

  if (!isAuthenticated) {
    return <Navigate to="/SystemMP/login" replace />
  }

  if (!isSuperadmin) {
    const slug = user?.organizationSlug
    if (slug) return <Navigate to={`/${slug}/resultados`} replace />
    return <Navigate to="/SystemMP/login" replace />
  }

  if (!isSystem) {
    return <Navigate to="/SystemMP/resultados" replace />
  }

  return children
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isSuperadmin, user } = useAuth()
  const { tenantSlug, isSystem } = useTenant()

  if (isSystem) {
    return <SuperRoute>{children}</SuperRoute>
  }

  if (!tenantSlug || RESERVED_SLUGS.has(tenantSlug)) {
    return <NotFound />
  }

  const loginTo = resolveLoginPath(tenantSlug, false)

  if (!isAuthenticated) {
    return loginTo ? <Navigate to={loginTo} replace /> : <NotFound />
  }

  if (isSuperadmin) {
    return <Navigate to="/SystemMP/resultados" replace />
  }

  if (user?.organizationSlug && tenantSlug !== user.organizationSlug) {
    return <Navigate to={`/${user.organizationSlug}/resultados`} replace />
  }

  return children
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isSuperadmin, user } = useAuth()
  const { tenantSlug, isSystem, tenantPath } = useTenant()

  if (isSystem) {
    return <SuperRoute>{children}</SuperRoute>
  }

  if (!tenantSlug || RESERVED_SLUGS.has(tenantSlug)) {
    return <NotFound />
  }

  const loginTo = resolveLoginPath(tenantSlug, false)

  if (!isAuthenticated) {
    return loginTo ? <Navigate to={loginTo} replace /> : <NotFound />
  }

  if (isSuperadmin) {
    return <Navigate to="/SystemMP/resultados" replace />
  }

  if (user?.organizationSlug && tenantSlug !== user.organizationSlug) {
    return <Navigate to={`/${user.organizationSlug}/resultados`} replace />
  }

  if (!isAdmin) {
    return <Navigate to={tenantPath('/resultados')} replace />
  }

  return children
}
