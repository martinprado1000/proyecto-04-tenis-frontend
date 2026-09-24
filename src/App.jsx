import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute, AdminRoute, SuperRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Perfil from './pages/Perfil'
import MisFechas from './pages/MisFechas'
import Resultados from './pages/Resultados'
import Estadisticas from './pages/Estadisticas'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminImportarUsuarios from './pages/admin/AdminImportarUsuarios'
import AdminFechas from './pages/admin/AdminFechas'
import AdminEquipos from './pages/admin/AdminEquipos'
import AdminTorneos from './pages/admin/AdminTorneos'
import AdminOrganizaciones from './pages/admin/AdminOrganizaciones'
import AdminAnalisisDeportivo from './pages/admin/AdminAnalisisDeportivo'
import AdminGestionCuotas from './pages/admin/AdminGestionCuotas'
import { getOrganizationBySlug } from './api/organizations.api'
import { RESERVED_SLUGS } from './hooks/useTenant'
import RecuperarPassword from './pages/RecuperarPassword'

function CatchAll() {
  const { isAuthenticated, isSuperadmin, user } = useAuth()

  if (isAuthenticated && isSuperadmin) {
    return <Navigate to="/SystemMP/dashboard" replace />
  }

  if (isAuthenticated && user?.organizationSlug) {
    return <Navigate to={`/${user.organizationSlug}/dashboard`} replace />
  }

  return <NotFound />
}

function SystemMPLoginRoute() {
  const { isAuthenticated, isSuperadmin, user } = useAuth()

  if (isAuthenticated && isSuperadmin) {
    return <Navigate to="/SystemMP/dashboard" replace />
  }

  if (isAuthenticated && user?.organizationSlug) {
    return <Navigate to={`/${user.organizationSlug}/dashboard`} replace />
  }

  return <Login />
}

function SystemLoginAliasRoute() {
  return <Navigate to="/SystemMP/login" replace />
}

function TenantIndexRoute() {
  const { tenantSlug } = useParams()
  const { isAuthenticated, isSuperadmin, user } = useAuth()
  const [organizationExists, setOrganizationExists] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!tenantSlug || RESERVED_SLUGS.has(tenantSlug.toLowerCase())) {
      setOrganizationExists(false)
      return
    }

    setOrganizationExists(null)
    getOrganizationBySlug(tenantSlug)
      .then(() => {
        if (!cancelled) setOrganizationExists(true)
      })
      .catch(() => {
        if (!cancelled) setOrganizationExists(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantSlug])

  if (organizationExists === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!organizationExists) {
    return <NotFound message={`La organización "${tenantSlug}" no existe.`} />
  }

  if (isAuthenticated && isSuperadmin) {
    return <Navigate to="/SystemMP/dashboard" replace />
  }

  if (isAuthenticated) {
    const org = user?.organizationSlug || tenantSlug
    return <Navigate to={`/${org}/dashboard`} replace />
  }

  return <Dashboard publicMode />
}

function TenantLoginRoute() {
  const { tenantSlug } = useParams()
  const { isAuthenticated, isSuperadmin, user } = useAuth()
  const [organizationExists, setOrganizationExists] = useState(null)

  useEffect(() => {
    let cancelled = false

    setOrganizationExists(null)
    getOrganizationBySlug(tenantSlug)
      .then(() => {
        if (!cancelled) setOrganizationExists(true)
      })
      .catch(() => {
        if (!cancelled) setOrganizationExists(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantSlug])

  if (organizationExists === null) return null

  if (!organizationExists) {
    return <NotFound message={`La organización "${tenantSlug}" no existe.`} />
  }

  if (isAuthenticated && isSuperadmin) {
    return <Navigate to="/SystemMP/dashboard" replace />
  }

  if (isAuthenticated) {
    return <Navigate to={`/${tenantSlug}/dashboard`} replace />
  }

  return <Login />
}

export default function App() {
  return (
    <Routes>
      <Route path="/SystemMP/login" element={<SystemMPLoginRoute />} />
      <Route path="/systemmp/login" element={<SystemLoginAliasRoute />} />
      <Route path="/SYSTEMMP/login" element={<SystemLoginAliasRoute />} />
      <Route path="/SystemMP" element={<SuperRoute><Layout /></SuperRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="mis-fechas" element={<MisFechas />} />
        <Route path="resultados" element={<Resultados />} />
        <Route path="admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
        <Route path="admin/importar_usuarios" element={<AdminRoute><AdminImportarUsuarios /></AdminRoute>} />
        <Route path="admin/fechas" element={<AdminRoute><AdminFechas /></AdminRoute>} />
        <Route path="admin/equipos" element={<AdminRoute><AdminEquipos /></AdminRoute>} />
        <Route path="admin/torneos" element={<AdminRoute><AdminTorneos /></AdminRoute>} />
        <Route path="admin/gestion_cuotas" element={<AdminRoute><AdminGestionCuotas /></AdminRoute>} />
        <Route path="admin/organizaciones" element={<SuperRoute><AdminOrganizaciones /></SuperRoute>} />
      </Route>

      <Route path="/:tenantSlug/login" element={<TenantLoginRoute />} />
      <Route path="/:tenantSlug/recuperar-contraseña" element={<RecuperarPassword />} />

      {/* Rutas de la Organización / Tenant */}
      <Route path="/:tenantSlug">
        {/* Acceso público directo /:tenantSlug */}
        <Route index element={<TenantIndexRoute />} />

        {/* Rutas autenticadas bajo /:tenantSlug/* con Navbar y Sidebar */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="mis-fechas" element={<MisFechas />} />
          <Route path="resultados" element={<Resultados />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="analisis-deportivo" element={<ProtectedRoute><AdminAnalisisDeportivo ownMode /></ProtectedRoute>} />
          <Route path="admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
          <Route path="admin/importar_usuarios" element={<AdminRoute><AdminImportarUsuarios /></AdminRoute>} />
          <Route path="admin/fechas" element={<AdminRoute><AdminFechas /></AdminRoute>} />
          <Route path="admin/equipos" element={<AdminRoute><AdminEquipos /></AdminRoute>} />
          <Route path="admin/torneos" element={<AdminRoute><AdminTorneos /></AdminRoute>} />
          <Route path="admin/gestion_cuotas" element={<AdminRoute><AdminGestionCuotas /></AdminRoute>} />
          <Route path="admin/analisis-deportivo" element={<AdminRoute><AdminAnalisisDeportivo /></AdminRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<CatchAll />} />
    </Routes>
  )
}
